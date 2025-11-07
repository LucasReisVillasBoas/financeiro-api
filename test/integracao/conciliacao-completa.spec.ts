import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExtratoBancarioService } from '../../src/extrato-bancario/extrato-bancario.service';
import { MovimentacoesBancariasService } from '../../src/movimentacao-bancaria/movimentacao-bancaria.service';
import { OfxParser } from '../../src/extrato-bancario/parsers/ofx.parser';
import { CsvParser } from '../../src/extrato-bancario/parsers/csv.parser';
import { MatchingService } from '../../src/extrato-bancario/matching.service';
import { AuditService } from '../../src/audit/audit.service';
import {
  StatusExtratoItem,
  TipoTransacao,
} from '../../src/entities/extrato-bancario/extrato-bancario.entity';
import { FormatoExtrato } from '../../src/extrato-bancario/dto/importar-extrato.dto';

/**
 * Testes de Integração: Conciliação Completa
 *
 * Estes testes validam o fluxo completo de:
 * 1. Importação de extratos (OFX/CSV)
 * 2. Matching automático
 * 3. Aceitação/Rejeição de sugestões
 * 4. Conciliação manual
 * 5. Desconciliação (estorno)
 * 6. Atualização de saldos
 */
describe('Integration Tests - Conciliação Completa', () => {
  let extratoService: ExtratoBancarioService;
  let movimentacaoService: MovimentacoesBancariasService;
  let mockExtratoRepository: any;
  let mockMovimentacaoRepository: any;
  let mockContaBancariaRepository: any;
  let mockOfxParser: any;
  let mockCsvParser: any;
  let mockMatchingService: any;
  let mockAuditService: any;

  const userId = 'user-123';
  const userEmail = 'test@example.com';
  const contaBancariaId = 'conta-123';
  const empresaId = 'empresa-123';

  beforeEach(async () => {
    // Mock repositories
    mockExtratoRepository = {
      create: jest.fn((data) => ({ ...data, id: `extrato-${Date.now()}` })),
      findOne: jest.fn(),
      find: jest.fn(),
      getEntityManager: jest.fn(() => ({
        persistAndFlush: jest.fn(),
      })),
    };

    mockMovimentacaoRepository = {
      create: jest.fn((data) => ({ ...data, id: `mov-${Date.now()}` })),
      findOne: jest.fn(),
      find: jest.fn(),
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      getEntityManager: jest.fn(() => ({
        persistAndFlush: jest.fn(),
      })),
    };

    mockContaBancariaRepository = {
      findOne: jest.fn(),
    };

    // Mock parsers
    mockOfxParser = {
      parse: jest.fn(),
    };

    mockCsvParser = {
      parse: jest.fn(),
    };

    // Mock services
    mockMatchingService = {
      encontrarSugestoes: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtratoBancarioService,
        MovimentacoesBancariasService,
        { provide: 'ExtratoBancarioRepository', useValue: mockExtratoRepository },
        {
          provide: 'MovimentacoesBancariasRepository',
          useValue: mockMovimentacaoRepository,
        },
        { provide: 'ContasBancariasRepository', useValue: mockContaBancariaRepository },
        { provide: OfxParser, useValue: mockOfxParser },
        { provide: CsvParser, useValue: mockCsvParser },
        { provide: MatchingService, useValue: mockMatchingService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    extratoService = module.get<ExtratoBancarioService>(ExtratoBancarioService);
    movimentacaoService = module.get<MovimentacoesBancariasService>(
      MovimentacoesBancariasService,
    );
  });

  describe('Cenário 1: Importação OFX com Matching Perfeito', () => {
    it('deve importar OFX e encontrar match automático', async () => {
      const contaBancaria = {
        id: contaBancariaId,
        descricao: 'Conta Corrente',
        saldo_atual: 10000.0,
        empresa: { id: empresaId },
      };

      const transacaoOFX = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR ABC',
        documento: '12345',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const movimentacaoExistente: any = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR ABC',
        valor: 1500.0,
        tipoMovimento: 'Débito',
        conciliado: 'N',
      };

      const sugestao = {
        movimentacaoId: 'mov-1',
        score: 100,
        razoes: ['Data exata', 'Valor exato', 'Descrição idêntica'],
        movimentacao: {
          id: 'mov-1',
          data: new Date('2025-01-15'),
          descricao: 'PAGAMENTO FORNECEDOR ABC',
          valor: 1500.0,
          tipo: 'Débito',
        },
      };

      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockOfxParser.parse.mockResolvedValue([transacaoOFX]);
      mockMatchingService.encontrarSugestoes.mockResolvedValue(sugestao);
      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacaoExistente);

      const resultado = await extratoService.importar(
        {
          contaBancariaId,
          formato: FormatoExtrato.OFX,
          nomeArquivo: 'extrato.ofx',
          conteudo: Buffer.from('OFX DATA'),
        },
        userId,
        userEmail,
      );

      expect(resultado.totalImportado).toBe(1);
      expect(resultado.comSugestao).toBe(1);
      expect(resultado.semSugestao).toBe(0);
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('Cenário 2: Importação CSV sem Match', () => {
    it('deve importar CSV e marcar como pendente quando não encontrar match', async () => {
      const contaBancaria = {
        id: contaBancariaId,
        descricao: 'Conta Corrente',
        saldo_atual: 10000.0,
        empresa: { id: empresaId },
      };

      const transacaoCSV = {
        data: new Date('2025-01-20'),
        descricao: 'TRANSACAO DESCONHECIDA',
        valor: 350.0,
        tipo: 'debito' as const,
      };

      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockCsvParser.parse.mockResolvedValue([transacaoCSV]);
      mockMatchingService.encontrarSugestoes.mockResolvedValue(null); // Sem match

      const resultado = await extratoService.importar(
        {
          contaBancariaId,
          formato: FormatoExtrato.CSV,
          nomeArquivo: 'extrato.csv',
          conteudo: Buffer.from('CSV DATA'),
        },
        userId,
        userEmail,
      );

      expect(resultado.totalImportado).toBe(1);
      expect(resultado.comSugestao).toBe(0);
      expect(resultado.semSugestao).toBe(1);

      expect(mockExtratoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: StatusExtratoItem.PENDENTE,
          movimentacaoSugerida: undefined,
          scoreMatch: undefined,
        }),
      );
    });
  });

  describe('Cenário 3: Aceitar Sugestão de Conciliação', () => {
    it('deve aceitar sugestão e marcar movimentação como conciliada', async () => {
      const movimentacao: any = {
        id: 'mov-1',
        conciliado: 'N',
        descricao: 'PAGAMENTO',
        valor: 1500.0,
      };

      const itemExtrato = {
        id: 'extrato-1',
        status: StatusExtratoItem.SUGESTAO,
        movimentacaoSugerida: movimentacao,
        scoreMatch: 95,
        empresaId,
      };

      mockExtratoRepository.findOne.mockResolvedValue(itemExtrato);

      await extratoService.aceitarSugestao('extrato-1', userId, userEmail);

      expect(movimentacao.conciliado).toBe('S');
      expect(movimentacao.conciliadoPor).toBe(userId);
      expect(movimentacao.conciliadoEm).toBeDefined();
      expect(itemExtrato.status).toBe(StatusExtratoItem.CONCILIADO);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CONCILIACAO_ACEITA',
        }),
      );
    });
  });

  describe('Cenário 4: Rejeitar Sugestão', () => {
    it('deve rejeitar sugestão e marcar item como pendente', async () => {
      const itemExtrato = {
        id: 'extrato-1',
        status: StatusExtratoItem.SUGESTAO,
        movimentacaoSugerida: { id: 'mov-1' },
        scoreMatch: 75,
        empresaId,
      };

      mockExtratoRepository.findOne.mockResolvedValue(itemExtrato);

      await extratoService.rejeitarSugestao('extrato-1', userId, userEmail);

      expect(itemExtrato.status).toBe(StatusExtratoItem.PENDENTE);
      expect(itemExtrato.movimentacaoSugerida).toBeUndefined();
      expect(itemExtrato.scoreMatch).toBeUndefined();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CONCILIACAO_REJEITADA',
        }),
      );
    });
  });

  describe('Cenário 5: Conciliação Manual', () => {
    it('deve conciliar movimentações manualmente', async () => {
      const movimentacoes = [
        { id: 'mov-1', conciliado: 'N', empresaId },
        { id: 'mov-2', conciliado: 'N', empresaId },
        { id: 'mov-3', conciliado: 'S', empresaId }, // Já conciliada
      ];

      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const resultado = await movimentacaoService.conciliar(
        { movimentacaoIds: ['mov-1', 'mov-2', 'mov-3'] },
        userId,
        userEmail,
      );

      expect(resultado.conciliadas).toBe(2); // Apenas mov-1 e mov-2
      expect(resultado.erros).toHaveLength(1); // mov-3 já conciliada
      expect(movimentacoes[0].conciliado).toBe('S');
      expect(movimentacoes[1].conciliado).toBe('S');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CONCILIACAO_MANUAL',
        }),
      );
    });
  });

  describe('Cenário 6: Desconciliação (Estorno)', () => {
    it('deve desconciliar movimentações', async () => {
      const movimentacoes = [
        {
          id: 'mov-1',
          conciliado: 'S',
          conciliadoPor: userId,
          conciliadoEm: new Date(),
          empresaId,
        },
        { id: 'mov-2', conciliado: 'N', empresaId }, // Não conciliada
      ];

      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const resultado = await movimentacaoService.desconciliar(
        { movimentacaoIds: ['mov-1', 'mov-2'] },
        userId,
        userEmail,
      );

      expect(resultado.desconciliadas).toBe(1); // Apenas mov-1
      expect(resultado.erros).toHaveLength(1); // mov-2 não estava conciliada
      expect(movimentacoes[0].conciliado).toBe('N');
      expect(movimentacoes[0].conciliadoPor).toBeUndefined();
      expect(movimentacoes[0].conciliadoEm).toBeUndefined();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DESCONCILIACAO_MANUAL',
        }),
      );
    });
  });

  describe('Cenário 7: Fluxo Completo - Import → Match → Accept', () => {
    it('deve completar fluxo de importação até conciliação', async () => {
      const contaBancaria = {
        id: contaBancariaId,
        descricao: 'Conta Corrente',
        saldo_atual: 10000.0,
        empresa: { id: empresaId },
      };

      const transacoes = [
        {
          data: new Date('2025-01-15'),
          descricao: 'PAGAMENTO FORNECEDOR',
          valor: 1500.0,
          tipo: 'debito' as const,
        },
      ];

      const movimentacao: any = {
        id: 'mov-1',
        conciliado: 'N',
      };

      const sugestao = {
        movimentacaoId: 'mov-1',
        score: 98,
        razoes: ['Match perfeito'],
        movimentacao: {},
      };

      // Passo 1: Importar
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockOfxParser.parse.mockResolvedValue(transacoes);
      mockMatchingService.encontrarSugestoes.mockResolvedValue(sugestao);
      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);

      const resultadoImport = await extratoService.importar(
        {
          contaBancariaId,
          formato: FormatoExtrato.OFX,
          nomeArquivo: 'extrato.ofx',
          conteudo: Buffer.from('OFX DATA'),
        },
        userId,
        userEmail,
      );

      expect(resultadoImport.comSugestao).toBe(1);

      // Passo 2: Aceitar sugestão
      const itemExtrato = {
        id: 'extrato-1',
        status: StatusExtratoItem.SUGESTAO,
        movimentacaoSugerida: movimentacao,
        scoreMatch: 98,
        empresaId,
      };

      mockExtratoRepository.findOne.mockResolvedValue(itemExtrato);

      await extratoService.aceitarSugestao('extrato-1', userId, userEmail);

      expect(movimentacao.conciliado).toBe('S');
      expect(itemExtrato.status).toBe(StatusExtratoItem.CONCILIADO);

      // Verificar auditorias
      expect(mockAuditService.log).toHaveBeenCalledTimes(2); // Import + Accept
    });
  });

  describe('Cenário 8: Validações e Erros', () => {
    it('deve rejeitar conta bancária inválida na importação', async () => {
      mockContaBancariaRepository.findOne.mockResolvedValue(null);

      await expect(
        extratoService.importar(
          {
            contaBancariaId: 'invalid-id',
            formato: FormatoExtrato.OFX,
            nomeArquivo: 'extrato.ofx',
            conteudo: Buffer.from('DATA'),
          },
          userId,
          userEmail,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve rejeitar arquivo vazio', async () => {
      const contaBancaria = {
        id: contaBancariaId,
        empresa: { id: empresaId },
      };

      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockOfxParser.parse.mockResolvedValue([]);

      await expect(
        extratoService.importar(
          {
            contaBancariaId,
            formato: FormatoExtrato.OFX,
            nomeArquivo: 'extrato.ofx',
            conteudo: Buffer.from('DATA'),
          },
          userId,
          userEmail,
        ),
      ).rejects.toThrow('Nenhuma transação encontrada no arquivo');
    });

    it('deve rejeitar aceitação de item sem sugestão', async () => {
      const itemExtrato = {
        id: 'extrato-1',
        status: StatusExtratoItem.PENDENTE,
        movimentacaoSugerida: undefined,
      };

      mockExtratoRepository.findOne.mockResolvedValue(itemExtrato);

      await expect(
        extratoService.aceitarSugestao('extrato-1', userId, userEmail),
      ).rejects.toThrow('Item não possui sugestão de conciliação');
    });

    it('deve rejeitar aceitação de item já conciliado', async () => {
      const itemExtrato = {
        id: 'extrato-1',
        status: StatusExtratoItem.CONCILIADO,
        movimentacaoSugerida: { id: 'mov-1' },
      };

      mockExtratoRepository.findOne.mockResolvedValue(itemExtrato);

      await expect(
        extratoService.aceitarSugestao('extrato-1', userId, userEmail),
      ).rejects.toThrow('Item já está conciliado');
    });

    it('deve rejeitar conciliação quando nenhuma movimentação encontrada', async () => {
      mockMovimentacaoRepository.find.mockResolvedValue([]);

      await expect(
        movimentacaoService.conciliar(
          { movimentacaoIds: ['invalid-id'] },
          userId,
          userEmail,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
