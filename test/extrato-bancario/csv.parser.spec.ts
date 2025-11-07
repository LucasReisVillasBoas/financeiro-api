import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CsvParser } from '../../src/extrato-bancario/parsers/csv.parser';

describe('CsvParser', () => {
  let parser: CsvParser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvParser],
    }).compile();

    parser = module.get<CsvParser>(CsvParser);
  });

  it('should be defined', () => {
    expect(parser).toBeDefined();
  });

  describe('parse - Valid Files', () => {
    it('should parse CSV with Portuguese column names', async () => {
      const csvContent = `data,descricao,valor,tipo
15/01/2025,PAGAMENTO FORNECEDOR,1500.00,Débito
16/01/2025,RECEBIMENTO CLIENTE,2500.50,Crédito`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(2);

      expect(transacoes[0]).toMatchObject({
        data: new Date(2025, 0, 15),
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.00,
        tipo: 'debito',
      });

      expect(transacoes[1]).toMatchObject({
        data: new Date(2025, 0, 16),
        descricao: 'RECEBIMENTO CLIENTE',
        valor: 2500.50,
        tipo: 'credito',
      });
    });

    it('should parse CSV with English column names', async () => {
      const csvContent = `date,name,amount,type
2025-01-15,PAYMENT TO SUPPLIER,1500.00,Debit
2025-01-16,CUSTOMER RECEIPT,2500.50,Credit`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(2);

      expect(transacoes[0]).toMatchObject({
        descricao: 'PAYMENT TO SUPPLIER',
        valor: 1500.00,
        tipo: 'debito',
      });
    });

    it('should parse CSV with alternative column names', async () => {
      const csvContent = `dt,historico,vl,natureza
15/01/2025,COMPRA MATERIAL,350.75,Débito`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(1);
      expect(transacoes[0].descricao).toBe('COMPRA MATERIAL');
    });

    it('should parse CSV without tipo column (inferring from value)', async () => {
      const csvContent = `data,descricao,valor
15/01/2025,PAGAMENTO,-1500.00
16/01/2025,RECEBIMENTO,2500.50`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].tipo).toBe('debito'); // Valor negativo
      expect(transacoes[1].tipo).toBe('credito'); // Valor positivo
    });

    it('should parse CSV with documento column', async () => {
      const csvContent = `data,descricao,valor,tipo,documento
15/01/2025,PAGAMENTO,1500.00,Débito,NF-12345`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].documento).toBe('NF-12345');
    });

    it('should handle Brazilian number format (1.234,56)', async () => {
      const csvContent = `data,descricao,valor
15/01/2025,PAGAMENTO,1.500,00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].valor).toBe(1500.00);
    });

    it('should handle American number format (1,234.56)', async () => {
      const csvContent = `data,descricao,valor
2025-01-15,PAYMENT,1,500.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].valor).toBe(1500.00);
    });

    it('should parse date format DD/MM/YYYY', async () => {
      const csvContent = `data,descricao,valor
31/12/2025,TESTE,100.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].data).toEqual(new Date(2025, 11, 31));
    });

    it('should parse date format YYYY-MM-DD', async () => {
      const csvContent = `data,descricao,valor
2025-12-31,TESTE,100.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].data).toEqual(new Date(2025, 11, 31));
    });

    it('should parse date format YYYYMMDD', async () => {
      const csvContent = `data,descricao,valor
20251231,TESTE,100.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].data).toEqual(new Date(2025, 11, 31));
    });

    it('should infer debit from tipo column variations', async () => {
      const csvContent = `data,descricao,valor,tipo
15/01/2025,TEST1,100.00,Débito
16/01/2025,TEST2,100.00,debito
17/01/2025,TEST3,100.00,Saída
18/01/2025,TEST4,100.00,saida`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      transacoes.forEach((t) => {
        expect(t.tipo).toBe('debito');
      });
    });

    it('should infer credit from tipo column variations', async () => {
      const csvContent = `data,descricao,valor,tipo
15/01/2025,TEST1,100.00,Crédito
16/01/2025,TEST2,100.00,credito
17/01/2025,TEST3,100.00,Entrada
18/01/2025,TEST4,100.00,entrada`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      transacoes.forEach((t) => {
        expect(t.tipo).toBe('credito');
      });
    });

    it('should handle negative values as debit when no tipo column', async () => {
      const csvContent = `data,descricao,valor
15/01/2025,SAQUE,-500.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].tipo).toBe('debito');
      expect(transacoes[0].valor).toBe(500.00);
    });

    it('should handle CSV with BOM (Byte Order Mark)', async () => {
      const csvContent = '\uFEFFdata,descricao,valor\n15/01/2025,TESTE,100.00';
      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(1);
      expect(transacoes[0].descricao).toBe('TESTE');
    });

    it('should skip empty rows', async () => {
      const csvContent = `data,descricao,valor
15/01/2025,TESTE1,100.00

16/01/2025,TESTE2,200.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(2);
    });

    it('should handle quoted fields with commas', async () => {
      const csvContent = `data,descricao,valor
15/01/2025,"PAGAMENTO FORNECEDOR XYZ, LTDA",1500.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].descricao).toBe('PAGAMENTO FORNECEDOR XYZ, LTDA');
    });
  });

  describe('parse - Invalid Files', () => {
    it('should reject CSV without required columns', async () => {
      const csvContent = `coluna1,coluna2
valor1,valor2`;

      const buffer = Buffer.from(csvContent, 'utf-8');

      await expect(parser.parse(buffer)).rejects.toThrow(BadRequestException);
      await expect(parser.parse(buffer)).rejects.toThrow(
        'colunas obrigatórias não encontradas',
      );
    });

    it('should reject CSV missing data column', async () => {
      const csvContent = `descricao,valor
TESTE,100.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');

      await expect(parser.parse(buffer)).rejects.toThrow(BadRequestException);
    });

    it('should reject CSV missing descricao column', async () => {
      const csvContent = `data,valor
15/01/2025,100.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');

      await expect(parser.parse(buffer)).rejects.toThrow(BadRequestException);
    });

    it('should reject CSV missing valor column', async () => {
      const csvContent = `data,descricao
15/01/2025,TESTE`;

      const buffer = Buffer.from(csvContent, 'utf-8');

      await expect(parser.parse(buffer)).rejects.toThrow(BadRequestException);
    });

    it('should reject empty CSV file', async () => {
      const csvContent = '';
      const buffer = Buffer.from(csvContent, 'utf-8');

      await expect(parser.parse(buffer)).rejects.toThrow();
    });

    it('should reject CSV with only headers', async () => {
      const csvContent = 'data,descricao,valor';
      const buffer = Buffer.from(csvContent, 'utf-8');

      const transacoes = await parser.parse(buffer);
      expect(transacoes).toHaveLength(0);
    });

    it('should skip rows with invalid date format', async () => {
      const csvContent = `data,descricao,valor
INVALID_DATE,TESTE1,100.00
15/01/2025,TESTE2,200.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      // Deve processar apenas a linha válida
      expect(transacoes).toHaveLength(1);
      expect(transacoes[0].descricao).toBe('TESTE2');
    });

    it('should skip rows with invalid valor format', async () => {
      const csvContent = `data,descricao,valor
15/01/2025,TESTE1,INVALID
16/01/2025,TESTE2,200.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(1);
      expect(transacoes[0].descricao).toBe('TESTE2');
    });

    it('should skip rows with zero value', async () => {
      const csvContent = `data,descricao,valor
15/01/2025,TESTE1,0.00
16/01/2025,TESTE2,200.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(1);
      expect(transacoes[0].descricao).toBe('TESTE2');
    });
  });

  describe('parse - Edge Cases', () => {
    it('should handle large CSV files', async () => {
      const rows = ['data,descricao,valor'];
      for (let i = 1; i <= 1000; i++) {
        rows.push(`15/01/2025,TRANSACAO ${i},${i}.00`);
      }
      const csvContent = rows.join('\n');

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(1000);
    });

    it('should handle special characters in descriptions', async () => {
      const csvContent = `data,descricao,valor
15/01/2025,"PAGAMENTO COM ACENTUAÇÃO: ÃÇÉ",100.00
16/01/2025,"CARACTERES ESPECIAIS: @#$%",200.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(2);
      expect(transacoes[0].descricao).toContain('ACENTUAÇÃO');
      expect(transacoes[1].descricao).toContain('@#$%');
    });

    it('should handle very long descriptions', async () => {
      const longDesc = 'A'.repeat(1000);
      const csvContent = `data,descricao,valor
15/01/2025,"${longDesc}",100.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].descricao).toBe(longDesc);
    });

    it('should handle values with many decimal places', async () => {
      const csvContent = `data,descricao,valor
15/01/2025,TESTE,123.456789`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      // Deve truncar/arredondar para 2 casas decimais
      expect(transacoes[0].valor).toBeCloseTo(123.46, 2);
    });

    it('should handle semicolon delimiter', async () => {
      const csvContent = `data;descricao;valor
15/01/2025;PAGAMENTO;1500.00`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(1);
      expect(transacoes[0].descricao).toBe('PAGAMENTO');
    });
  });
});
