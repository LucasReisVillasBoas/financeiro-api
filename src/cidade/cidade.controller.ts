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
import { CidadeService } from './cidade.service';
import { CreateCidadeDto } from './dto/create-cidade.dto';
import { UpdateCidadeDto } from './dto/update-cidade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../auth/empresa.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentCliente } from '../auth/decorators/current-cliente.decorator';

@Controller('cidades')
@UseGuards(JwtAuthGuard, EmpresaGuard, RolesGuard)
export class CidadeController {
  constructor(private readonly cidadeService: CidadeService) {}

  @Post()
  @SetMetadata('roles', ['Administrador', 'Editor'])
  async create(@Body() createCidadeDto: CreateCidadeDto, @CurrentCliente() clienteId: string) {
    const data = await this.cidadeService.create({
      ...createCidadeDto,
      clienteId: clienteId,
    });
    return { message: 'Cidade criada', statusCode: 201, data };
  }

  @Get()
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async findAll(@CurrentCliente() clienteId: string) {
    const cidades = await this.cidadeService.findAll(clienteId);
    return { message: 'Cidades encontradas', statusCode: 200, data: cidades };
  }

  @Get('uf/:uf')
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async findByUf(@Param('uf') uf: string, @CurrentCliente() clienteId: string) {
    const cidades = await this.cidadeService.findByUf(uf.toUpperCase(), clienteId);
    return { message: 'Cidades encontradas', statusCode: 200, data: cidades };
  }

  @Get('ibge/:codigoIbge')
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async findByCodigoIbge(@Param('codigoIbge') codigoIbge: string, @CurrentCliente() clienteId: string) {
    const cidade = await this.cidadeService.findByCodigoIbge(codigoIbge, clienteId);
    return { message: 'Cidade encontrada', statusCode: 200, data: cidade };
  }

  @Get(':id')
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async findOne(@Param('id') id: string, @CurrentCliente() clienteId: string) {
    const cidade = await this.cidadeService.findOne(id, clienteId);
    return { message: 'Cidade encontrada', statusCode: 200, data: cidade };
  }

  @Patch(':id')
  @SetMetadata('roles', ['Administrador', 'Editor'])
  async update(
    @Param('id') id: string,
    @Body() updateCidadeDto: UpdateCidadeDto,
    @CurrentCliente() clienteId: string,
  ) {
    const cidade = await this.cidadeService.update(id, clienteId, updateCidadeDto);
    return { message: 'Cidade atualizada', statusCode: 200, data: cidade };
  }

  @Delete(':id')
  @SetMetadata('roles', ['Administrador', 'Editor'])
  async remove(@Param('id') id: string, @CurrentCliente() clienteId: string) {
    await this.cidadeService.remove(id, clienteId);
    return { message: 'Cidade removida', statusCode: 200 };
  }
}
