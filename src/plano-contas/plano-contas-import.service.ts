import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PlanoContasRepository } from './plano-contas.repository';
import {
  ImportPlanoContasDto,
  ImportPlanoContasRowDto,
  ImportValidationResult,
  ImportResult,
} from './dto/import-plano-contas.dto';
import {
  PlanoContas,
  TipoPlanoContas,
} from '../entities/plano-contas/plano-contas.entity';
import { EmpresaService } from '../empresa/empresa.service';
import { HierarquiaValidator } from './validators/hierarquia.validator';

@Injectable()
export class PlanoContasImportService {
  constructor(
    @InjectRepository(PlanoContas)
    private readonly planoContasRepository: PlanoContasRepository,
    private readonly empresaService: EmpresaService,
  ) {}

  /**
   * Parse CSV para array de linhas
   */
  parseCSV(csvContent: string): ImportPlanoContasRowDto[] {
    const lines = csvContent.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new BadRequestException('Arquivo CSV vazio ou inválido');
    }

    const dataLines = lines.slice(1);

    return dataLines.map((line) => {
      const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      const cleanValues = values.map((v) => v.replace(/^"|"$/g, '').trim());

      return {
        codigo: cleanValues[0] || '',
        descricao: cleanValues[1] || '',
        tipo: cleanValues[2] || '',
        codigoPai: cleanValues[6] || undefined, // Coluna "Código Pai"
        permite_lancamento: cleanValues[4] || 'Não',
        ativo: cleanValues[5] || 'Ativo',
      };
    });
  }

  /**
   * Validar linha individualmente
   */
  async validarLinha(
    linha: ImportPlanoContasRowDto,
    numeroLinha: number,
    empresaId: string,
    contasExistentes: Map<string, PlanoContas>,
    linhasProcessadas: Map<string, ImportPlanoContasRowDto>,
  ): Promise<ImportValidationResult> {
    const result: ImportValidationResult = {
      linha: numeroLinha,
      codigo: linha.codigo,
      valido: true,
      erros: [],
      avisos: [],
    };

    if (!linha.codigo) {
      result.erros.push('Código é obrigatório');
      result.valido = false;
    }

    if (!linha.descricao) {
      result.erros.push('Descrição é obrigatória');
      result.valido = false;
    }

    if (!linha.tipo) {
      result.erros.push('Tipo é obrigatório');
      result.valido = false;
    }

    const tiposValidos = Object.values(TipoPlanoContas);
    if (linha.tipo && !tiposValidos.includes(linha.tipo as TipoPlanoContas)) {
      result.erros.push(
        `Tipo inválido: "${linha.tipo}". Tipos válidos: ${tiposValidos.join(', ')}`,
      );
      result.valido = false;
    }

    if (linha.codigo && !/^[0-9.]+$/.test(linha.codigo)) {
      result.erros.push(
        'Código deve conter apenas números e pontos (ex: 1.1.01)',
      );
      result.valido = false;
    }

    if (linhasProcessadas.has(linha.codigo)) {
      result.erros.push('Código duplicado no arquivo de importação');
      result.valido = false;
    }

    const contaExistente = contasExistentes.get(linha.codigo);
    if (contaExistente) {
      result.contaExistente = true;
      result.avisos.push('Conta já existe no banco de dados');

      const filhos = await this.planoContasRepository.find({
        parent: contaExistente.id,
        deletado_em: null,
      });

      const temFilhos = filhos.length > 0;
      const temLancamentos = false; // TODO

      if (temFilhos || temLancamentos) {
        result.contaEmUso = true;
        result.avisos.push(
          'Conta em uso (possui ' +
            (temFilhos ? `${filhos.length} filhos` : '') +
            (temFilhos && temLancamentos ? ' e ' : '') +
            (temLancamentos ? 'lançamentos' : '') +
            ')',
        );
      }
    }

    if (linha.codigoPai) {
      const paiExistente =
        contasExistentes.get(linha.codigoPai) ||
        linhasProcessadas.get(linha.codigoPai);

      if (!paiExistente) {
        result.erros.push(
          `Conta pai "${linha.codigoPai}" não existe no banco nem no arquivo de importação`,
        );
        result.valido = false;
      } else {
        const tipoPai =
          contasExistentes.get(linha.codigoPai)?.tipo ||
          (linhasProcessadas.get(linha.codigoPai)?.tipo as TipoPlanoContas);

        if (tipoPai && tipoPai !== linha.tipo) {
          result.erros.push(
            `Tipo "${linha.tipo}" incompatível com tipo do pai "${tipoPai}"`,
          );
          result.valido = false;
        }
      }
    }

    const nivel = linha.codigo.split('.').length;
    if (linha.codigoPai) {
      const nivelPai = linha.codigoPai.split('.').length;
      if (nivel !== nivelPai + 1) {
        result.avisos.push(
          `Nível hierárquico pode estar incorreto (código: ${nivel} níveis, esperado: ${nivelPai + 1})`,
        );
      }
    } else if (nivel !== 1) {
      result.avisos.push(
        'Conta sem pai deveria ser nível 1 (código com 1 parte)',
      );
    }

    return result;
  }

  /**
   * Importar plano de contas a partir de dados parseados
   */
  async import(dto: ImportPlanoContasDto): Promise<ImportResult> {
    const empresa = await this.empresaService.findOne(dto.empresaId);
    if (!empresa) {
      throw new BadRequestException('Empresa não encontrada');
    }

    const contasExistentesArray = await this.planoContasRepository.find({
      empresa: dto.empresaId,
      deletado_em: null,
    });

    const contasExistentes = new Map<string, PlanoContas>(
      contasExistentesArray.map((c) => [c.codigo, c]),
    );

    const linhasProcessadas = new Map<string, ImportPlanoContasRowDto>();
    const validationResults: ImportValidationResult[] = [];

    for (let i = 0; i < dto.linhas.length; i++) {
      const linha = dto.linhas[i];
      const result = await this.validarLinha(
        linha,
        i + 2, // +2 porque linha 1 é cabeçalho
        dto.empresaId,
        contasExistentes,
        linhasProcessadas,
      );

      validationResults.push(result);
      if (result.valido) {
        linhasProcessadas.set(linha.codigo, linha);
      }
    }

    const erros = validationResults.filter((r) => !r.valido);
    const avisos = validationResults.filter(
      (r) => r.valido && r.avisos.length > 0,
    );

    if (dto.dryRun) {
      return {
        sucesso: erros.length === 0,
        totalLinhas: dto.linhas.length,
        importadas: 0,
        atualizadas: 0,
        ignoradas: erros.length,
        erros,
        avisos,
        mensagem: 'Validação concluída (modo simulação)',
      };
    }

    if (erros.length > 0) {
      return {
        sucesso: false,
        totalLinhas: dto.linhas.length,
        importadas: 0,
        atualizadas: 0,
        ignoradas: erros.length,
        erros,
        avisos,
        mensagem: `Importação cancelada: ${erros.length} erro(s) encontrado(s)`,
      };
    }

    const contasEmUso = validationResults.filter((r) => r.contaEmUso);
    if (contasEmUso.length > 0 && !dto.sobrescrever) {
      return {
        sucesso: false,
        totalLinhas: dto.linhas.length,
        importadas: 0,
        atualizadas: 0,
        ignoradas: contasEmUso.length,
        erros: [],
        avisos: contasEmUso,
        mensagem: `Existem ${contasEmUso.length} conta(s) em uso que seriam sobrescritas. Use sobrescrever=true para confirmar.`,
      };
    }

    let importadas = 0;
    let atualizadas = 0;

    const linhasOrdenadas = [...dto.linhas].sort((a, b) => {
      const nivelA = a.codigo.split('.').length;
      const nivelB = b.codigo.split('.').length;
      return nivelA - nivelB;
    });

    const contasCriadas = new Map<string, PlanoContas>();

    for (const linha of linhasOrdenadas) {
      const validation = validationResults.find(
        (v) => v.codigo === linha.codigo,
      );
      if (!validation?.valido) continue;

      const contaExistente = contasExistentes.get(linha.codigo);
      const nivel = linha.codigo.split('.').length;

      let parent: PlanoContas | undefined;
      if (linha.codigoPai) {
        parent =
          contasExistentes.get(linha.codigoPai) ||
          contasCriadas.get(linha.codigoPai);
      }

      const permite_lancamento =
        typeof linha.permite_lancamento === 'boolean'
          ? linha.permite_lancamento
          : linha.permite_lancamento?.toLowerCase() === 'sim';

      const ativo =
        typeof linha.ativo === 'boolean'
          ? linha.ativo
          : linha.ativo?.toLowerCase() === 'ativo';

      if (contaExistente) {
        contaExistente.descricao = linha.descricao;
        contaExistente.tipo = linha.tipo as TipoPlanoContas;
        contaExistente.parent = parent;
        contaExistente.nivel = nivel;
        contaExistente.permite_lancamento = permite_lancamento;
        contaExistente.ativo = ativo;

        await this.planoContasRepository.persistAndFlush(contaExistente);
        atualizadas++;
      } else {
        const novaConta = this.planoContasRepository.create({
          empresa,
          codigo: linha.codigo,
          descricao: linha.descricao,
          tipo: linha.tipo as TipoPlanoContas,
          parent,
          nivel,
          permite_lancamento,
          ativo,
        });

        await this.planoContasRepository.persistAndFlush(novaConta);
        contasCriadas.set(linha.codigo, novaConta);
        importadas++;
      }
    }

    return {
      sucesso: true,
      totalLinhas: dto.linhas.length,
      importadas,
      atualizadas,
      ignoradas: erros.length,
      erros: [],
      avisos,
      mensagem: `Importação concluída: ${importadas} nova(s), ${atualizadas} atualizada(s)`,
    };
  }
}
