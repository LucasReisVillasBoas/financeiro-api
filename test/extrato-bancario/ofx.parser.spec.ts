import { Test, TestingModule } from '@nestjs/testing';
import { OfxParser } from '../../src/extrato-bancario/parsers/ofx.parser';

describe('OfxParser', () => {
  let parser: OfxParser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OfxParser],
    }).compile();

    parser = module.get<OfxParser>(OfxParser);
  });

  it('should be defined', () => {
    expect(parser).toBeDefined();
  });

  describe('parse', () => {
    it('should parse valid OFX file with single transaction', async () => {
      const ofxContent = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS>
        <CODE>0
        <SEVERITY>INFO
      </STATUS>
      <DTSERVER>20250107120000
      <LANGUAGE>POR
    </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1
      <STATUS>
        <CODE>0
        <SEVERITY>INFO
      </STATUS>
      <STMTRS>
        <CURDEF>BRL
        <BANKACCTFROM>
          <BANKID>001
          <ACCTID>12345-6
          <ACCTTYPE>CHECKING
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>20250101
          <DTEND>20250131
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20250115
            <TRNAMT>-1500.00
            <FITID>202501151234
            <CHECKNUM>12345
            <NAME>FORNECEDOR XYZ LTDA
            <MEMO>PAGAMENTO NF 12345
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
      `;

      const buffer = Buffer.from(ofxContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(1);
      expect(transacoes[0]).toMatchObject({
        data: new Date(2025, 0, 15), // Janeiro = 0
        descricao: expect.stringContaining('PAGAMENTO'),
        documento: '12345',
        valor: 1500.00,
        tipo: 'debito',
      });
    });

    it('should parse OFX file with multiple transactions', async () => {
      const ofxContent = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20250115
            <TRNAMT>-1500.00
            <FITID>001
            <MEMO>PAGAMENTO FORNECEDOR
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT
            <DTPOSTED>20250116
            <TRNAMT>2500.50
            <FITID>002
            <MEMO>RECEBIMENTO CLIENTE
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20250117
            <TRNAMT>-150.00
            <FITID>003
            <MEMO>TAXA BANCARIA
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
      `;

      const buffer = Buffer.from(ofxContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(3);

      // Primeira transação (débito)
      expect(transacoes[0]).toMatchObject({
        valor: 1500.00,
        tipo: 'debito',
        descricao: 'PAGAMENTO FORNECEDOR',
      });

      // Segunda transação (crédito)
      expect(transacoes[1]).toMatchObject({
        valor: 2500.50,
        tipo: 'credito',
        descricao: 'RECEBIMENTO CLIENTE',
      });

      // Terceira transação (débito)
      expect(transacoes[2]).toMatchObject({
        valor: 150.00,
        tipo: 'debito',
        descricao: 'TAXA BANCARIA',
      });
    });

    it('should handle transaction with positive amount as credit', async () => {
      const ofxContent = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <DTPOSTED>20250115
            <TRNAMT>1000.00
            <FITID>001
            <MEMO>DEPOSITO
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
      `;

      const buffer = Buffer.from(ofxContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].tipo).toBe('credito');
      expect(transacoes[0].valor).toBe(1000.00);
    });

    it('should handle transaction with negative amount as debit', async () => {
      const ofxContent = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <DTPOSTED>20250115
            <TRNAMT>-500.00
            <FITID>001
            <MEMO>SAQUE
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
      `;

      const buffer = Buffer.from(ofxContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].tipo).toBe('debito');
      expect(transacoes[0].valor).toBe(500.00);
    });

    it('should use FITID as documento when no CHECKNUM', async () => {
      const ofxContent = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <DTPOSTED>20250115
            <TRNAMT>-100.00
            <FITID>FIT123456
            <MEMO>TRANSACAO
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
      `;

      const buffer = Buffer.from(ofxContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].documento).toBe('FIT123456');
    });

    it('should use NAME when no MEMO available', async () => {
      const ofxContent = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <DTPOSTED>20250115
            <TRNAMT>-100.00
            <FITID>001
            <NAME>FORNECEDOR ABC
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
      `;

      const buffer = Buffer.from(ofxContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].descricao).toBe('FORNECEDOR ABC');
    });

    it('should provide default description when no MEMO or NAME', async () => {
      const ofxContent = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <DTPOSTED>20250115
            <TRNAMT>-100.00
            <FITID>001
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
      `;

      const buffer = Buffer.from(ofxContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].descricao).toBe('Transação sem descrição');
    });

    it('should reject invalid OFX format', async () => {
      const invalidContent = 'NOT A VALID OFX FILE';
      const buffer = Buffer.from(invalidContent, 'utf-8');

      await expect(parser.parse(buffer)).rejects.toThrow('Formato OFX inválido');
    });

    it('should reject OFX without transactions', async () => {
      const ofxContent = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
      `;

      const buffer = Buffer.from(ofxContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes).toHaveLength(0);
    });

    it('should parse dates correctly in YYYYMMDD format', async () => {
      const ofxContent = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <DTPOSTED>20251231
            <TRNAMT>-100.00
            <FITID>001
            <MEMO>TESTE DATA
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
      `;

      const buffer = Buffer.from(ofxContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      expect(transacoes[0].data).toEqual(new Date(2025, 11, 31)); // Dezembro = 11
    });

    it('should skip transactions without required fields', async () => {
      const ofxContent = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <DTPOSTED>20250115
            <MEMO>SEM VALOR
          </STMTTRN>
          <STMTTRN>
            <TRNAMT>-100.00
            <MEMO>SEM DATA
          </STMTTRN>
          <STMTTRN>
            <DTPOSTED>20250116
            <TRNAMT>-200.00
            <FITID>VALID
            <MEMO>VALIDA
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
      `;

      const buffer = Buffer.from(ofxContent, 'utf-8');
      const transacoes = await parser.parse(buffer);

      // Apenas a última transação válida deve ser retornada
      expect(transacoes).toHaveLength(1);
      expect(transacoes[0].descricao).toBe('VALIDA');
    });
  });
});
