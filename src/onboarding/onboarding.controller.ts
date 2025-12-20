import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { OnboardingEmpresaDto } from './dto/onboarding-empresa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('empresa')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Onboarding completo de empresa',
    description:
      'Cria empresa, perfil e contato em uma única operação transacional. Se qualquer etapa falhar, toda a operação é cancelada.',
  })
  @ApiResponse({
    status: 201,
    description: 'Onboarding realizado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou empresa já existe',
  })
  async onboardEmpresa(
    @Body() dto: OnboardingEmpresaDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.onboardingService.onboardEmpresa(dto, user.id);

    return {
      message: 'Onboarding realizado com sucesso',
      statusCode: HttpStatus.CREATED,
      data: {
        empresa: {
          id: result.empresa.id,
          razao_social: result.empresa.razao_social,
          nome_fantasia: result.empresa.nome_fantasia,
          cnpj_cpf: result.empresa.cnpj_cpf,
        },
        perfil: {
          id: result.perfil.id,
          nome: result.perfil.nome,
        },
        contato: {
          id: result.contato.id,
          nome: result.contato.nome,
          email: result.contato.email,
        },
      },
    };
  }
}
