import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ContasBancariasRepository } from './conta-bancaria.repository';
import { CreateContaBancariaDto } from './dto/create-conta-bancaria.dto';
import { UpdateContaBancariaDto } from './dto/update-conta-bancaria.dto';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { EmpresaService } from '../empresa/empresa.service';
import { AuditService } from '../audit/audit.service';
import { UsuarioService } from '../usuario/usuario.service';
import { PerfilService } from '../perfil/perfil.service';

@Injectable()
export class ContasBancariasService {
  constructor(
    @InjectRepository(ContasBancarias)
    private readonly contasBancariasRepository: ContasBancariasRepository,
    private readonly empresaService: EmpresaService,
    private readonly auditService: AuditService,
    private readonly usuarioService: UsuarioService,
    private readonly perfilService: PerfilService,
  ) {}

  async create(dto: CreateContaBancariaDto): Promise<ContasBancarias> {
    const empresa = await this.empresaService.findOne(dto.empresaId);
    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const user = await this.usuarioService.getById(dto.cliente_id);

    const whereCondition: any = {
      cliente_id: dto.cliente_id,
      empresa: dto.empresaId,
      banco: dto.banco,
      agencia: dto.agencia,
      conta: dto.conta,
      deletadoEm: null,
    };

    if (dto.conta_digito) {
      whereCondition.conta_digito = dto.conta_digito;
    }

    const contaDuplicada =
      await this.contasBancariasRepository.findOne(whereCondition);

    if (contaDuplicada) {
      throw new BadRequestException(
        'Já existe uma conta bancária com estes dados cadastrada no sistema',
      );
    }

    const { empresaId, ...dadosConta } = dto;
    const conta = this.contasBancariasRepository.create({
      ...dadosConta,
      empresa,
      data_referencia_saldo: new Date(dto.data_referencia_saldo),
      saldo_atual: dto.saldo_inicial,
    });
    await this.contasBancariasRepository.persistAndFlush(conta);

    await this.auditService.logEntityCreated(
      'CONTA_BANCARIA',
      conta.id,
      dto.cliente_id,
      user.email,
      dto.empresaId,
      {
        banco: conta.banco,
        agencia: conta.agencia,
        conta: conta.conta,
        saldo_inicial: conta.saldo_inicial,
      },
    );

    return conta;
  }

  async findAll(): Promise<ContasBancarias[]> {
    return await this.contasBancariasRepository.find({
      deletadoEm: null,
    });
  }

  async findByEmpresa(empresaId: string): Promise<ContasBancarias[]> {
    const empresas = await this.contasBancariasRepository.find({
      empresa: empresaId,
      deletadoEm: null,
    });

    return empresas ?? [];
  }

  async findOne(id: string): Promise<ContasBancarias> {
    const conta = await this.contasBancariasRepository.findOne({
      id,
      deletadoEm: null,
    });

    if (!conta) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    return conta;
  }

  async update(
    id: string,
    dto: UpdateContaBancariaDto,
  ): Promise<ContasBancarias> {
    const conta = await this.findOne(id);
    const usuario = await this.usuarioService.getById(dto.cliente_id);

    if (
      dto.saldo_inicial !== undefined &&
      dto.saldo_inicial !== conta.saldo_inicial
    ) {
      const saldoAnterior = conta.saldo_inicial;

      await this.auditService.logSaldoInicialUpdated(
        conta.id,
        usuario.id,
        usuario.email,
        conta.empresa.id,
        saldoAnterior,
        dto.saldo_inicial,
      );
    }

    this.contasBancariasRepository.assign(conta, dto);
    await this.contasBancariasRepository.flush();
    return conta;
  }

  /**
   * Atualiza o saldo_atual da conta bancária
   * Usado pelas movimentações bancárias
   */
  async atualizarSaldoAtual(
    id: string,
    novoSaldo: number,
  ): Promise<ContasBancarias> {
    const conta = await this.findOne(id);
    conta.saldo_atual = novoSaldo;
    await this.contasBancariasRepository.flush();
    return conta;
  }

  /**
   * Atualiza o saldo_inicial da conta bancária com auditoria
   * Requer permissões especiais e sempre gera log de auditoria
   */
  async atualizarSaldoInicial(
    id: string,
    novoSaldoInicial: number,
    userId: string,
    userEmail: string,
    motivo?: string,
  ): Promise<ContasBancarias> {
    const conta = await this.findOne(id);

    const userPerfis = await this.perfilService.findByCliente(userId);
    const admin = userPerfis.filter(
      (perfil) =>
        perfil.nome === 'Admnistrador' || perfil.nome === 'Financeiro',
    );
    if (admin.length === 0) {
      throw new ForbiddenException(
        'Usuário não possui permissão para alterar saldo inicial',
      );
    }

    const saldoAnterior = conta.saldo_inicial;
    const diferenca = novoSaldoInicial - saldoAnterior;

    conta.saldo_inicial = novoSaldoInicial;
    conta.saldo_atual = conta.saldo_atual + diferenca;
    conta.data_referencia_saldo = new Date();

    await this.contasBancariasRepository.flush();

    await this.auditService.logSaldoInicialUpdated(
      conta.id,
      userId,
      userEmail,
      conta.empresa.id,
      saldoAnterior,
      novoSaldoInicial,
      motivo,
    );

    return conta;
  }

  async toggleStatus(
    id: string,
    userId?: string,
    userEmail?: string,
  ): Promise<ContasBancarias> {
    const conta = await this.findOne(id);
    const statusAnterior = conta.ativo;
    conta.ativo = !conta.ativo;
    await this.contasBancariasRepository.persistAndFlush(conta);

    // Auditoria da alteração de status
    if (userId && userEmail) {
      await this.auditService.logEntityUpdated(
        'CONTA_BANCARIA',
        conta.id,
        userId,
        userEmail,
        conta.empresa.id,
        {
          acao: 'TOGGLE_STATUS',
          statusAnterior,
          statusNovo: conta.ativo,
          banco: conta.banco,
          conta: conta.conta,
        },
      );
    }

    return conta;
  }

  async softDelete(
    id: string,
    userId?: string,
    userEmail?: string,
  ): Promise<void> {
    const conta = await this.findOne(id);
    conta.deletadoEm = new Date();
    conta.ativo = false;
    await this.contasBancariasRepository.persistAndFlush(conta);

    // Auditoria crítica da exclusão
    if (userId && userEmail) {
      await this.auditService.logEntityDeleted(
        'CONTA_BANCARIA',
        conta.id,
        userId,
        userEmail,
        conta.empresa.id,
        {
          banco: conta.banco,
          agencia: conta.agencia,
          conta: conta.conta,
          saldo_inicial: conta.saldo_inicial,
          saldo_atual: conta.saldo_atual,
          descricao: conta.descricao,
        },
      );
    }
  }
}
