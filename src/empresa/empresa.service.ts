import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EmpresaRepository } from './empresa.repository';
import { FilialRepository } from './filial.repository';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import { Empresa } from '../entities/empresa/empresa.entity';
import { Filial } from '../entities/empresa/filial.entity';
import { isValidCnpjCpf, normalizeCnpjCpf } from '../utils/empresa.util';

@Injectable()
export class EmpresaService {
  constructor(
    private readonly empresaRepo: EmpresaRepository,
    private readonly filialRepo: FilialRepository,
  ) {}

  // TODO: Adicionar config de logs
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

  async findAllByCliente(cliente_id: string): Promise<Empresa[]> {
    return this.empresaRepo.find({ cliente_id, ativo: true });
  }

  async findOne(id: string): Promise<Empresa> {
    const empresa = await this.empresaRepo.findOne({ id, ativo: true });
    if (!empresa) throw new NotFoundException('Empresa não encontrada.');
    return empresa;
  }

  async update(id: string, dto: UpdateEmpresaDto): Promise<Empresa> {
    const empresa = await this.findOne(id);
    if (dto.cnpj_cpf && !isValidCnpjCpf(dto.cnpj_cpf)) {
      throw new BadRequestException('CNPJ/CPF em formato inválido.');
    }

    if (dto.cnpj_cpf) {
      dto.cnpj_cpf = normalizeCnpjCpf(dto.cnpj_cpf);
      const exists = await this.empresaRepo.findOne({
        cliente_id: dto.cliente_id ?? empresa.cliente_id,
        cnpj_cpf: dto.cnpj_cpf,
        id: { $ne: id.toString() },
        ativo: true,
      });
      if (exists)
        throw new BadRequestException(
          'Outro registro com esse CNPJ/CPF já existe.',
        );
    }

    this.empresaRepo.assign(empresa, dto);
    await this.empresaRepo.flush();
    return empresa;
  }

  async softDelete(id: string): Promise<void> {
    // TODO: Adicionar validação de admin
    const empresa = await this.findOne(id);
    empresa.ativo = false;
    empresa.deletadoEm = new Date();
    await this.empresaRepo.flush();
  }

  /* Filial operations */

  async createFilial(dto: CreateFilialDto): Promise<Filial> {
    if (!isValidCnpjCpf(dto.cnpj_cpf)) {
      throw new BadRequestException('CNPJ/CPF em formato inválido.');
    }
    const cnpjNorm = normalizeCnpjCpf(dto.cnpj_cpf);

    // verifica empresa existe e ativa
    const empresa = await this.empresaRepo.findOne({
      id: dto.empresa_id,
      ativo: true,
    });
    if (!empresa) throw new NotFoundException('Empresa mãe não encontrada.');

    // verifica unicidade dentro da empresa
    const exists = await this.filialRepo.findOne({
      empresa: dto.empresa_id,
      cnpj_cpf: cnpjNorm,
      ativo: true,
    });
    if (exists)
      throw new BadRequestException(
        'Filial com esse CNPJ/CPF já existe para a empresa.',
      );

    const entity = this.filialRepo.create({ ...dto, cnpj_cpf: cnpjNorm });
    await this.filialRepo.persistAndFlush(entity);
    return entity;
  }

  async findFiliaisByEmpresa(empresa_id: string): Promise<Filial[]> {
    return this.filialRepo.find({ empresa: empresa_id, ativo: true });
  }

  async findFilialById(id: string): Promise<Filial> {
    const f = await this.filialRepo.findOne({ id, ativo: true });
    if (!f) throw new NotFoundException('Filial não encontrada.');
    return f;
  }

  async updateFilial(id: string, dto: UpdateFilialDto): Promise<Filial> {
    const filial = await this.findFilialById(id);

    if (dto.cnpj_cpf && !isValidCnpjCpf(dto.cnpj_cpf)) {
      throw new BadRequestException('CNPJ/CPF em formato inválido.');
    }
    if (dto.cnpj_cpf) dto.cnpj_cpf = normalizeCnpjCpf(dto.cnpj_cpf);

    if (dto.cnpj_cpf) {
      const exists = await this.filialRepo.findOne({
        empresa: filial.empresa.id,
        cnpj_cpf: dto.cnpj_cpf,
        id: { $ne: id },
        ativo: true,
      });
      if (exists)
        throw new BadRequestException(
          'Outro registro com esse CNPJ/CPF já existe.',
        );
    }

    this.filialRepo.assign(filial, dto);
    await this.filialRepo.flush();
    return filial;
  }

  async softDeleteFilial(id: string): Promise<void> {
    // TODO: Adicionar validação de admin
    const filial = await this.findFilialById(id);
    filial.ativo = false;
    filial.deletadoEm = new Date();
    await this.filialRepo.flush();
  }
}
