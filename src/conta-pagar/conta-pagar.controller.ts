import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { ContasPagarService } from './conta-pagar.service';
import { CreateContaPagarDto } from './dto/create-conta-pagar.dto';
import { UpdateContaPagarDto } from './dto/update-conta-pagar.dto';
import { CancelarContaPagarDto } from './dto/cancelar-conta-pagar.dto';
import { GerarParcelasDto } from './dto/gerar-parcelas.dto';
import { RegistrarBaixaDto } from './dto/registrar-baixa.dto';
import { CurrentCliente } from '../auth/decorators/current-cliente.decorator';

@Controller('contas-pagar')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContasPagarController {
  constructor(private readonly contaPagarService: ContasPagarService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions({ module: 'financeiro', action: 'criar' })
  async create(@Body() dto: CreateContaPagarDto, @Req() req: any) {
    const userId = req.user?.sub;
    const userEmail = req.user?.email || 'desconhecido@system.com';

    const conta = await this.contaPagarService.create(dto, userId, userEmail);
    return {
      message: 'Conta a pagar criada com sucesso',
      statusCode: HttpStatus.CREATED,
      data: conta,
    };
  }

  @Get()
  @Permissions({ module: 'financeiro', action: 'listar' }, { module: 'financeiro', action: 'visualizar' })
  async findAll() {
    const contas = await this.contaPagarService.findAll();
    return {
      message: 'Contas a pagar encontradas',
      statusCode: HttpStatus.OK,
      data: contas,
    };
  }

  @Get('empresa/:empresaId')
  @Permissions({ module: 'financeiro', action: 'listar' }, { module: 'financeiro', action: 'visualizar' })
  async findByEmpresa(@Param('empresaId') empresaId: string) {
    const contas = await this.contaPagarService.findByEmpresa(empresaId);
    return {
      message: 'Contas a pagar encontradas',
      statusCode: HttpStatus.OK,
      data: contas,
    };
  }

  @Get(':id')
  @Permissions({ module: 'financeiro', action: 'visualizar' })
  async findOne(@Param('id') id: string) {
    const conta = await this.contaPagarService.findOne(id);
    return {
      message: 'Conta a pagar encontrada',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Put(':id')
  @Permissions({ module: 'financeiro', action: 'editar' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContaPagarDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;
    const userEmail = req.user?.email || 'desconhecido@system.com';

    const conta = await this.contaPagarService.update(id, dto, userId, userEmail);
    return {
      message: 'Conta a pagar atualizada com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Patch(':id/pagar')
  @Permissions({ module: 'financeiro', action: 'editar' })
  async marcarComoPaga(@Param('id') id: string) {
    const conta = await this.contaPagarService.marcarComoPaga(id);
    return {
      message: 'Conta marcada como paga com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: 'financeiro', action: 'excluir' })
  async delete(@Param('id') id: string) {
    await this.contaPagarService.softDelete(id);
    return {
      message: 'Conta a pagar excluída com sucesso',
      statusCode: HttpStatus.OK,
    };
  }

  @Post(':id/cancelar')
  @Permissions({ module: 'financeiro', action: 'editar' })
  async cancelar(
    @Param('id') id: string,
    @Body() dto: CancelarContaPagarDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;
    const userEmail = req.user?.email || 'desconhecido@system.com';

    const conta = await this.contaPagarService.cancelar(
      id,
      dto,
      userId,
      userEmail,
    );
    return {
      message: 'Conta cancelada com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Post('gerar-parcelas')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({ module: 'financeiro', action: 'criar' })
  async gerarParcelas(@Body() dto: GerarParcelasDto) {
    const parcelas = await this.contaPagarService.gerarParcelas(dto);
    return {
      message: `${parcelas.length} parcelas geradas com sucesso`,
      statusCode: HttpStatus.CREATED,
      data: parcelas,
    };
  }

  @Post(':id/registrar-baixa')
  @Permissions({ module: 'financeiro', action: 'criar' })
  async registrarBaixa(
    @Param('id') id: string,
    @Body() dto: RegistrarBaixaDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;
    const userEmail = req.user?.email || 'desconhecido@system.com';

    const result = await this.contaPagarService.registrarBaixa(
      id,
      dto,
      userId,
      userEmail,
    );
    return {
      message: 'Baixa registrada com sucesso e movimentação bancária gerada',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  @Post(':id/estornar-baixa')
  @Permissions({ module: 'financeiro', action: 'editar' })
  async estornarBaixa(
    @Param('id') id: string,
    @Body() body: { justificativa: string },
    @CurrentCliente() user,
  ) {
    const conta = await this.contaPagarService.estornarBaixa(
      id,
      body.justificativa,
      user,
    );
    return {
      message: 'Baixa estornada com sucesso e movimentação bancária removida',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }
}
