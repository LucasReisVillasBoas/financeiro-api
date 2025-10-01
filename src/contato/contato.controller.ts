import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../auth/empresa.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentCliente } from '../auth/decorators/current-cliente.decorator';
import { UpdateContatoDto } from './dto/update-contato.dto';
import { ContatoService } from './contato.service';
import { CreateContatoDto } from './dto/create-contato.dto';
import { sanitizeContatoResponse, sanitizeContatosResponse } from '../utils/contato.util';

@Controller('contatos')
@UseGuards(JwtAuthGuard, EmpresaGuard, RolesGuard)
export class ContatoController {
  constructor(private readonly contatoService: ContatoService) {}

  @Post()
  @SetMetadata('roles', ['Administrador', 'Editor'])
  async create(
    @Body() createContatoDto: CreateContatoDto,
    @CurrentCliente() clienteId: string,
  ) {
    const data = await this.contatoService.create({
      ...createContatoDto,
      clienteId: clienteId,
    });
    return { message: 'Contato criado', statusCode: 201, data: sanitizeContatoResponse(data) };
  }

  @Get()
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async findAll(@CurrentCliente() clienteId: string) {
    const contatos = await this.contatoService.findAll(clienteId);
    return { message: 'Contatos encontrados', statusCode: 200, data: sanitizeContatosResponse(contatos) };
  }

  @Get(':id')
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async findOne(
    @Param('id') id: string,
    @CurrentCliente() clienteId: string,
  ) {
    const contato = await this.contatoService.findOne(id, clienteId);
    return { message: 'Contato encontrado', statusCode: 200, data: sanitizeContatoResponse(contato) };
  }

  @Patch(':id')
  @SetMetadata('roles', ['Administrador', 'Editor'])
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
    return { message: 'Contato atualizado', statusCode: 200, data: sanitizeContatoResponse(contato) };
  }

  @Delete(':id')
  @SetMetadata('roles', ['Administrador', 'Editor'])
  async remove(
    @Param('id') id: string,
    @CurrentCliente() clienteId: string,
  ) {
    await this.contatoService.remove(id, clienteId);
    return { message: 'Contato removido', statusCode: 200 };
  }
}
