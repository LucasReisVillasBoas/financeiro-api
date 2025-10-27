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
  HttpStatus,
} from '@nestjs/common';
import { CidadeService } from './cidade.service';
import { CreateCidadeDto } from './dto/create-cidade.dto';
import { UpdateCidadeDto } from './dto/update-cidade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../auth/empresa.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentCliente } from '../auth/decorators/current-cliente.decorator';
import {
  sanitizeCidadeResponse,
  sanitizeCidadesResponse,
} from '../utils/cidade.util';

@Controller('cidades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CidadeController {
  constructor(private readonly cidadeService: CidadeService) {}

  @Post()
  @SetMetadata('roles', ['Administrador', 'Editor'])
  async create(
    @Body() createCidadeDto: CreateCidadeDto,
    @CurrentCliente() clienteId: string,
  ) {
    const data = await this.cidadeService.create({
      ...createCidadeDto,
      clienteId: clienteId,
    });
    return {
      message: 'Cidade criada',
      statusCode: HttpStatus.CREATED,
      data: sanitizeCidadeResponse(data),
    };
  }

  @Get()
  @UseGuards(EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async findAll(@CurrentCliente() clienteId: string) {
    const cidades = await this.cidadeService.findAll(clienteId);
    return {
      message: 'Cidades encontradas',
      statusCode: HttpStatus.OK,
      data: sanitizeCidadesResponse(cidades),
    };
  }

  @Get('uf/:uf')
  @UseGuards(EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async findByUf(@Param('uf') uf: string, @CurrentCliente() clienteId: string) {
    const cidades = await this.cidadeService.findByUf(
      uf.toUpperCase(),
      clienteId,
    );
    return {
      message: 'Cidades encontradas',
      statusCode: HttpStatus.OK,
      data: sanitizeCidadesResponse(cidades),
    };
  }

  @Get('ibge/:codigoIbge')
  @UseGuards(EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async findByCodigoIbge(
    @Param('codigoIbge') codigoIbge: string,
    @CurrentCliente() clienteId: string,
  ) {
    const cidade = await this.cidadeService.findByCodigoIbge(
      codigoIbge,
      clienteId,
    );
    return {
      message: 'Cidade encontrada',
      statusCode: HttpStatus.OK,
      data: sanitizeCidadeResponse(cidade),
    };
  }

  @Get(':id')
  @UseGuards(EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async findOne(@Param('id') id: string, @CurrentCliente() clienteId: string) {
    const cidade = await this.cidadeService.findOne(id, clienteId);
    return {
      message: 'Cidade encontrada',
      statusCode: HttpStatus.OK,
      data: sanitizeCidadeResponse(cidade),
    };
  }

  @Patch(':id')
  @UseGuards(EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor'])
  async update(
    @Param('id') id: string,
    @Body() updateCidadeDto: UpdateCidadeDto,
    @CurrentCliente() clienteId: string,
  ) {
    const cidade = await this.cidadeService.update(
      id,
      clienteId,
      updateCidadeDto,
    );
    return {
      message: 'Cidade atualizada',
      statusCode: HttpStatus.OK,
      data: sanitizeCidadeResponse(cidade),
    };
  }

  @Delete(':id')
  @UseGuards(EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor'])
  async remove(@Param('id') id: string, @CurrentCliente() clienteId: string) {
    await this.cidadeService.remove(id, clienteId);
    return { message: 'Cidade removida', statusCode: HttpStatus.OK };
  }
}
