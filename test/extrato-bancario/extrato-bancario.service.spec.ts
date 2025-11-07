import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExtratoBancarioService } from '../../src/extrato-bancario/extrato-bancario.service';
import {
  ExtratoBancario,
  StatusExtratoItem,
} from '../../src/entities/extrato-bancario/extrato-bancario.entity';
import { MovimentacoesBancarias } from '../../src/entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancarias } from '../../src/entities/conta-bancaria/conta-bancaria.entity';
import { OfxParser } from '../../src/extrato-bancario/parsers/ofx.parser';
import { CsvParser } from '../../src/extrato-bancario/parsers/csv.parser';
import { MatchingService } from '../../src/extrato-bancario/matching.service';
import { AuditService } from '../../src/audit/audit.service';
import { FormatoExtrato } from '../../src/extrato-bancario/dto/importar-extrato.dto';

describe('ExtratoBancarioService - Integration', () => {
  let service: ExtratoBancarioService;
  let mockExtratoRepository: any;
  let mockMovimentacaoRepository: any;
  let mockContasBancariasRepository: any;
  let mockOfxParser: any;
  let mockCsvParser: any;
  let mockMatchingService: any;
  let mockAuditService: any;

  const userId = 'user-123';
  const userEmail = 'user@test.com';
  const contaBancariaId = 'conta-123';

  beforeEach(async () => {
    mockExtratoRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      getEntityManager: jest.fn(() => ({
        persistAndFlush: jest.fn(),
      })),
    };

    mockMovimentacaoRepository = {
      findOne: jest.fn(),
    };

    mockContasBancariasRepository = {
      findOne: jest.fn(),
    };

    mockOfxParser = {
      parse: jest.fn(),
    };

    mockCsvParser = {
      parse: jest.fn(),
    };

    mockMatchingService = {
      encontrarSugestoes: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtratoBancarioService,
        { provide: 'ExtratoBancarioRepository', useValue: mockExtratoRepository },
        { provide: 'MovimentacoesBancariasRepository', useValue: mockMovimentacaoRepository },
        { provide: 'ContasBancariasRepository', useValue: mockContasBancariasRepository },
        { provide: OfxParser, useValue: mockOfxParser },
        { provide: CsvParser, useValue: mockCsvParser },
        { provide: MatchingService, useValue: mockMatchingService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ExtratoBancarioService>(ExtratoBancarioService);
  });

  describe('importar', () => {
    const contaBancaria = {
      id: contaBancariaId,
      descricao: 'Conta Corrente',
      banco: 'Banco do Brasil',
      empresa: { id: 'empresa-123' },
    } as ContasBancarias;

    it('should import OFX file successfully', async () => {
      const transacoes = [
        {
          data: new Date('2025-01-15'),
          descricao: 'PAGAMENTO FORNECEDOR',
          documento: '12345',
          valor: 1500.0,
          tipo: 'debito' as const,
        },
      ];

      mockContasBancariasRepository.findOne.mockResolvedValue(contaBancaria);
      mockOfxParser.parse.mockResolvedValue(transacoes);
      mockMatchingService.encontrarSugestoes.mockResolvedValue(null);
      mockExtratoRepository.create.mockImplementation((data) => data);

      const dto = {
        contaBancariaId,
        formato: FormatoExtrato.OFX,
        nomeArquivo: 'extrato.ofx',
        conteudo: Buffer.from('OFX DATA'),
      };

      const resultado = await service.importar(dto, userId, userEmail);

      expect(resultado.totalImportado).toBe(1);
      expect(resultado.comSugestao).toBe(0);
      expect(resultado.semSugestao).toBe(1);
      expect(mockOfxParser.parse).toHaveBeenCalledWith(dto.conteudo);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should import CSV file successfully', async () => {
      const transacoes = [
        {
          data: new Date('2025-01-15'),
          descricao: 'PAGAMENTO',
          valor: 1500.0,
          tipo: 'debito' as const,
        },
      ];

      mockContasBancariasRepository.findOne.mockResolvedValue(contaBancaria);
      mockCsvParser.parse.mockResolvedValue(transacoes);
      mockMatchingService.encontrarSugestoes.mockResolvedValue(null);
      mockExtratoRepository.create.mockImplementation((data) => data);

      const dto = {
        contaBancariaId,
        formato: FormatoExtrato.CSV,
        nomeArquivo: 'extrato.csv',
        conteudo: Buffer.from('CSV DATA'),
      };

      const resultado = await service.importar(dto, userId, userEmail);

      expect(resultado.totalImportado).toBe(1);
      expect(mockCsvParser.parse).toHaveBeenCalledWith(dto.conteudo);
    });

    it('should create items with suggestions when matching found', async () => {
      const transacoes = [
        {
          data: new Date('2025-01-15'),
          descricao: 'PAGAMENTO',
          valor: 1500.0,
          tipo: 'debito' as const,
        },
      ];

      const sugestao = {
        movimentacaoId: 'mov-1',
        score: 95,
        razoes: ['Data exata', 'Valor exato'],
        movimentacao: {
          id: 'mov-1',
          data: new Date('2025-01-15'),
          descricao: 'PAGAMENTO',
          valor: 1500.0,
          tipo: 'Débito',
        },
      };

      const movimentacao = { id: 'mov-1' } as MovimentacoesBancarias;

      mockContasBancariasRepository.findOne.mockResolvedValue(contaBancaria);
      mockOfxParser.parse.mockResolvedValue(transacoes);
      mockMatchingService.encontrarSugestoes.mockResolvedValue(sugestao);
      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);
      mockExtratoRepository.create.mockImplementation((data) => data);

      const dto = {
        contaBancariaId,
        formato: FormatoExtrato.OFX,
        nomeArquivo: 'extrato.ofx',
        conteudo: Buffer.from('OFX DATA'),
      };

      const resultado = await service.importar(dto, userId, userEmail);

      expect(resultado.comSugestao).toBe(1);
      expect(resultado.semSugestao).toBe(0);
      expect(mockExtratoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: StatusExtratoItem.SUGESTAO,
          scoreMatch: 95,
        }),
      );
    });

    it('should throw NotFoundException when conta bancaria not found', async () => {
      mockContasBancariasRepository.findOne.mockResolvedValue(null);

      const dto = {
        contaBancariaId: 'invalid-id',
        formato: FormatoExtrato.OFX,
        nomeArquivo: 'extrato.ofx',
        conteudo: Buffer.from('OFX DATA'),
      };

      await expect(service.importar(dto, userId, userEmail)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when parse fails', async () => {
      mockContasBancariasRepository.findOne.mockResolvedValue(contaBancaria);
      mockOfxParser.parse.mockRejectedValue(new Error('Parse error'));

      const dto = {
        contaBancariaId,
        formato: FormatoExtrato.OFX,
        nomeArquivo: 'extrato.ofx',
        conteudo: Buffer.from('INVALID DATA'),
      };

      await expect(service.importar(dto, userId, userEmail)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when no transactions found', async () => {
      mockContasBancariasRepository.findOne.mockResolvedValue(contaBancaria);
      mockOfxParser.parse.mockResolvedValue([]);

      const dto = {
        contaBancariaId,
        formato: FormatoExtrato.OFX,
        nomeArquivo: 'extrato.ofx',
        conteudo: Buffer.from('OFX DATA'),
      };

      await expect(service.importar(dto, userId, userEmail)).rejects.toThrow(
        'Nenhuma transação encontrada no arquivo',
      );
    });

    it('should throw BadRequestException for unsupported format', async () => {
      mockContasBancariasRepository.findOne.mockResolvedValue(contaBancaria);

      const dto = {
        contaBancariaId,
        formato: 'INVALID' as any,
        nomeArquivo: 'extrato.txt',
        conteudo: Buffer.from('DATA'),
      };

      await expect(service.importar(dto, userId, userEmail)).rejects.toThrow(
        'Formato não suportado',
      );
    });

    it('should import multiple transactions and calculate stats correctly', async () => {
      const transacoes = [
        {
          data: new Date('2025-01-15'),
          descricao: 'COM SUGESTAO 1',
          valor: 1500.0,
          tipo: 'debito' as const,
        },
        {
          data: new Date('2025-01-16'),
          descricao: 'COM SUGESTAO 2',
          valor: 2000.0,
          tipo: 'credito' as const,
        },
        {
          data: new Date('2025-01-17'),
          descricao: 'SEM SUGESTAO',
          valor: 500.0,
          tipo: 'debito' as const,
        },
      ];

      mockContasBancariasRepository.findOne.mockResolvedValue(contaBancaria);
      mockOfxParser.parse.mockResolvedValue(transacoes);

      // Primeira e segunda têm sugestão, terceira não
      mockMatchingService.encontrarSugestoes
        .mockResolvedValueOnce({
          movimentacaoId: 'mov-1',
          score: 95,
          razoes: [],
          movimentacao: {},
        })
        .mockResolvedValueOnce({
          movimentacaoId: 'mov-2',
          score: 90,
          razoes: [],
          movimentacao: {},
        })
        .mockResolvedValueOnce(null);

      mockMovimentacaoRepository.findOne.mockResolvedValue({});
      mockExtratoRepository.create.mockImplementation((data) => data);

      const dto = {
        contaBancariaId,
        formato: FormatoExtrato.OFX,
        nomeArquivo: 'extrato.ofx',
        conteudo: Buffer.from('OFX DATA'),
      };

      const resultado = await service.importar(dto, userId, userEmail);

      expect(resultado.totalImportado).toBe(3);
      expect(resultado.comSugestao).toBe(2);
      expect(resultado.semSugestao).toBe(1);
    });
  });

  describe('aceitarSugestao', () => {
    it('should accept suggestion and mark as reconciled', async () => {
      const movimentacao = {
        id: 'mov-1',
        conciliado: 'N',
      } as MovimentacoesBancarias;

      const item = {
        id: 'extrato-1',
        status: StatusExtratoItem.SUGESTAO,
        movimentacaoSugerida: movimentacao,
        empresaId: 'empresa-123',
        scoreMatch: 95,
      } as ExtratoBancario;

      mockExtratoRepository.findOne.mockResolvedValue(item);

      await service.aceitarSugestao('extrato-1', userId, userEmail);

      expect(movimentacao.conciliado).toBe('S');
      expect(movimentacao.conciliadoPor).toBe(userId);
      expect(movimentacao.conciliadoEm).toBeDefined();
      expect(item.status).toBe(StatusExtratoItem.CONCILIADO);
      expect(item.movimentacaoConciliada).toBe(movimentacao);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when item not found', async () => {
      mockExtratoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.aceitarSugestao('invalid-id', userId, userEmail),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no suggestion exists', async () => {
      const item = {
        id: 'extrato-1',
        status: StatusExtratoItem.PENDENTE,
        movimentacaoSugerida: undefined,
      } as ExtratoBancario;

      mockExtratoRepository.findOne.mockResolvedValue(item);

      await expect(
        service.aceitarSugestao('extrato-1', userId, userEmail),
      ).rejects.toThrow('Item não possui sugestão de conciliação');
    });

    it('should throw BadRequestException when already reconciled', async () => {
      const item = {
        id: 'extrato-1',
        status: StatusExtratoItem.CONCILIADO,
        movimentacaoSugerida: { id: 'mov-1' } as MovimentacoesBancarias,
      } as ExtratoBancario;

      mockExtratoRepository.findOne.mockResolvedValue(item);

      await expect(
        service.aceitarSugestao('extrato-1', userId, userEmail),
      ).rejects.toThrow('Item já está conciliado');
    });
  });

  describe('rejeitarSugestao', () => {
    it('should reject suggestion and mark as pending', async () => {
      const item = {
        id: 'extrato-1',
        status: StatusExtratoItem.SUGESTAO,
        movimentacaoSugerida: { id: 'mov-1' } as MovimentacoesBancarias,
        scoreMatch: 95,
        empresaId: 'empresa-123',
      } as ExtratoBancario;

      mockExtratoRepository.findOne.mockResolvedValue(item);

      await service.rejeitarSugestao('extrato-1', userId, userEmail);

      expect(item.status).toBe(StatusExtratoItem.PENDENTE);
      expect(item.movimentacaoSugerida).toBeUndefined();
      expect(item.scoreMatch).toBeUndefined();
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when item not found', async () => {
      mockExtratoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.rejeitarSugestao('invalid-id', userId, userEmail),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('ignorarItem', () => {
    it('should mark item as ignored', async () => {
      const item = {
        id: 'extrato-1',
        status: StatusExtratoItem.PENDENTE,
        empresaId: 'empresa-123',
      } as ExtratoBancario;

      mockExtratoRepository.findOne.mockResolvedValue(item);

      await service.ignorarItem('extrato-1', userId, userEmail);

      expect(item.status).toBe(StatusExtratoItem.IGNORADO);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when item not found', async () => {
      mockExtratoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.ignorarItem('invalid-id', userId, userEmail),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all extratos without filter', async () => {
      const extratos = [{ id: '1' }, { id: '2' }] as ExtratoBancario[];
      mockExtratoRepository.find.mockResolvedValue(extratos);

      const result = await service.findAll();

      expect(result).toEqual(extratos);
      expect(mockExtratoRepository.find).toHaveBeenCalledWith(
        { deletadoEm: null },
        expect.any(Object),
      );
    });

    it('should return extratos filtered by conta bancaria', async () => {
      const extratos = [{ id: '1' }] as ExtratoBancario[];
      mockExtratoRepository.find.mockResolvedValue(extratos);

      const result = await service.findAll(contaBancariaId);

      expect(result).toEqual(extratos);
      expect(mockExtratoRepository.find).toHaveBeenCalledWith(
        { deletadoEm: null, contaBancaria: contaBancariaId },
        expect.any(Object),
      );
    });
  });

  describe('findPendentes', () => {
    it('should return only pending and suggestion items', async () => {
      const extratos = [
        { id: '1', status: StatusExtratoItem.PENDENTE },
        { id: '2', status: StatusExtratoItem.SUGESTAO },
      ] as ExtratoBancario[];

      mockExtratoRepository.find.mockResolvedValue(extratos);

      const result = await service.findPendentes(contaBancariaId);

      expect(result).toEqual(extratos);
      expect(mockExtratoRepository.find).toHaveBeenCalledWith(
        {
          contaBancaria: contaBancariaId,
          status: { $in: [StatusExtratoItem.PENDENTE, StatusExtratoItem.SUGESTAO] },
          deletadoEm: null,
        },
        expect.any(Object),
      );
    });
  });
});
