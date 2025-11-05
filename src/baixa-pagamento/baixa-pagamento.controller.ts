import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { BaixaPagamentoService } from './baixa-pagamento.service';
import { CreateBaixaPagamentoDto } from './dto/create-baixa-pagamento.dto';
import { EstornarBaixaPagamentoDto } from './dto/estornar-baixa-pagamento.dto';

@Controller('baixas-pagamento')
export class BaixaPagamentoController {
  constructor(private readonly baixaPagamentoService: BaixaPagamentoService) {}

  @Post()
  async create(@Body() createBaixaDto: CreateBaixaPagamentoDto, @Req() req: any) {
    const baixa = await this.baixaPagamentoService.create(
      createBaixaDto,
      req.user.userId,
      req.user.email,
    );

    return {
      message: 'Baixa de pagamento registrada com sucesso',
      statusCode: HttpStatus.OK,
      data: baixa,
    };
  }

  @Get()
  async findAll() {
    const baixas = await this.baixaPagamentoService.findAll();

    return {
      message: 'Baixas de pagamento listadas com sucesso',
      statusCode: HttpStatus.OK,
      data: baixas,
    };
  }

  @Get('conta-pagar/:contaPagarId')
  async findByContaPagar(@Param('contaPagarId') contaPagarId: string) {
    const baixas = await this.baixaPagamentoService.findByContaPagar(contaPagarId);

    return {
      message: 'Baixas da conta a pagar listadas com sucesso',
      statusCode: HttpStatus.OK,
      data: baixas,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const baixa = await this.baixaPagamentoService.findOne(id);

    return {
      message: 'Baixa de pagamento encontrada',
      statusCode: HttpStatus.OK,
      data: baixa,
    };
  }

  @Post(':id/estornar')
  async estornar(
    @Param('id') id: string,
    @Body() dto: EstornarBaixaPagamentoDto,
    @Req() req: any,
  ) {
    const baixa = await this.baixaPagamentoService.estornar(
      id,
      dto.justificativa,
      req.user.userId,
      req.user.email,
    );

    return {
      message: 'Baixa de pagamento estornada com sucesso',
      statusCode: HttpStatus.OK,
      data: baixa,
    };
  }
}
