import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PessoaService } from './pessoa.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { CreatePessoaCompletoDto } from './dto/create-pessoa-completo.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { FiltroPessoaDto } from './dto/filtro-pessoa.dto';
import { Pessoa } from '../entities/pessoa/pessoa.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { EmpresaGuard } from '../auth/empresa.guard';
import { BaseResponse } from '../dto/base-response.dto';

@ApiTags('pessoas')
@ApiBearerAuth()
@Controller('pessoas')
@UseGuards(RolesGuard, EmpresaGuard)
export class PessoaController {
  constructor(private readonly pessoaService: PessoaService) {}

  @Post('completo')
  @Roles('Administrador', 'financeiro')
  @ApiOperation({
    summary: 'Criar pessoa completa com endereço (formato simplificado)',
  })
  @ApiResponse({
    status: 201,
    description: 'Pessoa criada com sucesso',
    type: Pessoa,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createCompleto(
    @Body() dto: CreatePessoaCompletoDto,
    @Req() req: any,
  ): Promise<BaseResponse<Pessoa>> {
    const pessoa = await this.pessoaService.createCompleto(
      dto,
      req.user.sub,
      req.user.email,
    );
    return {
      message: 'Pessoa criada com sucesso',
      statusCode: HttpStatus.CREATED,
      data: pessoa,
    };
  }

  @Post()
  @Roles('Administrador', 'financeiro')
  @ApiOperation({
    summary: 'Criar nova pessoa (fornecedor/cliente) - formato avançado',
  })
  @ApiResponse({
    status: 201,
    description: 'Pessoa criada com sucesso',
    type: Pessoa,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(
    @Body() dto: CreatePessoaDto,
    @Req() req: any,
  ): Promise<BaseResponse<Pessoa>> {
    const pessoa = await this.pessoaService.create(
      dto,
      req.user.sub,
      req.user.email,
    );
    return {
      message: 'Pessoa criada com sucesso',
      statusCode: HttpStatus.CREATED,
      data: pessoa,
    };
  }

  @Get('cliente/:clienteId')
  @ApiOperation({ summary: 'Listar pessoas de um cliente específico' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pessoas do cliente',
    type: [Pessoa],
  })
  async findByCliente(
    @Param('clienteId') clienteId: string,
  ): Promise<BaseResponse<Pessoa[]>> {
    const pessoas = await this.pessoaService.findByCliente(clienteId);
    return {
      message: 'Pessoas encontradas com sucesso',
      statusCode: HttpStatus.OK,
      data: pessoas,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as pessoas com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de pessoas', type: [Pessoa] })
  async findAll(
    @Query() filtro: FiltroPessoaDto,
  ): Promise<BaseResponse<Pessoa[]>> {
    const pessoas = await this.pessoaService.findAll(filtro);
    return {
      message: 'Pessoas encontradas com sucesso',
      statusCode: HttpStatus.OK,
      data: pessoas,
    };
  }

  @Get(':id')
  @SetMetadata('skipEmpresaValidation', true)
  @ApiOperation({ summary: 'Buscar pessoa por ID' })
  @ApiResponse({ status: 200, description: 'Pessoa encontrada', type: Pessoa })
  @ApiResponse({ status: 404, description: 'Pessoa não encontrada' })
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<BaseResponse<Pessoa>> {
    const empresasUsuario =
      req.userEmpresas?.map((e: any) => e.empresaId) || [];
    const pessoa = await this.pessoaService.findOne(id, empresasUsuario);
    return {
      message: 'Pessoa encontrada com sucesso',
      statusCode: HttpStatus.OK,
      data: pessoa,
    };
  }

  @Put(':id')
  @Roles('Administrador', 'financeiro')
  @SetMetadata('skipEmpresaValidation', true)
  @ApiOperation({ summary: 'Atualizar dados de uma pessoa' })
  @ApiResponse({
    status: 200,
    description: 'Pessoa atualizada com sucesso',
    type: Pessoa,
  })
  @ApiResponse({ status: 404, description: 'Pessoa não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePessoaDto,
    @Req() req: any,
  ): Promise<BaseResponse<Pessoa>> {
    const empresasUsuario =
      req.userEmpresas?.map((e: any) => e.empresaId) || [];
    const pessoa = await this.pessoaService.update(
      id,
      dto,
      req.user.sub,
      req.user.email,
      empresasUsuario,
    );
    return {
      message: 'Pessoa atualizada com sucesso',
      statusCode: HttpStatus.OK,
      data: pessoa,
    };
  }

  @Delete(':id')
  @Roles('Administrador', 'financeiro')
  @SetMetadata('skipEmpresaValidation', true)
  @ApiOperation({ summary: 'Excluir pessoa (soft delete)' })
  @ApiResponse({ status: 200, description: 'Pessoa excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Pessoa não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Pessoa possui vínculos e não pode ser excluída',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<BaseResponse<void>> {
    const empresasUsuario =
      req.userEmpresas?.map((e: any) => e.empresaId) || [];
    await this.pessoaService.remove(
      id,
      req.user.sub,
      req.user.email,
      empresasUsuario,
    );
    return {
      message: 'Pessoa excluída com sucesso',
      statusCode: HttpStatus.OK,
    };
  }

  @Post(':id/reativar')
  @Roles('Administrador')
  @SetMetadata('skipEmpresaValidation', true)
  @ApiOperation({ summary: 'Reativar pessoa excluída' })
  @ApiResponse({
    status: 200,
    description: 'Pessoa reativada com sucesso',
    type: Pessoa,
  })
  @ApiResponse({ status: 404, description: 'Pessoa não encontrada' })
  @ApiResponse({ status: 400, description: 'Pessoa não está excluída' })
  async reativar(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<BaseResponse<Pessoa>> {
    const empresasUsuario =
      req.userEmpresas?.map((e: any) => e.empresaId) || [];
    const pessoa = await this.pessoaService.reativar(
      id,
      req.user.sub,
      req.user.email,
      empresasUsuario,
    );
    return {
      message: 'Pessoa reativada com sucesso',
      statusCode: HttpStatus.OK,
      data: pessoa,
    };
  }
}
