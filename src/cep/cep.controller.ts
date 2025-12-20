import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CepService } from './cep.service';
import { CepResponseDto, CepErrorDto } from './dto/cep-response.dto';

@ApiTags('CEP')
@Controller('cep')
export class CepController {
  constructor(private readonly cepService: CepService) {}

  @Get(':cep')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar CEP',
    description: 'Busca informações de endereço pelo CEP usando a API ViaCEP. Aceita CEP com ou sem formatação.',
  })
  @ApiParam({
    name: 'cep',
    description: 'CEP a ser consultado (8 dígitos, com ou sem formatação)',
    example: '01310-100',
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço encontrado',
    type: CepResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'CEP inválido',
    type: CepErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: 'CEP não encontrado',
    type: CepErrorDto,
  })
  async buscarCep(@Param('cep') cep: string) {
    const endereco = await this.cepService.buscarCep(cep);
    return {
      message: 'CEP encontrado',
      statusCode: HttpStatus.OK,
      data: endereco,
    };
  }
}
