import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CepResponseDto } from './dto/cep-response.dto';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

@Injectable()
export class CepService {
  private readonly viaCepUrl = 'https://viacep.com.br/ws';

  /**
   * Consulta CEP na API ViaCEP
   * @param cep - CEP a ser consultado (aceita com ou sem formatação)
   * @returns Dados do endereço
   */
  async buscarCep(cep: string): Promise<CepResponseDto> {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');

    // Valida se tem 8 dígitos
    if (cepLimpo.length !== 8) {
      throw new BadRequestException('CEP deve conter 8 dígitos');
    }

    // Valida se não é um CEP inválido (todos zeros ou sequência)
    if (/^0+$/.test(cepLimpo) || /^(\d)\1+$/.test(cepLimpo)) {
      throw new BadRequestException('CEP inválido');
    }

    try {
      const response = await fetch(`${this.viaCepUrl}/${cepLimpo}/json/`);

      if (!response.ok) {
        throw new NotFoundException('Erro ao consultar CEP');
      }

      const data: ViaCepResponse = await response.json();

      // ViaCEP retorna { erro: true } quando o CEP não existe
      if (data.erro) {
        throw new NotFoundException('CEP não encontrado');
      }

      return {
        cep: data.cep,
        logradouro: data.logradouro || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || '',
        ibge: data.ibge || '',
        ddd: data.ddd || '',
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao consultar CEP. Tente novamente.');
    }
  }
}
