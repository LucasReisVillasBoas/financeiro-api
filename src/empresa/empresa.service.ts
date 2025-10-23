import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EmpresaRepository } from './empresa.repository';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Empresa } from '../entities/empresa/empresa.entity';
import { isValidCnpjCpf, normalizeCnpjCpf } from '../utils/empresa.util';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { UsuarioEmpresaFilialRepository } from '../usuario/usuario-empresa-filial.repository';

@Injectable()
export class EmpresaService {
  constructor(
    private readonly empresaRepo: EmpresaRepository,
    @InjectRepository(UsuarioEmpresaFilial)
    private readonly usuarioEmpresaFilialRepository: UsuarioEmpresaFilialRepository,
  ) {}

  async create(dto: CreateEmpresaDto): Promise<Empresa> {
    if (!isValidCnpjCpf(dto.cnpj_cpf)) {
      throw new BadRequestException('CNPJ/CPF em formato inválido.');
    }
    const cnpjNorm = normalizeCnpjCpf(dto.cnpj_cpf);

    const exists = await this.empresaRepo.findOne({
      cliente_id: dto.cliente_id,
      cnpj_cpf: cnpjNorm,
      ativo: true,
    });

    if (exists) {
      throw new BadRequestException(
        'Empresa com este CNPJ/CPF já existe para o cliente.',
      );
    }

    const entity = this.empresaRepo.create({ ...dto, cnpj_cpf: cnpjNorm });
    await this.empresaRepo.persistAndFlush(entity);
    return entity;
  }

  async createFilial(dto: CreateFilialDto): Promise<Empresa> {
    if (!isValidCnpjCpf(dto.cnpj_cpf)) {
      throw new BadRequestException('CNPJ/CPF em formato inválido.');
    }
    const cnpjNorm = normalizeCnpjCpf(dto.cnpj_cpf);

    const sede = await this.empresaRepo.findOne({
      id: dto.empresa_id,
      ativo: true,
    });
    if (!sede) throw new NotFoundException('Sede não encontrada.');

    if (sede.cnpj_cpf === cnpjNorm) {
      throw new BadRequestException(
        'Filial não pode ter o mesmo CNPJ/CPF da sede.',
      );
    }

    const exists = await this.empresaRepo.findOne({
      cnpj_cpf: cnpjNorm,
      ativo: true,
    });
    if (exists) {
      throw new BadRequestException(
        'Já existe empresa/filial com esse CNPJ/CPF.',
      );
    }

    const entity = this.empresaRepo.create({
      ...dto,
      cnpj_cpf: cnpjNorm,
      sede,
    });
    await this.empresaRepo.persistAndFlush(entity);
    return entity;
  }

  async findAllByCliente(cliente_id: string): Promise<Empresa[]> {
    return this.empresaRepo.find({ cliente_id, ativo: true });
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
      dto.cnpj_cpf = normalizeCnpjCpf(dto.cnpj_cpf);

      const exists = await this.empresaRepo.findOne({
        cliente_id: dto.cliente_id ?? empresa.cliente_id,
        cnpj_cpf: dto.cnpj_cpf,
        id: { $ne: id },
        ativo: true,
      });
      if (exists) {
        throw new BadRequestException(
          'Outro registro com esse CNPJ/CPF já existe.',
        );
      }
    }

    this.empresaRepo.assign(empresa, dto);
    await this.empresaRepo.flush();
    return empresa;
  }

  async softDelete(id: string): Promise<void> {
    const empresa = await this.findOne(id);
    empresa.ativo = false;
    empresa.deletadoEm = new Date();
    await this.empresaRepo.flush();
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

  async softDeleteFilial(filialId: string) {
    const filial = await this.empresaRepo.findOne({ id: filialId });
    if (!filial) {
      throw new NotFoundException('Filial não encontrada');
    }

    filial.ativo = false;
    filial.deletadoEm = new Date();

    await this.empresaRepo.flush();
  }
}
