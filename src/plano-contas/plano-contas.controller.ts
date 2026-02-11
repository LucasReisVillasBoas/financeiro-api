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
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('plano-contas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PlanoContasController {
  constructor(
    private readonly planoContasService: PlanoContasService,
    private readonly exportService: PlanoContasExportService,
    private readonly importService: PlanoContasImportService,
  ) {}

  @Post()
  @Permissions({ module: 'financeiro', action: 'criar' })
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
  @Permissions(
    { module: 'financeiro', action: 'listar' },
    { module: 'financeiro', action: 'visualizar' },
  )
  async findAll() {
    const contas = await this.planoContasService.findAll();
    return {
      message: 'Contas recuperadas com sucesso',
      statusCode: 200,
      data: contas,
    };
  }

  @Get('empresa/:empresaId')
  @Permissions(
    { module: 'financeiro', action: 'listar' },
    { module: 'financeiro', action: 'visualizar' },
  )
  async findByEmpresa(@Param('empresaId') empresaId: string) {
    const contas = await this.planoContasService.findByEmpresa(empresaId);
    return {
      message: 'Contas da empresa recuperadas com sucesso',
      statusCode: 200,
      data: contas,
    };
  }

  @Get('empresa/:empresaId/tipo/:tipo')
  @Permissions(
    { module: 'financeiro', action: 'listar' },
    { module: 'financeiro', action: 'visualizar' },
  )
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
  @Permissions(
    { module: 'financeiro', action: 'listar' },
    { module: 'financeiro', action: 'visualizar' },
  )
  async findAnaliticas(@Param('empresaId') empresaId: string) {
    const contas = await this.planoContasService.findAnaliticas(empresaId);
    return {
      message: 'Contas analíticas recuperadas com sucesso',
      statusCode: 200,
      data: contas,
    };
  }

  @Get('empresa/:empresaId/analiticas-ativas')
  @Permissions(
    { module: 'financeiro', action: 'listar' },
    { module: 'financeiro', action: 'visualizar' },
  )
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
  @Permissions(
    { module: 'financeiro', action: 'listar' },
    { module: 'financeiro', action: 'visualizar' },
  )
  async findTree(@Param('empresaId') empresaId: string) {
    const tree = await this.planoContasService.findTree(empresaId);
    return {
      message: 'Árvore de contas recuperada com sucesso',
      statusCode: 200,
      data: tree,
    };
  }

  @Get('empresa/:empresaId/search')
  @Permissions(
    { module: 'financeiro', action: 'listar' },
    { module: 'financeiro', action: 'visualizar' },
  )
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
  @Permissions({ module: 'financeiro', action: 'editar' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="plano-contas.csv"')
  async exportCSV(@Param('empresaId') empresaId: string, @Res() res: Response) {
    const contas = await this.planoContasService.findByEmpresa(empresaId);
    const csv = this.exportService.generateCSV(contas);
    res.send(csv);
  }

  @Get('empresa/:empresaId/export/excel')
  @Permissions({ module: 'financeiro', action: 'editar' })
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
  @Permissions({ module: 'financeiro', action: 'editar' })
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Param('empresaId') empresaId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('sobrescrever') sobrescrever: string,
    @Body('dryRun') dryRun: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }

    let realBuffer: Buffer;

    if (Buffer.isBuffer(file.buffer)) {
      realBuffer = file.buffer;
    } else {
      realBuffer = Buffer.from(
        Object.values(file.buffer as Record<string, number>),
      );
    }

    const csvContent = realBuffer.toString('utf-8');

    // 1️⃣ Parse do CSV
    const linhas = this.importService.parseCSV(csvContent);

    // 2️⃣ Converter flags string -> boolean
    const sobrescreverBool = sobrescrever === 'true';
    const dryRunBool = dryRun === 'true';

    // 3️⃣ Chamar serviço de importação
    const result = await this.importService.import({
      empresaId,
      linhas,
      sobrescrever: sobrescreverBool,
      dryRun: dryRunBool,
    });

    return {
      message: result.mensagem,
      statusCode: result.sucesso ? 200 : 400,
      data: result,
    };
  }

  @Post('empresa/:empresaId/import')
  @Permissions({ module: 'financeiro', action: 'editar' })
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
  @Permissions(
    { module: 'financeiro', action: 'listar' },
    { module: 'financeiro', action: 'visualizar' },
  )
  async findChildren(@Param('id') id: string) {
    const children = await this.planoContasService.findChildren(id);
    return {
      message: 'Contas filhas recuperadas com sucesso',
      statusCode: 200,
      data: children,
    };
  }

  @Get(':id/breadcrumb')
  @Permissions(
    { module: 'financeiro', action: 'listar' },
    { module: 'financeiro', action: 'visualizar' },
  )
  async getBreadcrumb(@Param('id') id: string) {
    const breadcrumb = await this.planoContasService.getBreadcrumb(id);
    return {
      message: 'Caminho hierárquico recuperado com sucesso',
      statusCode: 200,
      data: breadcrumb,
    };
  }

  @Get(':id')
  @Permissions(
    { module: 'financeiro', action: 'listar' },
    { module: 'financeiro', action: 'visualizar' },
  )
  async findOne(@Param('id') id: string) {
    const conta = await this.planoContasService.findOne(id);
    return {
      message: 'Conta recuperada com sucesso',
      statusCode: 200,
      data: conta,
    };
  }

  @Patch(':id')
  @Permissions({ module: 'financeiro', action: 'editar' })
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
  @Permissions({ module: 'financeiro', action: 'editar' })
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
  @Permissions({ module: 'financeiro', action: 'editar' })
  async verificarUso(@Param('id') id: string) {
    const uso = await this.planoContasService.verificarContaEmUso(id);
    return {
      message: 'Verificação de uso realizada com sucesso',
      statusCode: 200,
      data: uso,
    };
  }

  @Post(':id/substituir')
  @Permissions({ module: 'financeiro', action: 'editar' })
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
  @Permissions({ module: 'financeiro', action: 'excluir' })
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
