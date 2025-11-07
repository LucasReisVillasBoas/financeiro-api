import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ContasPagarRepository } from './conta-pagar.repository';
import { CreateContaPagarDto } from './dto/create-conta-pagar.dto';
import { UpdateContaPagarDto } from './dto/update-conta-pagar.dto';
import { CancelarContaPagarDto } from './dto/cancelar-conta-pagar.dto';
import { GerarParcelasDto } from './dto/gerar-parcelas.dto';
import { RegistrarBaixaDto } from './dto/registrar-baixa.dto';
import {
  ContasPagar,
  StatusContaPagar,
} from '../entities/conta-pagar/conta-pagar.entity';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { BaixaPagamento } from '../entities/baixa-pagamento/baixa-pagamento.entity';
import { MovimentacoesBancariasRepository } from '../movimentacao-bancaria/movimentacao-bancaria.repository';
import { ContasBancariasRepository } from '../conta-bancaria/conta-bancaria.repository';
import { BaixaPagamentoRepository } from '../baixa-pagamento/baixa-pagamento.repository';
import {
  AuditService,
  AuditEventType,
  AuditSeverity,
} from '../audit/audit.service';
import { MovimentacoesBancariasService } from '../movimentacao-bancaria/movimentacao-bancaria.service';
import { PessoaService } from '../pessoa/pessoa.service';
import { PlanoContasService } from '../plano-contas/plano-contas.service';
import { EmpresaService } from '../empresa/empresa.service';
import { UsuarioService } from '../usuario/usuario.service';

@Injectable()
export class ContasPagarService {
  constructor(
    @InjectRepository(ContasPagar)
    private readonly contaPagarRepository: ContasPagarRepository,
    @InjectRepository(MovimentacoesBancarias)
    private readonly movimentacaoRepository: MovimentacoesBancariasRepository,
    @InjectRepository(ContasBancarias)
    private readonly contaBancariaRepository: ContasBancariasRepository,
    @InjectRepository(BaixaPagamento)
    private readonly baixaPagamentoRepository: BaixaPagamentoRepository,
    private readonly auditService: AuditService,
    private readonly movimentacaoBancariaService: MovimentacoesBancariasService,
    private readonly pessoaService: PessoaService,
    private readonly planoContasService: PlanoContasService,
    private readonly empresaService: EmpresaService,
    private readonly usuarioService: UsuarioService,
  ) {}

  async create(dto: CreateContaPagarDto): Promise<ContasPagar> {
    this.validarOrdemDatas(
      new Date(dto.data_emissao),
      new Date(dto.vencimento),
      dto.data_liquidacao ? new Date(dto.data_liquidacao) : undefined,
    );

    const contaData: any = {
      documento: dto.documento,
      serie: dto.serie,
      parcela: dto.parcela,
      tipo: dto.tipo,
      descricao: dto.descricao,
      data_emissao: new Date(dto.data_emissao),
      vencimento: new Date(dto.vencimento),
      data_lancamento: new Date(dto.data_lancamento),
      data_liquidacao: dto.data_liquidacao
        ? new Date(dto.data_liquidacao)
        : undefined,
      valor_principal: dto.valor_principal,
      acrescimos: dto.acrescimos || 0,
      descontos: dto.descontos || 0,
      pessoa: await this.pessoaService.findOne(dto.pessoaId),
      planoContas: await this.planoContasService.findOne(dto.planoContasId),
      empresa: await this.empresaService.findOne(dto.empresaId),
    };

    const conta = this.contaPagarRepository.create(contaData);
    await this.contaPagarRepository.persistAndFlush(conta);
    return conta;
  }

  private validarOrdemDatas(
    dataEmissao: Date,
    vencimento: Date,
    dataLiquidacao?: Date,
  ): void {
    if (dataEmissao > vencimento) {
      throw new BadRequestException(
        'Data de emissão deve ser anterior ou igual ao vencimento',
      );
    }

    if (dataLiquidacao && vencimento > dataLiquidacao) {
      throw new BadRequestException(
        'Vencimento deve ser anterior ou igual à data de liquidação',
      );
    }
  }

  async findAll(): Promise<ContasPagar[]> {
    return await this.contaPagarRepository.find({ deletadoEm: null });
  }

  async findByEmpresa(empresaId: string): Promise<ContasPagar[]> {
    return await this.contaPagarRepository.find(
      { empresa: empresaId, deletadoEm: null },
      { populate: ['pessoa', 'planoContas', 'empresa'] },
    );
  }

