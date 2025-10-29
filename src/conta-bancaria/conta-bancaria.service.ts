import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ContasBancariasRepository } from './conta-bancaria.repository';
import { CreateContaBancariaDto } from './dto/create-conta-bancaria.dto';
import { UpdateContaBancariaDto } from './dto/update-conta-bancaria.dto';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { Empresa } from '../entities/empresa/empresa.entity';
import { EmpresaService } from '../empresa/empresa.service';

@Injectable()
export class ContasBancariasService {
  constructor(
    @InjectRepository(ContasBancarias)
    private readonly contasBancariasRepository: ContasBancariasRepository,
    private readonly empresaService: EmpresaService,
  ) {}

  async create(dto: CreateContaBancariaDto): Promise<ContasBancarias> {
    const contasExistentes = await this.findByEmpresa(dto.empresaId);
    if (contasExistentes.length > 0) {
      const existe = contasExistentes.find((c) => c.conta === dto.conta);
      if (existe) {
        throw new BadRequestException(
          'Conta bancária já existe para essa empresa',
        );
      }
    }

    let empresa: Empresa | undefined;
    if (dto.empresaId) {
      empresa = await this.empresaService.findOne(dto.empresaId);
      if (!empresa) {
        throw new NotFoundException('Empresa não encontrada');
      }
    }

    const { empresaId, ...dadosConta } = dto;
    const conta = this.contasBancariasRepository.create({
      ...dadosConta,
      empresa,
    });
    await this.contasBancariasRepository.persistAndFlush(conta);
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
    this.contasBancariasRepository.assign(conta, dto);
    await this.contasBancariasRepository.flush();
    return conta;
  }

  async toggleStatus(id: string): Promise<ContasBancarias> {
    const conta = await this.findOne(id);
    conta.ativo = !conta.ativo;
    await this.contasBancariasRepository.persistAndFlush(conta);
    return conta;
  }

  async softDelete(id: string): Promise<void> {
    const conta = await this.findOne(id);
    conta.deletadoEm = new Date();
    conta.ativo = false;
    await this.contasBancariasRepository.persistAndFlush(conta);
  }
}
