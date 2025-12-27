import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../auth/empresa.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { CurrentCliente } from '../auth/decorators/current-cliente.decorator';
import { UpdateContatoDto } from './dto/update-contato.dto';
import { ContatoService } from './contato.service';
import { CreateContatoDto } from './dto/create-contato.dto';
import {
  sanitizeContatoResponse,
  sanitizeContatosResponse,
} from '../utils/contato.util';

@Controller('contatos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContatoController {
  constructor(private readonly contatoService: ContatoService) {}

  @Post()
  @Permissions({ module: 'contatos', action: 'criar' })
  async create(
    @Body() createContatoDto: CreateContatoDto,
    @CurrentCliente() clienteId: string,
  ) {
    const data = await this.contatoService.create({
      ...createContatoDto,
      clienteId: clienteId,
    });
    return {
      message: 'Contato criado',
      statusCode: HttpStatus.CREATED,
      data: sanitizeContatoResponse(data),
    };
  }

  @Get()
  @UseGuards(EmpresaGuard)
  @Permissions({ module: 'contatos', action: 'listar' }, { module: 'contatos', action: 'visualizar' })
  async findAll(@CurrentCliente() clienteId: string) {
    const contatos = await this.contatoService.findAll(clienteId);
    return {
      message: 'Contatos encontrados',
      statusCode: HttpStatus.OK,
      data: sanitizeContatosResponse(contatos),
    };
  }

  @Get(':id')
  @UseGuards(EmpresaGuard)
  @Permissions({ module: 'contatos', action: 'visualizar' })
  async findOne(@Param('id') id: string, @CurrentCliente() clienteId: string) {
    const contato = await this.contatoService.findOne(id, clienteId);
    return {
      message: 'Contato encontrado',
      statusCode: HttpStatus.OK,
      data: contato,
    };
  }

  @Get('/telefone/:telefone')
  @UseGuards(EmpresaGuard)
  @Permissions({ module: 'contatos', action: 'listar' }, { module: 'contatos', action: 'visualizar' })
  async findOneByTelefone(
    @Param('telefone') telefone: string,
    @CurrentCliente() clienteId: string,
  ) {
    const contato = await this.contatoService.findOneByTelefone(
      telefone,
      clienteId,
    );
    return {
      message: 'Contato encontrado',
      statusCode: HttpStatus.OK,
      data: sanitizeContatoResponse(contato),
    };
  }

  @Patch(':id')
  @UseGuards(EmpresaGuard)
  @Permissions({ module: 'contatos', action: 'editar' })
  async update(
    @Param('id') id: string,
    @Body() updateContatoDto: UpdateContatoDto,
    @CurrentCliente() clienteId: string,
  ) {
    const contato = await this.contatoService.update(
      id,
      clienteId,
      updateContatoDto,
    );
    return {
      message: 'Contato atualizado',
      statusCode: HttpStatus.OK,
      data: sanitizeContatoResponse(contato),
    };
  }

  @Delete(':id')
  @UseGuards(EmpresaGuard)
  @Permissions({ module: 'contatos', action: 'excluir' })
  async remove(@Param('id') id: string, @CurrentCliente() clienteId: string) {
    await this.contatoService.remove(id, clienteId);
    return { message: 'Contato removido', statusCode: HttpStatus.OK };
  }
}