  async findOne(id: string): Promise<ContasPagar> {
    const conta = await this.contaPagarRepository.findOne(
      { id, deletadoEm: null },
      { populate: ['pessoa', 'planoContas', 'empresa'] },
    );

    if (!conta) {
      throw new NotFoundException('Conta a pagar não encontrada');
    }

    return conta;
  }

  async update(id: string, dto: UpdateContaPagarDto): Promise<ContasPagar> {
    const conta = await this.findOne(id);

    if (conta.canceladoEm) {
      throw new ForbiddenException('Não é possível editar uma conta cancelada');
    }

    if (
      conta.data_liquidacao ||
      conta.status === StatusContaPagar.PAGA ||
      conta.status === StatusContaPagar.PARCIALMENTE_PAGA
    ) {
      throw new ForbiddenException(
        'Não é possível editar uma conta que já possui baixa registrada',
      );
    }

    const updateData: any = {};

    if (dto.documento !== undefined) updateData.documento = dto.documento;
    if (dto.serie !== undefined) updateData.serie = dto.serie;
    if (dto.parcela !== undefined) updateData.parcela = dto.parcela;
    if (dto.tipo !== undefined) updateData.tipo = dto.tipo;
    if (dto.descricao !== undefined) updateData.descricao = dto.descricao;

    if (dto.data_emissao) updateData.data_emissao = new Date(dto.data_emissao);
    if (dto.vencimento) updateData.vencimento = new Date(dto.vencimento);
    if (dto.data_lancamento)
      updateData.data_lancamento = new Date(dto.data_lancamento);
    if (dto.data_liquidacao)
      updateData.data_liquidacao = new Date(dto.data_liquidacao);

    if (dto.valor_principal !== undefined)
      updateData.valor_principal = dto.valor_principal;
    if (dto.acrescimos !== undefined) updateData.acrescimos = dto.acrescimos;
    if (dto.descontos !== undefined) updateData.descontos = dto.descontos;

    if (dto.pessoaId)
      updateData.pessoa = await this.pessoaService.findOne(dto.pessoaId);
    if (dto.planoContasId)
      updateData.planoContas = await this.planoContasService.findOne(
        dto.planoContasId,
      );
    if (dto.empresaId)
      updateData.empresa = await this.empresaService.findOne(dto.empresaId);

    if (dto.data_emissao || dto.vencimento || dto.data_liquidacao) {
      const dataEmissao = dto.data_emissao
        ? new Date(dto.data_emissao)
        : conta.data_emissao;
      const vencimento = dto.vencimento
        ? new Date(dto.vencimento)
        : conta.vencimento;
      const dataLiquidacao = dto.data_liquidacao
        ? new Date(dto.data_liquidacao)
        : conta.data_liquidacao;

      this.validarOrdemDatas(dataEmissao, vencimento, dataLiquidacao);
    }

    this.contaPagarRepository.assign(conta, updateData);
    await this.contaPagarRepository.flush();
    return conta;
  }

  async registrarPagamento(
    id: string,
    valorPago: number,
    dataLiquidacao: Date,
  ): Promise<ContasPagar> {
    const conta = await this.findOne(id);

    if (valorPago <= 0) {
      throw new BadRequestException('Valor pago deve ser maior que zero');
    }

    if (valorPago > conta.saldo) {
      throw new BadRequestException(
        `Valor pago (${valorPago}) não pode ser maior que o saldo devedor (${conta.saldo})`,
      );
    }

    conta.saldo -= valorPago;
    conta.data_liquidacao = dataLiquidacao;

    await this.contaPagarRepository.persistAndFlush(conta);
    return conta;
  }

  async marcarComoPaga(id: string): Promise<ContasPagar> {
    const conta = await this.findOne(id);
    conta.saldo = 0;
    conta.data_liquidacao = new Date();
    await this.contaPagarRepository.persistAndFlush(conta);
    return conta;
  }

  async softDelete(id: string): Promise<void> {
    const conta = await this.findOne(id);
    conta.deletadoEm = new Date();
    await this.contaPagarRepository.persistAndFlush(conta);
  }

