import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { EmpresaRepository } from './empresa.repository';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Empresa } from '../entities/empresa/empresa.entity';
import { Contato } from '../entities/contato/contato.entity';
import { Usuario } from '../entities/usuario/usuario.entity';
import { isValidCnpjCpf, normalizeCnpjCpf } from '../utils/empresa.util';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { UsuarioEmpresaFilialRepository } from '../usuario/usuario-empresa-filial.repository';
import { AuditService } from '../audit/audit.service';

export interface CreateFilialResult {
  filial: Empresa;
  contato?: Contato;
}

@Injectable()
export class EmpresaService {
  constructor(
    private readonly em: EntityManager,
    private readonly empresaRepo: EmpresaRepository,
    @InjectRepository(UsuarioEmpresaFilial)
    private readonly usuarioEmpresaFilialRepository: UsuarioEmpresaFilialRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateEmpresaDto): Promise<Empresa> {
    if (!isValidCnpjCpf(dto.cnpj_cpf)) {
      throw new BadRequestException('CNPJ/CPF em formato inválido.');
    }

    // Busca por duplicidade usando valor normalizado (sem máscara)
    const cnpjNorm = normalizeCnpjCpf(dto.cnpj_cpf);
    const empresas = await this.empresaRepo.find({
      cliente_id: dto.cliente_id,
      ativo: true,
    });

    const exists = empresas.find(
      (e) => normalizeCnpjCpf(e.cnpj_cpf) === cnpjNorm,
    );

    if (exists) {
      throw new BadRequestException(
        'Empresa com este CNPJ/CPF já existe para o cliente.',
      );
    }

    // Salva COM a máscara original
    const entity = this.empresaRepo.create(dto);
    await this.empresaRepo.persistAndFlush(entity);
    return entity;
  }

  async createFilial(
    dto: CreateFilialDto,
    usuarioId?: string,
  ): Promise<CreateFilialResult> {
    if (!isValidCnpjCpf(dto.cnpj_cpf)) {
      throw new BadRequestException('CNPJ/CPF em formato inválido.');
    }

    const sede = await this.empresaRepo.findOne({
      id: dto.empresa_id,
      ativo: true,
    });
    if (!sede) throw new NotFoundException('Sede não encontrada.');

    // Compara usando valor normalizado (sem máscara)
    const cnpjNorm = normalizeCnpjCpf(dto.cnpj_cpf);
    const sedeCnpjNorm = normalizeCnpjCpf(sede.cnpj_cpf);

    if (sedeCnpjNorm === cnpjNorm) {
      throw new BadRequestException(
        'Filial não pode ter o mesmo CNPJ/CPF da sede.',
      );
    }

    // Busca todas empresas ativas e compara normalizado
    const empresas = await this.empresaRepo.find({ ativo: true });
    const exists = empresas.find(
      (e) => normalizeCnpjCpf(e.cnpj_cpf) === cnpjNorm,
    );

    if (exists) {
      throw new BadRequestException(
        'Já existe empresa/filial com esse CNPJ/CPF.',
      );
    }

    // Extrai contato do DTO (se existir)
    const { contato: contatoDto, ...filialData } = dto;

    // Executa em transação
    return await this.em.transactional(async (em) => {
      // 1. Cria a filial
      const filial = em.create(Empresa, {
        ...filialData,
        sede,
      });
      em.persist(filial);

      // 2. Cria o contato (se fornecido)
      let contato: Contato | undefined;
      if (contatoDto) {
        contato = em.create(Contato, {
          nome: contatoDto.nome,
          email: contatoDto.email,
          telefone: contatoDto.telefone || '',
          celular: contatoDto.celular || '',
          funcao: contatoDto.funcao || '',
          filial,
          cliente: usuarioId ? em.getReference(Usuario, usuarioId) : undefined,
        });
        em.persist(contato);
      }

      await em.flush();

      return { filial, contato };
    });
  }

  async findAllByCliente(cliente_id: string): Promise<Empresa[]> {
    const empresa = await this.empresaRepo.find({ cliente_id, ativo: true });
    return empresa;
  }

  async findByUsuarioId(usuarioId: string): Promise<Empresa[]> {
    const associacoes = await this.usuarioEmpresaFilialRepository.find(
      { usuario: { id: usuarioId } },
      { populate: ['empresa'] },
    );

    if (!associacoes.length) {
      return [];
    }

    const empresaIds = associacoes.map((assoc: any) => assoc.empresa);
    const empresas = await this.empresaRepo.find({
      id: { $in: empresaIds },
      ativo: true,
    });

    return empresas;
  }

