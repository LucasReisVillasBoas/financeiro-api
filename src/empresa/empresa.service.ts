import { Injectable, NotFoundException } from '@nestjs/common';
import { EmpresaCreateRequestDto } from './dto/empresa-create-request.dto';
import { EmpresaRepository } from './empresa.repository';
import { Empresa } from '../entities/empresa/empresa.entity';

@Injectable()
export class EmpresaService {
  constructor(private readonly empresaRepository: EmpresaRepository) {}

  async create(data: EmpresaCreateRequestDto): Promise<Empresa> {
    console.log('Creating empresa:', data);
    const empresa = this.empresaRepository.create(data);
    await this.empresaRepository.persistAndFlush(empresa);
    return empresa;
  }

  async getById(id: string): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({ id });
    if (!empresa) throw new NotFoundException('Empresa not found');
    return empresa;
  }

  async getAll(): Promise<Empresa[]> {
    return this.empresaRepository.findAll();
  }

  async update(
    id: string,
    data: Partial<EmpresaCreateRequestDto>,
  ): Promise<Empresa> {
    const empresa = await this.getById(id);
    this.empresaRepository.assign(empresa, data);
    await this.empresaRepository.flush();
    return empresa;
  }

  async delete(id: string): Promise<Empresa> {
    const empresa = await this.getById(id);
    // Soft delete pattern: set ativo = false and deletadoEm = now()
    empresa.ativo = false;
    empresa.deletadoEm = new Date();
    await this.empresaRepository.flush();
    return empresa;
  }
}