  async cancelar(
    id: string,
    dto: CancelarContaPagarDto,
    userId: string | undefined,
    userEmail: string,
  ): Promise<ContasPagar> {
    const conta = await this.findOne(id);

    if (conta.canceladoEm) {
      throw new BadRequestException('Conta já está cancelada');
    }

    if (conta.deletadoEm) {
      throw new BadRequestException(
        'Não é possível cancelar uma conta deletada',
      );
    }

    conta.canceladoEm = new Date();
    conta.justificativaCancelamento = dto.justificativa;
    conta.status = 'Cancelada';

    await this.contaPagarRepository.persistAndFlush(conta);

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.CONTA_PAGAR_DELETED,
      severity: AuditSeverity.CRITICAL,
      resource: 'contas_pagar',
      action: 'CANCELAR',
      success: true,
      userId,
      userEmail,
      empresaId: conta.empresa.id,
      details: {
        message: `Conta a pagar ${conta.documento} (ID: ${conta.id}) cancelada`,
        contaId: conta.id,
        documento: conta.documento,
        parcela: conta.parcela,
        valorTotal: conta.valor_total,
        saldo: conta.saldo,
        justificativa: dto.justificativa,
        status: conta.status,
      },
    });

    return conta;
  }

  async gerarParcelas(dto: GerarParcelasDto): Promise<ContasPagar[]> {
    const parcelas: ContasPagar[] = [];
    const valorParcela = dto.valor_total / dto.numero_parcelas;
    const acrescimosParcela = (dto.acrescimos || 0) / dto.numero_parcelas;
    const descontosParcela = (dto.descontos || 0) / dto.numero_parcelas;

    for (let i = 1; i <= dto.numero_parcelas; i++) {
      const vencimento = new Date(dto.primeiro_vencimento);
      vencimento.setDate(vencimento.getDate() + (i - 1) * dto.intervalo_dias);

      const contaData: any = {
        documento: dto.documento,
        serie: dto.serie,
        parcela: i,
        tipo: dto.tipo,
        descricao: `${dto.descricao} - Parcela ${i}/${dto.numero_parcelas}`,
        data_emissao: new Date(dto.data_emissao),
        vencimento,
        data_lancamento: new Date(dto.data_lancamento),
        valor_principal: Number(valorParcela.toFixed(2)),
        acrescimos: Number(acrescimosParcela.toFixed(2)),
        descontos: Number(descontosParcela.toFixed(2)),
        pessoa: await this.pessoaService.findOne(dto.pessoaId),
        planoContas: await this.planoContasService.findOne(dto.planoContasId),
        empresa: await this.empresaService.findOne(dto.empresaId),
      };

      const conta = this.contaPagarRepository.create(contaData);
      parcelas.push(conta);
    }

    // Ajusta última parcela para compensar arredondamentos
    const totalCalculado = parcelas.reduce(
      (sum, p) => sum + p.valor_principal,
      0,
    );
    const diferenca = dto.valor_total - totalCalculado;
    if (Math.abs(diferenca) > 0.01) {
      parcelas[parcelas.length - 1].valor_principal += diferenca;
    }

    await this.contaPagarRepository.persistAndFlush(parcelas);
    return parcelas;
  }

  async registrarBaixa(
    id: string,
    dto: RegistrarBaixaDto,
    userId: string | undefined,
    userEmail: string,
  ): Promise<{
    conta: ContasPagar;
    movimentacao: MovimentacoesBancarias;
    baixa: BaixaPagamento;
  }> {
    const conta = await this.findOne(id);

    if (conta.canceladoEm) {
      throw new BadRequestException(
        'Não é possível registrar baixa em conta cancelada',
      );
    }

    if (dto.valorPago > conta.saldo) {
      throw new BadRequestException(
        `Valor pago (${dto.valorPago}) não pode ser maior que o saldo devedor (${conta.saldo})`,
      );
    }

    const contaBancaria = await this.contaBancariaRepository.findOne({
      id: dto.contaBancariaId,
      deletadoEm: null,
    });

    if (!contaBancaria) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    if (contaBancaria.saldo_atual < dto.valorPago) {
      throw new BadRequestException(
        `Saldo insuficiente na conta bancária. Saldo: ${contaBancaria.saldo_atual}, Necessário: ${dto.valorPago}`,
      );
    }

    const saldoAnterior = conta.saldo;

    const movimentacao = this.movimentacaoRepository.create({
      data: new Date(dto.dataPagamento),
      descricao:
        dto.observacao ||
        `Pagamento ${conta.documento} - Parcela ${conta.parcela}`,
      conta: contaBancaria.banco,
      categoria: 'Pagamento Fornecedor',
      valor: dto.valorPago,
      tipo: 'Saída', // Débito
      contaBancaria,
      empresaId: conta.empresa.id,
      planoContas: conta.planoContas,
    });

    await this.movimentacaoRepository.persistAndFlush(movimentacao);

    const novoSaldoBancario = contaBancaria.saldo_atual - dto.valorPago;
    this.contaBancariaRepository.assign(contaBancaria, {
      saldo_atual: novoSaldoBancario,
    });

    const novoSaldoConta = conta.saldo - dto.valorPago;
    this.contaPagarRepository.assign(conta, {
      saldo: novoSaldoConta,
      data_liquidacao: new Date(dto.dataPagamento),
      movimentacaoBancariaId: movimentacao.id,
    });

    const baixa = this.baixaPagamentoRepository.create({
      contaPagar: conta,
      contaBancaria,
      data: new Date(dto.dataPagamento),
      valor: dto.valorPago,
      acrescimos: 0,
      descontos: 0,
      observacao: dto.observacao,
      movimentacaoBancariaId: movimentacao.id,
      saldo_anterior: saldoAnterior,
      saldo_posterior: novoSaldoConta,
      criadoPorId: userId || undefined,
    });

    await this.baixaPagamentoRepository.persistAndFlush(baixa);

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.CONTA_PAGAR_UPDATED,
      severity: AuditSeverity.INFO,
      resource: 'contas_pagar',
      action: 'REGISTRAR_BAIXA',
      success: true,
      userId,
      userEmail,
      empresaId: conta.empresa.id,
      details: {
        message: `Baixa registrada para conta ${conta.documento} - Parcela ${conta.parcela}`,
        contaId: conta.id,
        valorPago: dto.valorPago,
        saldoRestante: conta.saldo,
        contaBancariaId: contaBancaria.id,
        movimentacaoId: movimentacao.id,
        baixaId: baixa.id,
      },
    });

    return { conta, movimentacao, baixa };
  }

  async estornarBaixa(
    id: string,
    justificativa: string,
    userId: string | undefined,
  ): Promise<ContasPagar> {
    let email = '';
    if (userId) {
      const user = await this.usuarioService.getById(userId);
      email = user.email;
    }
    const conta = await this.findOne(id);

    if (!conta.data_liquidacao) {
      throw new BadRequestException(
        'Conta não possui baixa registrada para estornar',
      );
    }

    if (!conta.movimentacaoBancariaId) {
      throw new BadRequestException(
        'Conta não possui movimentação bancária vinculada',
      );
    }

    const movimentacao = await this.movimentacaoRepository.findOne({
      id: conta.movimentacaoBancariaId,
      deletadoEm: null,
    });

    if (!movimentacao) {
      throw new NotFoundException('Movimentação bancária não encontrada');
    }

    const contaBancaria = await this.contaBancariaRepository.findOne({
      id: movimentacao.contaBancaria.id,
    });

    if (!contaBancaria) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    const baixas = await this.baixaPagamentoRepository.find({
      contaPagar: conta.id,
      deletadoEm: null,
    });

    const valorEstornado = conta.valor_total - conta.saldo;

    contaBancaria.saldo_atual += valorEstornado;

    baixas.forEach((baixa) => {
      baixa.deletadoEm = new Date();
    });

    conta.saldo = conta.valor_total;
    conta.data_liquidacao = undefined;
    conta.movimentacaoBancariaId = undefined;
    conta.status = StatusContaPagar.PENDENTE;

    await this.movimentacaoBancariaService.create({
      dataMovimento: new Date().toString(),
      data: new Date().toString(), // Compatibilidade
      descricao: 'Estorno',
      conta: `${contaBancaria.conta}-${contaBancaria.conta_digito}`,
      categoria: movimentacao.categoria,
      valor: valorEstornado,
      tipoMovimento: 'Entrada',
      tipo: 'Entrada', // Compatibilidade
      contaBancaria: contaBancaria.id,
      empresaId: movimentacao.empresaId,
      referencia: 'Pagar' as any,
    } as any);

    await this.contaBancariaRepository.persistAndFlush(contaBancaria);
    await this.movimentacaoRepository.persistAndFlush(movimentacao);
    await this.contaPagarRepository.persistAndFlush(conta);
    await this.baixaPagamentoRepository.persistAndFlush(baixas);

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.CONTA_PAGAR_UPDATED,
      severity: AuditSeverity.CRITICAL,
      resource: 'contas_pagar',
      action: 'ESTORNAR_BAIXA',
      success: true,
      userId,
      userEmail: email,
      empresaId: conta.empresa.id,
      details: {
        message: `Baixa estornada para conta ${conta.documento} - Parcela ${conta.parcela}`,
        contaId: conta.id,
        valorEstornado,
        justificativa,
        movimentacaoId: movimentacao.id,
        contaBancariaId: contaBancaria.id,
        baixasEstornadas: baixas.length,
      },
    });

    return conta;
  }
}
