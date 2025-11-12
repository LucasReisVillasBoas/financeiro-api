import { validate } from 'class-validator';
import { CreateContaPagarDto } from '../../src/conta-pagar/dto/create-conta-pagar.dto';
import { TipoContaPagar } from '../../src/entities/conta-pagar/conta-pagar.entity';

describe('DataOrdemValidator', () => {
  const createValidDto = (): CreateContaPagarDto => {
    const dto = new CreateContaPagarDto();
    dto.documento = 'NF-12345';
    dto.serie = '1';
    dto.parcela = 1;
    dto.tipo = TipoContaPagar.FORNECEDOR;
    dto.descricao = 'Teste';
    dto.data_emissao = '2025-01-01';
    dto.vencimento = '2025-01-31';
    dto.data_lancamento = '2025-01-01';
    dto.valor_principal = 1000;
    dto.pessoaId = '550e8400-e29b-41d4-a716-446655440001';
    dto.planoContasId = '550e8400-e29b-41d4-a716-446655440002';
    dto.empresaId = '550e8400-e29b-41d4-a716-446655440003';
    return dto;
  };

  describe('Validação de ordem de datas', () => {
    it('deve aceitar datas em ordem válida: data_emissao = vencimento', async () => {
      const dto = createValidDto();
      dto.data_emissao = '2025-01-31';
      dto.vencimento = '2025-01-31';

      const errors = await validate(dto);
      const dateErrors = errors.filter((e) =>
        e.constraints?.hasOwnProperty('IsDataOrdemValida'),
      );

      expect(dateErrors).toHaveLength(0);
    });

    it('deve aceitar datas em ordem válida: vencimento = data_liquidacao', async () => {
      const dto = createValidDto();
      dto.vencimento = '2025-01-31';
      dto.data_liquidacao = '2025-01-31';

      const errors = await validate(dto);
      const dateErrors = errors.filter((e) =>
        e.constraints?.hasOwnProperty('IsDataOrdemValida'),
      );

      expect(dateErrors).toHaveLength(0);
    });

    it('deve aceitar datas em ordem válida: data_emissao < vencimento < data_liquidacao', async () => {
      const dto = createValidDto();
      dto.data_emissao = '2025-01-01';
      dto.vencimento = '2025-01-31';
      dto.data_liquidacao = '2025-02-15';

      const errors = await validate(dto);
      const dateErrors = errors.filter((e) =>
        e.constraints?.hasOwnProperty('IsDataOrdemValida'),
      );

      expect(dateErrors).toHaveLength(0);
    });

    it('deve aceitar mesmo se data_emissao > vencimento (validado no service)', async () => {
      const dto = createValidDto();
      dto.data_emissao = '2025-02-01';
      dto.vencimento = '2025-01-31';

      const errors = await validate(dto);
      const dateErrors = errors.filter((e) =>
        e.constraints?.hasOwnProperty('IsDataOrdemValida'),
      );

      // O validator de DTO só valida vencimento vs data_liquidacao
      // A validação data_emissao vs vencimento é feita no service
      expect(dateErrors).toHaveLength(0);
    });

    it('deve rejeitar se vencimento > data_liquidacao', async () => {
      const dto = createValidDto();
      dto.vencimento = '2025-02-01';
      dto.data_liquidacao = '2025-01-15';

      const errors = await validate(dto);
      const dateErrors = errors.filter((e) =>
        e.constraints?.hasOwnProperty('IsDataOrdemValida'),
      );

      expect(dateErrors.length).toBeGreaterThan(0);
    });

    it('deve permitir data_liquidacao vazia (opcional)', async () => {
      const dto = createValidDto();
      dto.data_emissao = '2025-01-01';
      dto.vencimento = '2025-01-31';
      dto.data_liquidacao = undefined;

      const errors = await validate(dto);
      const dateErrors = errors.filter((e) =>
        e.constraints?.hasOwnProperty('IsDataOrdemValida'),
      );

      expect(dateErrors).toHaveLength(0);
    });
  });

  describe('Validação de campos obrigatórios', () => {
    it('deve rejeitar se documento estiver vazio', async () => {
      const dto = createValidDto();
      dto.documento = '';

      const errors = await validate(dto);
      const docErrors = errors.filter((e) => e.property === 'documento');

      expect(docErrors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar se parcela for menor que 1', async () => {
      const dto = createValidDto();
      dto.parcela = 0;

      const errors = await validate(dto);
      const parcelaErrors = errors.filter((e) => e.property === 'parcela');

      expect(parcelaErrors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar se valor_principal for zero ou negativo', async () => {
      const dto = createValidDto();
      dto.valor_principal = 0;

      const errors = await validate(dto);
      const valorErrors = errors.filter(
        (e) => e.property === 'valor_principal',
      );

      expect(valorErrors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar se pessoaId não for UUID válido', async () => {
      const dto = createValidDto();
      dto.pessoaId = 'invalid-uuid';

      const errors = await validate(dto);
      const pessoaErrors = errors.filter((e) => e.property === 'pessoaId');

      expect(pessoaErrors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar se planoContasId não for UUID válido', async () => {
      const dto = createValidDto();
      dto.planoContasId = 'invalid-uuid';

      const errors = await validate(dto);
      const planoErrors = errors.filter((e) => e.property === 'planoContasId');

      expect(planoErrors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar se empresaId não for UUID válido', async () => {
      const dto = createValidDto();
      dto.empresaId = 'invalid-uuid';

      const errors = await validate(dto);
      const empresaErrors = errors.filter((e) => e.property === 'empresaId');

      expect(empresaErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Validação de valores opcionais', () => {
    it('deve aceitar acrescimos e descontos como undefined', async () => {
      const dto = createValidDto();
      dto.acrescimos = undefined;
      dto.descontos = undefined;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('deve aceitar acrescimos = 0', async () => {
      const dto = createValidDto();
      dto.acrescimos = 0;

      const errors = await validate(dto);
      const acrescimosErrors = errors.filter(
        (e) => e.property === 'acrescimos',
      );

      expect(acrescimosErrors).toHaveLength(0);
    });

    it('deve rejeitar acrescimos negativos', async () => {
      const dto = createValidDto();
      dto.acrescimos = -50;

      const errors = await validate(dto);
      const acrescimosErrors = errors.filter(
        (e) => e.property === 'acrescimos',
      );

      expect(acrescimosErrors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar descontos negativos', async () => {
      const dto = createValidDto();
      dto.descontos = -30;

      const errors = await validate(dto);
      const descontosErrors = errors.filter((e) => e.property === 'descontos');

      expect(descontosErrors.length).toBeGreaterThan(0);
    });

    it('deve aceitar serie como opcional', async () => {
      const dto = createValidDto();
      dto.serie = undefined;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Validação de enum Tipo', () => {
    it('deve aceitar todos os tipos válidos', async () => {
      const tipos = [
        TipoContaPagar.FORNECEDOR,
        TipoContaPagar.EMPRESTIMO,
        TipoContaPagar.IMPOSTO,
        TipoContaPagar.SALARIO,
        TipoContaPagar.ALUGUEL,
        TipoContaPagar.SERVICO,
        TipoContaPagar.OUTROS,
      ];

      for (const tipo of tipos) {
        const dto = createValidDto();
        dto.tipo = tipo;

        const errors = await validate(dto);
        const tipoErrors = errors.filter((e) => e.property === 'tipo');

        expect(tipoErrors).toHaveLength(0);
      }
    });

    it('deve rejeitar tipo inválido', async () => {
      const dto = createValidDto();
      dto.tipo = 'TIPO_INVALIDO' as any;

      const errors = await validate(dto);
      const tipoErrors = errors.filter((e) => e.property === 'tipo');

      expect(tipoErrors.length).toBeGreaterThan(0);
    });
  });
});