  async findAllByEmpresaIds(empresaIds: string[]): Promise<Empresa[]> {
    if (!empresaIds.length) return [];
    return this.empresaRepo.find({
      id: { $in: empresaIds },
      ativo: true,
    });
  }

  async findAllByClienteAndEmpresaIds(
    cliente_id: string,
    empresaIds: string[],
  ): Promise<Empresa[]> {
    if (!empresaIds.length) return [];
    return this.empresaRepo.find({
      cliente_id,
      id: { $in: empresaIds },
      ativo: true,
    });
  }

  async findOne(id: string): Promise<Empresa> {
    const empresa = await this.empresaRepo.findOne({ id, ativo: true });
    if (!empresa) return null;
    return empresa;
  }

  async findByDocument(cnpj: string): Promise<Empresa> {
    // Busca normalizando para encontrar independente da formatação
    const cnpjNorm = normalizeCnpjCpf(cnpj);
    const empresas = await this.empresaRepo.find({ ativo: true });
    const empresa = empresas.find(
      (e) => normalizeCnpjCpf(e.cnpj_cpf) === cnpjNorm,
    );
    if (!empresa) throw new NotFoundException('Empresa não encontrada.');
    return empresa;
  }

  async findOneWithAccess(
    id: string,
    userEmpresaIds: string[],
  ): Promise<Empresa> {
    const empresa = await this.empresaRepo.findOne({ id, ativo: true });
    if (!empresa) throw new NotFoundException('Empresa não encontrada.');

    const hasAccess =
      userEmpresaIds.includes(id) ||
      (empresa.sede && userEmpresaIds.includes(empresa.sede.id));

    if (!hasAccess) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    return empresa;
  }

  async findFiliaisBySede(sedeId: string): Promise<Empresa[]> {
    return this.empresaRepo.find({ sede: sedeId, ativo: true });
  }

  async update(id: string, dto: UpdateEmpresaDto): Promise<Empresa> {
    const empresa = await this.findOne(id);

    if (dto.cnpj_cpf) {
      if (!isValidCnpjCpf(dto.cnpj_cpf)) {
        throw new BadRequestException('CNPJ/CPF em formato inválido.');
      }

      // Verifica duplicidade usando valor normalizado
      const cnpjNorm = normalizeCnpjCpf(dto.cnpj_cpf);
      const clienteId = dto.cliente_id ?? empresa.cliente_id;
      const empresas = await this.empresaRepo.find({
        cliente_id: clienteId,
        id: { $ne: id },
        ativo: true,
      });

      const exists = empresas.find(
        (e) => normalizeCnpjCpf(e.cnpj_cpf) === cnpjNorm,
      );

      if (exists) {
        throw new BadRequestException(
          'Outro registro com esse CNPJ/CPF já existe.',
        );
      }
      // Mantém a máscara original no dto (não normaliza)
    }

    this.empresaRepo.assign(empresa, dto);
    await this.empresaRepo.flush();
    return empresa;
  }

  async softDelete(id: string, user: any): Promise<void> {
    const empresa = await this.findOne(id);

    if (!empresa.sede) {
      throw new BadRequestException(
        'Não é possível excluir uma empresa sede. Apenas filiais podem ser excluídas.',
      );
    }

    empresa.ativo = false;
    empresa.deletadoEm = new Date();
    await this.empresaRepo.flush();

    await this.auditService.logEntityDeleted(
      'EMPRESA',
      empresa.id,
      user.sub || user.id,
      user.username || user.email,
      empresa.id,
      {
        razao_social: empresa.razao_social,
        cnpj_cpf: empresa.cnpj_cpf,
        cliente_id: empresa.cliente_id,
        tipo: 'filial',
      },
    );
  }

  async updateFilial(filialId: string, dto: UpdateFilialDto) {
    const filial = await this.empresaRepo.findOne(
      { id: filialId },
      { populate: ['sede'] },
    );
    if (!filial) {
      throw new NotFoundException('Filial não encontrada');
    }

    this.empresaRepo.assign(filial, dto);
    await this.empresaRepo.flush();

    return filial;
  }

  async softDeleteFilial(filialId: string, user: any) {
    const filial = await this.empresaRepo.findOne({ id: filialId });
    if (!filial) {
      throw new NotFoundException('Filial não encontrada');
    }

    filial.ativo = false;
    filial.deletadoEm = new Date();

    await this.empresaRepo.flush();

    await this.auditService.logEntityDeleted(
      'EMPRESA',
      filial.id,
      user.sub || user.id,
      user.username || user.email,
      filial.id,
      {
        razao_social: filial.razao_social,
        cnpj_cpf: filial.cnpj_cpf,
        cliente_id: filial.cliente_id,
        sede_id: filial.sede?.id,
        tipo: 'filial',
      },
    );
  }
}
