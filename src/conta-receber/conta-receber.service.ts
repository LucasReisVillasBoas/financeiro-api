import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { ContasReceberRepository } from './conta-receber.repository';
import { CreateContaReceberDto } from './dto/create-conta-receber.dto';
import { UpdateContaReceberDto } from './dto/update-conta-receber.dto';
import { CreateContaReceberParceladaDto } from './dto/create-conta-receber-parcelada.dto';
import { CancelarContaReceberDto } from './dto/cancelar-conta-receber.dto';
import { ContasReceber, StatusContaReceber } from '../entities/conta-receber/conta-receber.entity';
import { PlanoContas } from '../entities/plano-contas/plano-contas.entity';
import { Pessoa } from '../entities/pessoa/pessoa.entity';
import { AuditService, AuditEventType, AuditSeverity } from '../audit/audit.service';

@Injectable()
export class ContasReceberService {
  constructor(
    @InjectRepository(ContasReceber)
    private readonly contasReceberRepository: ContasReceberRepository,
    private readonly em: EntityManager,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Valida se as datas seguem a regra: data_emissao <= vencimento <= data_liquidacao
   */
  private validarDatas(
    dataEmissao: Date,
    vencimento: Date,
    dataLiquidacao?: Date,
  ): void {
    if (dataEmissao > vencimento) {
      throw new BadRequestException(
        'Data de emissão deve ser menor ou igual à data de vencimento',
      );
    }

    if (dataLiquidacao && vencimento > dataLiquidacao) {
      throw new BadRequestException(
        'Data de vencimento deve ser menor ou igual à data de liquidação',
      );
    }
  }

  /**
   * Calcula o saldo inicial como valor_total
   */
  private calcularSaldoInicial(
    valorPrincipal: number,
    valorAcrescimos: number = 0,
    valorDescontos: number = 0,
  ): number {
    return valorPrincipal + valorAcrescimos - valorDescontos;
  }

  async create(dto: CreateContaReceberDto): Promise<ContasReceber> {
    const dataEmissao = new Date(dto.dataEmissao);
    const vencimento = new Date(dto.vencimento);
    const dataLiquidacao = dto.dataLiquidacao
      ? new Date(dto.dataLiquidacao)
      : undefined;

    // Valida as datas
    this.validarDatas(dataEmissao, vencimento, dataLiquidacao);

    // Calcula o valor total se não foi fornecido
    const valorAcrescimos = dto.valorAcrescimos || 0;
    const valorDescontos = dto.valorDescontos || 0;
    const valorTotal = dto.valorTotal || this.calcularSaldoInicial(
      dto.valorPrincipal,
      valorAcrescimos,
      valorDescontos,
    );

    // Valida que o valor total está correto
    const valorTotalCalculado = this.calcularSaldoInicial(
      dto.valorPrincipal,
      valorAcrescimos,
      valorDescontos,
    );
    if (Math.abs(valorTotal - valorTotalCalculado) > 0.01) {
      throw new BadRequestException(
        `Valor total informado (${valorTotal}) não corresponde ao cálculo (${valorTotalCalculado})`,
      );
    }

    // Obtém as referências
    const pessoa = this.em.getReference(Pessoa, dto.pessoaId);
    const planoContas = this.em.getReference(PlanoContas, dto.planoContasId);

    // Cria a conta a receber
    const contaData: any = {
      descricao: dto.descricao,
      pessoa,
      planoContas,
      documento: dto.documento,
      serie: dto.serie,
      parcela: dto.parcela,
      tipo: dto.tipo,
      dataEmissao,
      dataLancamento: new Date(dto.dataLancamento),
      vencimento,
      dataLiquidacao,
      valorPrincipal: dto.valorPrincipal,
      valorAcrescimos,
      valorDescontos,
      valorTotal,
      saldo: dto.saldo || valorTotal, // Saldo inicial = valor_total
      status: dto.status || StatusContaReceber.PENDENTE,
    };

    if (dto.empresaId) {
      contaData.empresa = this.em.getReference('Empresa', dto.empresaId);
    }

    const conta = this.contasReceberRepository.create(contaData);

    await this.contasReceberRepository.persistAndFlush(conta);
    return conta;
  }

  async findAll(): Promise<ContasReceber[]> {
    return await this.contasReceberRepository.find(
      { deletadoEm: null },
      { populate: ['pessoa', 'planoContas'] },
    );
  }

  async findByEmpresa(empresaId: string): Promise<ContasReceber[]> {
    return await this.contasReceberRepository.find(
      {
        empresa: { id: empresaId },
        deletadoEm: null,
      },
      { populate: ['pessoa', 'planoContas'] },
    );
  }

  async findOne(id: string): Promise<ContasReceber> {
    const conta = await this.contasReceberRepository.findOne(
      {
        id,
        deletadoEm: null,
      },
      { populate: ['pessoa', 'planoContas'] },
    );

    if (!conta) {
      throw new NotFoundException('Conta a receber não encontrada');
    }

    return conta;
  }

  async update(id: string, dto: UpdateContaReceberDto): Promise<ContasReceber> {
    const conta = await this.findOne(id);

    // BLOQUEIO: Não permite editar título com baixa registrada
    if (conta.dataLiquidacao || conta.status === StatusContaReceber.LIQUIDADO || conta.status === StatusContaReceber.PARCIAL) {
      throw new ForbiddenException(
        'Não é permitido alterar título que já possui baixa registrada. Status atual: ' + conta.status,
      );
    }

    // Valida as datas se foram fornecidas
    const dataEmissao = dto.dataEmissao ? new Date(dto.dataEmissao) : conta.dataEmissao;
    const vencimento = dto.vencimento ? new Date(dto.vencimento) : conta.vencimento;
    const dataLiquidacao = dto.dataLiquidacao
      ? new Date(dto.dataLiquidacao)
      : conta.dataLiquidacao;

    this.validarDatas(dataEmissao, vencimento, dataLiquidacao);

    // Recalcula valores se necessário
    if (
      dto.valorPrincipal !== undefined ||
      dto.valorAcrescimos !== undefined ||
      dto.valorDescontos !== undefined
    ) {
      const valorPrincipal = dto.valorPrincipal ?? conta.valorPrincipal;
      const valorAcrescimos = dto.valorAcrescimos ?? conta.valorAcrescimos;
      const valorDescontos = dto.valorDescontos ?? conta.valorDescontos;
      const valorTotal = this.calcularSaldoInicial(
        valorPrincipal,
        valorAcrescimos,
        valorDescontos,
      );

      conta.valorPrincipal = valorPrincipal;
      conta.valorAcrescimos = valorAcrescimos;
      conta.valorDescontos = valorDescontos;
      conta.valorTotal = valorTotal;
    }

    // Atualiza os campos fornecidos
    if (dto.descricao) conta.descricao = dto.descricao;
    if (dto.pessoaId) conta.pessoa = this.em.getReference(Pessoa, dto.pessoaId);
    if (dto.planoContasId) conta.planoContas = this.em.getReference(PlanoContas, dto.planoContasId);
    if (dto.documento) conta.documento = dto.documento;
    if (dto.serie !== undefined) conta.serie = dto.serie;
    if (dto.parcela) conta.parcela = dto.parcela;
    if (dto.tipo) conta.tipo = dto.tipo;
    if (dto.dataEmissao) conta.dataEmissao = dataEmissao;
    if (dto.dataLancamento) conta.dataLancamento = new Date(dto.dataLancamento);
    if (dto.vencimento) conta.vencimento = vencimento;
    if (dto.dataLiquidacao) conta.dataLiquidacao = dataLiquidacao;
    if (dto.saldo !== undefined) conta.saldo = dto.saldo;
    if (dto.status) conta.status = dto.status;

    await this.contasReceberRepository.flush();
    return conta;
  }

  async liquidar(id: string, valorRecebido: number, dataLiquidacao?: Date): Promise<ContasReceber> {
    const conta = await this.findOne(id);

    if (conta.status === StatusContaReceber.LIQUIDADO) {
      throw new BadRequestException('Conta já está liquidada');
    }

    if (valorRecebido <= 0) {
      throw new BadRequestException('Valor recebido deve ser maior que zero');
    }

    const novoSaldo = conta.saldo - valorRecebido;

    if (novoSaldo < 0) {
      throw new BadRequestException('Valor recebido maior que o saldo da conta');
    }

    conta.saldo = novoSaldo;
    conta.dataLiquidacao = dataLiquidacao || new Date();

    if (novoSaldo === 0) {
      conta.status = StatusContaReceber.LIQUIDADO;
    } else if (novoSaldo < conta.valorTotal) {
      conta.status = StatusContaReceber.PARCIAL;
    }

    await this.contasReceberRepository.persistAndFlush(conta);
    return conta;
  }

  /**
   * Cria múltiplas contas a receber parceladas automaticamente
   */
  async createParcelado(dto: CreateContaReceberParceladaDto, usuarioId?: string): Promise<ContasReceber[]> {
    const dataEmissao = new Date(dto.dataEmissao);
    const dataLancamento = new Date(dto.dataLancamento);
    const primeiroVencimento = new Date(dto.primeiroVencimento);

    // Valida as datas
    this.validarDatas(dataEmissao, primeiroVencimento);

    // Calcula o valor de cada parcela
    const valorParcela = Number((dto.valorTotal / dto.numeroParcelas).toFixed(2));
    const diferenca = Number((dto.valorTotal - (valorParcela * dto.numeroParcelas)).toFixed(2));

    // Obtém as referências
    const pessoa = this.em.getReference(Pessoa, dto.pessoaId);
    const planoContas = this.em.getReference(PlanoContas, dto.planoContasId);

    const parcelas: ContasReceber[] = [];

    for (let i = 1; i <= dto.numeroParcelas; i++) {
      // Calcula a data de vencimento da parcela
      const vencimento = new Date(primeiroVencimento);
      vencimento.setDate(vencimento.getDate() + (i - 1) * dto.intervaloDias);

      // Ajusta o valor da última parcela para compensar arredondamentos
      const valorPrincipal = i === dto.numeroParcelas
        ? Number((valorParcela + diferenca).toFixed(2))
        : valorParcela;

      const contaData: any = {
        descricao: `${dto.descricao} - Parcela ${i}/${dto.numeroParcelas}`,
        pessoa,
        planoContas,
        documento: dto.documento,
        serie: dto.serie,
        parcela: i,
        tipo: dto.tipo,
        dataEmissao,
        dataLancamento,
        vencimento,
        valorPrincipal,
        valorAcrescimos: 0,
        valorDescontos: 0,
        valorTotal: valorPrincipal,
        saldo: valorPrincipal,
        status: StatusContaReceber.PENDENTE,
      };

      if (dto.empresaId) {
        contaData.empresa = this.em.getReference('Empresa', dto.empresaId);
      }

      const parcela = this.contasReceberRepository.create(contaData);
      parcelas.push(parcela);
    }

    await this.contasReceberRepository.persistAndFlush(parcelas);

    // Registra auditoria
    if (usuarioId) {
      await this.auditService.log({
        eventType: AuditEventType.CONTA_RECEBER_CREATED,
        severity: AuditSeverity.INFO,
        userId: usuarioId,
        empresaId: dto.empresaId,
        details: {
          documento: dto.documento,
          numeroParcelas: dto.numeroParcelas,
          valorTotal: dto.valorTotal,
          pessoaId: dto.pessoaId,
        },
        success: true,
        timestamp: new Date(),
      });
    }

    return parcelas;
  }

  /**
   * Cancela uma conta a receber com justificativa e auditoria
   */
  async cancelar(id: string, dto: CancelarContaReceberDto, usuarioId?: string): Promise<ContasReceber> {
    const conta = await this.findOne(id);

    // Valida se pode ser cancelada
    if (conta.status === StatusContaReceber.CANCELADO) {
      throw new BadRequestException('Esta conta já está cancelada');
    }

    if (conta.status === StatusContaReceber.LIQUIDADO) {
      throw new ForbiddenException(
        'Não é permitido cancelar título que já foi liquidado. Faça o estorno da baixa primeiro.',
      );
    }

    if (conta.status === StatusContaReceber.PARCIAL) {
      throw new ForbiddenException(
        'Não é permitido cancelar título com baixa parcial. Faça o estorno da baixa primeiro.',
      );
    }

    // Registra o status anterior para auditoria
    const statusAnterior = conta.status;

    // Cancela a conta
    conta.status = StatusContaReceber.CANCELADO;
    await this.contasReceberRepository.persistAndFlush(conta);

    // Registra auditoria obrigatória
    if (usuarioId) {
      await this.auditService.log({
        eventType: AuditEventType.CONTA_RECEBER_CANCELADA,
        severity: AuditSeverity.WARNING,
        userId: usuarioId,
        empresaId: conta.empresa?.id,
        details: {
          contaId: conta.id,
          documento: conta.documento,
          parcela: conta.parcela,
          valorTotal: conta.valorTotal,
          statusAnterior,
          justificativa: dto.justificativa,
          pessoaId: conta.pessoa.id,
        },
        success: true,
        timestamp: new Date(),
      });
    } else {
      throw new BadRequestException('Usuário não identificado para registrar auditoria do cancelamento');
    }

    return conta;
  }

  async softDelete(id: string): Promise<void> {
    const conta = await this.findOne(id);
    conta.deletadoEm = new Date();
    await this.contasReceberRepository.persistAndFlush(conta);
  }
}
