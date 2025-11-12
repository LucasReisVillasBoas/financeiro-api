import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
  Header,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { PlanoContasService } from './plano-contas.service';
import { PlanoContasExportService } from './plano-contas-export.service';
import { PlanoContasImportService } from './plano-contas-import.service';
import { CreatePlanoContasDto } from './dto/create-plano-contas.dto';
import { UpdatePlanoContasDto } from './dto/update-plano-contas.dto';
import { FilterPlanoContasDto } from './dto/filter-plano-contas.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';
import { ImportPlanoContasDto } from './dto/import-plano-contas.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('plano-contas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanoContasController {
  constructor(
    private readonly planoContasService: PlanoContasService,
    private readonly exportService: PlanoContasExportService,
    private readonly importService: PlanoContasImportService,
  ) {}

  @Post()
  @Roles('Administrador', 'Financeiro', 'Contador')
  async create(
    @Body() createPlanoContasDto: CreatePlanoContasDto,
    @CurrentUser() user: any,
    @Req() request: Request,
  ) {
    const conta = await this.planoContasService.create(
      createPlanoContasDto,
      user.id,
      user.email,
      request,
    );
    return {
      message: 'Conta criada com sucesso',
      statusCode: 201,
      data: conta,
    };
  }

  @Get()
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async findAll() {
    const contas = await this.planoContasService.findAll();
    return {
      message: 'Contas recuperadas com sucesso',
      statusCode: 200,
      data: contas,
    };
  }

  @Get('empresa/:empresaId')
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async findByEmpresa(@Param('empresaId') empresaId: string) {
    const contas = await this.planoContasService.findByEmpresa(empresaId);
    return {
      message: 'Contas da empresa recuperadas com sucesso',
      statusCode: 200,
      data: contas,
    };
  }

  @Get('empresa/:empresaId/tipo/:tipo')
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async findByTipo(
    @Param('empresaId') empresaId: string,
    @Param('tipo') tipo: string,
  ) {
    const contas = await this.planoContasService.findByTipo(empresaId, tipo);
    return {
      message: 'Contas por tipo recuperadas com sucesso',
      statusCode: 200,
      data: contas,
    };
  }

  @Get('empresa/:empresaId/analiticas')
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async findAnaliticas(@Param('empresaId') empresaId: string) {
    const contas = await this.planoContasService.findAnaliticas(empresaId);
    return {
      message: 'Contas analíticas recuperadas com sucesso',
      statusCode: 200,
      data: contas,
    };
  }

  @Get('empresa/:empresaId/analiticas-ativas')
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async findAnaliticasAtivas(@Param('empresaId') empresaId: string) {
    const contas =
      await this.planoContasService.findAnaliticasAtivas(empresaId);
    return {
      message: 'Contas analíticas ativas recuperadas com sucesso',
      statusCode: 200,
      data: contas,
    };
  }

  @Get('empresa/:empresaId/tree')
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async findTree(@Param('empresaId') empresaId: string) {
    const tree = await this.planoContasService.findTree(empresaId);
    return {
      message: 'Árvore de contas recuperada com sucesso',
      statusCode: 200,
      data: tree,
    };
  }

  @Get('empresa/:empresaId/search')
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async search(
    @Param('empresaId') empresaId: string,
    @Query('term') term: string,
  ) {
    const contas = await this.planoContasService.search(empresaId, term);
    return {
      message: 'Busca realizada com sucesso',
      statusCode: 200,
      data: contas,
    };
  }

  @Get('empresa/:empresaId/export/csv')
  @Roles('Administrador', 'Financeiro', 'Contador')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="plano-contas.csv"')
  async exportCSV(@Param('empresaId') empresaId: string, @Res() res: Response) {
    const contas = await this.planoContasService.findByEmpresa(empresaId);
    const csv = this.exportService.generateCSV(contas);
    res.send(csv);
  }

  @Get('empresa/:empresaId/export/excel')
  @Roles('Administrador', 'Financeiro', 'Contador')
  async exportExcel(@Param('empresaId') empresaId: string) {
    const contas = await this.planoContasService.findByEmpresa(empresaId);
    const data = this.exportService.generateExcelData(contas);
    return {
      message: 'Dados para exportação gerados com sucesso',
      statusCode: 200,
      data,
    };
  }

  @Post('empresa/:empresaId/import/csv')
  @Roles('Administrador', 'Financeiro', 'Contador')
  @UseInterceptors(FileInterceptor('file'))
  async importCSV(
    @Param('empresaId') empresaId: string,
    @UploadedFile() file: any,
    @Body('sobrescrever') sobrescrever?: string | boolean,
    @Body('dryRun') dryRun?: string | boolean,
    @CurrentUser() user?: any,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo CSV é obrigatório');
    }

    // Parse CSV
    const csvContent = file.buffer.toString('utf-8');
    const linhas = this.importService.parseCSV(csvContent);

    // Converter strings para boolean
    const sobrescreverBool = sobrescrever === true || sobrescrever === 'true';
    const dryRunBool = dryRun === true || dryRun === 'true';

    // Importar
    const result = await this.importService.import({
      empresaId,
      linhas,
      sobrescrever: sobrescreverBool,
      dryRun: dryRunBool,
    });

    return {
      message: result.mensagem,
      statusCode: result.sucesso ? 200 : 400,
      ...result,
    };
  }

  @Post('empresa/:empresaId/import/validate')
  @Roles('Administrador', 'Financeiro', 'Contador')
  async validateImport(
    @Param('empresaId') empresaId: string,
    @Body() dto: ImportPlanoContasDto,
  ) {
    // Sempre executar em modo dry-run
    const result = await this.importService.import({
      ...dto,
      empresaId,
      dryRun: true,
    });

    return {
      message: 'Validação concluída',
      statusCode: 200,
      ...result,
    };
  }

  @Post('empresa/:empresaId/import')
  @Roles('Administrador', 'Financeiro', 'Contador')
  async importData(
    @Param('empresaId') empresaId: string,
    @Body() dto: ImportPlanoContasDto,
  ) {
    const result = await this.importService.import({
      ...dto,
      empresaId,
    });

    return {
      message: result.mensagem,
      statusCode: result.sucesso ? 200 : 400,
      ...result,
    };
  }

  @Get(':id/filhos')
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async findChildren(@Param('id') id: string) {
    const children = await this.planoContasService.findChildren(id);
    return {
      message: 'Contas filhas recuperadas com sucesso',
      statusCode: 200,
      data: children,
    };
  }

  @Get(':id/breadcrumb')
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async getBreadcrumb(@Param('id') id: string) {
    const breadcrumb = await this.planoContasService.getBreadcrumb(id);
    return {
      message: 'Caminho hierárquico recuperado com sucesso',
      statusCode: 200,
      data: breadcrumb,
    };
  }

  @Get(':id')
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async findOne(@Param('id') id: string) {
    const conta = await this.planoContasService.findOne(id);
    return {
      message: 'Conta recuperada com sucesso',
      statusCode: 200,
      data: conta,
    };
  }

  @Patch(':id')
  @Roles('Administrador', 'Financeiro', 'Contador')
  async update(
    @Param('id') id: string,
    @Body() updatePlanoContasDto: UpdatePlanoContasDto,
    @CurrentUser() user: any,
    @Req() request: Request,
  ) {
    const conta = await this.planoContasService.update(
      id,
      updatePlanoContasDto,
      user.id,
      user.email,
      request,
    );
    return {
      message: 'Conta atualizada com sucesso',
      statusCode: 200,
      data: conta,
    };
  }

  @Patch(':id/toggle-status')
  @Roles('Administrador', 'Financeiro', 'Contador')
  async toggleStatus(
    @Param('id') id: string,
    @Body() dto: ToggleStatusDto,
    @CurrentUser() user: any,
    @Req() request: Request,
  ) {
    const conta = await this.planoContasService.toggleStatus(
      id,
      dto.ativo,
      user.id,
      user.email,
      request,
    );
    return {
      message: 'Status da conta atualizado com sucesso',
      statusCode: 200,
      data: conta,
    };
  }

  @Get(':id/uso')
  @Roles('Administrador', 'Financeiro', 'Contador')
  async verificarUso(@Param('id') id: string) {
    const uso = await this.planoContasService.verificarContaEmUso(id);
    return {
      message: 'Verificação de uso realizada com sucesso',
      statusCode: 200,
      data: uso,
    };
  }

  @Post(':id/substituir')
  @Roles('Administrador', 'Financeiro', 'Contador')
  async substituirConta(
    @Param('id') contaOrigemId: string,
    @Body('contaDestinoId') contaDestinoId: string,
    @CurrentUser() user: any,
  ) {
    if (!contaDestinoId) {
      throw new BadRequestException('contaDestinoId é obrigatório');
    }

    const resultado = await this.planoContasService.substituirConta(
      contaOrigemId,
      contaDestinoId,
      user.id,
      user.email,
    );

    return {
      message: `Conta substituída com sucesso. ${resultado.contasAtualizadas} lançamento(s) atualizado(s).`,
      statusCode: 200,
      data: resultado,
    };
  }

  @Delete(':id')
  @Roles('Administrador')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() request: Request,
  ) {
    await this.planoContasService.softDelete(id, user.id, user.email, request);
    return {
      message: 'Conta excluída com sucesso',
      statusCode: 200,
    };
  }
}
