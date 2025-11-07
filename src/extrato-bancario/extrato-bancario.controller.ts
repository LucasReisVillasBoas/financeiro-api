import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExtratoBancarioService } from './extrato-bancario.service';
import { FormatoExtrato } from './dto/importar-extrato.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { EmpresaGuard } from '../auth/empresa.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('extratos-bancarios')
@UseGuards(JwtAuthGuard, RolesGuard, EmpresaGuard)
export class ExtratoBancarioController {
  constructor(private readonly extratoService: ExtratoBancarioService) {}

  @Post('importar')
  @Roles('Administrador', 'Financeiro')
  @UseInterceptors(FileInterceptor('arquivo'))
  async importar(
    @UploadedFile() arquivo: Express.Multer.File,
    @Body('contaBancariaId') contaBancariaId: string,
    @Body('formato') formato: string,
    @CurrentUser() user: any,
  ) {
    if (!arquivo) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    if (!contaBancariaId) {
      throw new BadRequestException('Conta bancária não informada');
    }

    if (!formato || !Object.values(FormatoExtrato).includes(formato as FormatoExtrato)) {
      throw new BadRequestException('Formato inválido. Use OFX ou CSV');
    }

    const resultado = await this.extratoService.importar(
      {
        contaBancariaId,
        formato: formato as FormatoExtrato,
        nomeArquivo: arquivo.originalname,
        conteudo: arquivo.buffer,
      },
      user?.id,
      user?.email,
    );

    return {
      message: `${resultado.totalImportado} transação(ões) importada(s) com sucesso`,
      statusCode: HttpStatus.CREATED,
      data: resultado,
    };
  }

  @Get()
  async findAll(@Query('contaBancariaId') contaBancariaId?: string) {
    const extratos = await this.extratoService.findAll(contaBancariaId);

    return {
      message: 'Extratos encontrados',
      statusCode: HttpStatus.OK,
      data: extratos,
    };
  }

  @Get('pendentes')
  async findPendentes(@Query('contaBancariaId') contaBancariaId: string) {
    if (!contaBancariaId) {
      throw new BadRequestException('Conta bancária não informada');
    }

    const extratos = await this.extratoService.findPendentes(contaBancariaId);

    return {
      message: 'Extratos pendentes encontrados',
      statusCode: HttpStatus.OK,
      data: extratos,
    };
  }

  @Post(':id/aceitar')
  @Roles('Administrador', 'Financeiro')
  async aceitarSugestao(@Param('id') id: string, @CurrentUser() user: any) {
    await this.extratoService.aceitarSugestao(id, user?.id, user?.email);

    return {
      message: 'Conciliação aceita com sucesso',
      statusCode: HttpStatus.OK,
    };
  }

  @Post(':id/rejeitar')
  @Roles('Administrador', 'Financeiro')
  async rejeitarSugestao(@Param('id') id: string, @CurrentUser() user: any) {
    await this.extratoService.rejeitarSugestao(id, user?.id, user?.email);

    return {
      message: 'Sugestão rejeitada',
      statusCode: HttpStatus.OK,
    };
  }

  @Post(':id/ignorar')
  @Roles('Administrador', 'Financeiro')
  async ignorarItem(@Param('id') id: string, @CurrentUser() user: any) {
    await this.extratoService.ignorarItem(id, user?.id, user?.email);

    return {
      message: 'Item ignorado',
      statusCode: HttpStatus.OK,
    };
  }
}
