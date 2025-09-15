import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { EmpresaCreateRequestDto } from './dto/empresa-create-request.dto';
import { EmpresaResponseDto } from './dto/empresa-response.dto';

@Controller('empresa')
@ApiTags('Empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @ApiResponse({
    status: 201,
    type: EmpresaResponseDto,
    description: 'Empresa criada',
  })
  @Post()
  async create(
    @Body() dto: EmpresaCreateRequestDto,
  ): Promise<EmpresaResponseDto> {
    const empresa = await this.empresaService.create(dto);
    return new EmpresaResponseDto('Empresa criada', 201, { empresa });
  }

  @ApiResponse({
    status: 200,
    type: EmpresaResponseDto,
    description: 'Empresa encontrada',
  })
  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: string,
  ): Promise<EmpresaResponseDto> {
    const empresa = await this.empresaService.getById(id);
    return new EmpresaResponseDto('Empresa encontrada', 200, { empresa });
  }

  @ApiResponse({
    status: 200,
    type: EmpresaResponseDto,
    description: 'Lista de empresas',
  })
  @Get()
  async getAll(): Promise<EmpresaResponseDto> {
    const empresas = await this.empresaService.getAll();
    return new EmpresaResponseDto('Lista de empresas', 200, { empresas });
  }

  @ApiResponse({
    status: 200,
    type: EmpresaResponseDto,
    description: 'Empresa atualizada',
  })
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() dto: Partial<EmpresaCreateRequestDto>,
  ): Promise<EmpresaResponseDto> {
    const empresa = await this.empresaService.update(id, dto);
    return new EmpresaResponseDto('Empresa atualizada', 200, { empresa });
  }

  @ApiResponse({
    status: 200,
    type: EmpresaResponseDto,
    description: 'Empresa deletada (soft delete)',
  })
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: string,
  ): Promise<EmpresaResponseDto> {
    const empresa = await this.empresaService.delete(id);
    return new EmpresaResponseDto('Empresa deletada', 200, { empresa });
  }
}
