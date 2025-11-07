# Análise - Módulo Contas a Receber

## Status Atual: ❌ INCOMPLETO

### Requisitos da Tarefa

> **Criar mecanismo que gere automaticamente lançamentos na tabela de movimentações a partir das baixas de contas a pagar e contas a receber.**

#### Critérios de Aceite:
1. ❌ **Baixa em contas a receber gera movimentação tipo crédito** - NÃO IMPLEMENTADO
2. ✅ **Baixa em contas a pagar gera movimentação tipo débito** - IMPLEMENTADO
3. ⚠️ **Valor líquido (principal + acréscimos – descontos) refletido corretamente** - PARCIAL
4. ⚠️ **Exclusão ou estorno reverte a movimentação associada** - APENAS EM CONTAS A PAGAR

---

## Análise do Código Atual

### ✅ Contas a Pagar - COMPLETO

**Arquivo**: `src/baixa-pagamento/baixa-pagamento.service.ts`

#### Funcionalidades Implementadas:
- ✅ Criação de baixa com geração automática de movimentação bancária tipo "Saída" (Débito)
- ✅ Cálculo de valor líquido: `totalBaixa = valor + acréscimos - descontos`
- ✅ Atualização de saldo da conta bancária
- ✅ Estorno de baixa com criação de movimentação reversa tipo "Entrada" (Crédito)
- ✅ Referência automática: `TipoReferencia.PAGAR`
- ✅ Auditoria completa
- ✅ Testes abrangentes (32 testes passando)

**Exemplo de geração de movimentação:**
```typescript
const movimentacao = this.movimentacaoRepository.create({
  data: new Date(dto.data),
  descricao: `Baixa de pagamento ${contaPagar.documento}`,
  conta: contaBancaria.banco,
  categoria: 'Pagamento Fornecedor',
  valor: totalBaixa,  // valor + acréscimos - descontos
  tipo: 'Saída',      // DÉBITO
  contaBancaria,
  empresaId: contaPagar.empresa.id,
  planoContas: contaPagar.planoContas,
  referencia: TipoReferencia.PAGAR,
  observacao: dto.observacao,
});
```

---

### ❌ Contas a Receber - INCOMPLETO

**Arquivo**: `src/conta-receber/conta-receber.service.ts`

#### Problemas Identificados:

1. **NÃO possui módulo de baixa de recebimento**
   - Não existe `baixa-recebimento.service.ts`
   - Não existe `BaixaRecebimento` entity
   - Não existe DTOs para baixa de recebimento

2. **NÃO gera movimentação bancária**
   - Método `marcarComoRecebida()` apenas altera status
   - Não cria registro em `movimentacoes_bancarias`
   - Não atualiza saldo da conta bancária

3. **NÃO possui controle de acréscimos e descontos**
   - Entidade não tem campos para `acrescimos` e `descontos`
   - Não calcula valor líquido

4. **NÃO possui integração com conta bancária**
   - Não há FK para `contas_bancarias`
   - Não atualiza saldo ao receber

5. **NÃO possui sistema de estorno**
   - Não há método de estorno
   - Não reverte movimentação bancária

6. **Entidade muito básica**
   - Faltam campos essenciais:
     - `documento` (número da NF)
     - `parcela` e `num_parcelas`
     - `valor_principal`, `acrescimos`, `descontos`
     - `valor_total`, `saldo`
     - `data_emissao`, `data_lancamento`
     - `tipo` (CLIENTE, OUTROS)
     - FK para `pessoa` (cliente)
     - FK para `empresa`
     - FK para `conta_bancaria`

---

## Comparação: Contas a Pagar vs Contas a Receber

| Funcionalidade | Contas a Pagar | Contas a Receber |
|----------------|----------------|------------------|
| Entidade completa | ✅ | ❌ |
| Baixa de título | ✅ | ❌ |
| Geração de movimentação | ✅ Débito/Saída | ❌ Nenhuma |
| Acréscimos/Descontos | ✅ | ❌ |
| Valor líquido | ✅ | ❌ |
| Integração bancária | ✅ | ❌ |
| Estorno | ✅ | ❌ |
| Auditoria | ✅ | ❌ |
| Testes | ✅ 32 testes | ❌ 0 testes |
| Parcelamento | ✅ | ❌ |

---

## O Que Precisa Ser Implementado

### 1. **Refatorar Entidade ContasReceber**

Adicionar campos faltantes:
```typescript
@Property({ type: 'varchar', length: 100 })
documento!: string;

@Property({ type: 'int' })
parcela: number = 1;

@Property({ type: 'int' })
num_parcelas: number = 1;

@Property({ type: 'decimal', precision: 15, scale: 2 })
valor_principal!: number;

@Property({ type: 'decimal', precision: 15, scale: 2, default: 0 })
acrescimos: number = 0;

@Property({ type: 'decimal', precision: 15, scale: 2, default: 0 })
descontos: number = 0;

@Property({ type: 'decimal', precision: 15, scale: 2 })
valor_total!: number;

@Property({ type: 'decimal', precision: 15, scale: 2 })
saldo!: number;

@Property({ type: 'date' })
data_emissao!: Date;

@Property({ type: 'date' })
data_lancamento!: Date;

@Property({ type: 'varchar', length: 50 })
tipo: TipoContaReceber = TipoContaReceber.CLIENTE;

@ManyToOne(() => Pessoa, { fieldName: 'pessoa_id' })
pessoa!: Pessoa;

@ManyToOne(() => Empresa, { fieldName: 'empresa_id' })
empresa!: Empresa;
```

### 2. **Criar Módulo BaixaRecebimento**

Estrutura similar a `baixa-pagamento`:

**Arquivos necessários:**
- `src/baixa-recebimento/baixa-recebimento.entity.ts`
- `src/baixa-recebimento/baixa-recebimento.service.ts`
- `src/baixa-recebimento/baixa-recebimento.controller.ts`
- `src/baixa-recebimento/baixa-recebimento.module.ts`
- `src/baixa-recebimento/baixa-recebimento.repository.ts`
- `src/baixa-recebimento/dto/create-baixa-recebimento.dto.ts`

**Funcionalidades:**
- Registrar baixa de recebimento
- Gerar movimentação bancária tipo **Crédito/Entrada**
- Calcular valor líquido
- Atualizar saldo da conta bancária
- Atualizar saldo da conta a receber
- Permitir estorno
- Auditoria completa

### 3. **Criar Migration para ContasReceber**

Adicionar todos os campos faltantes à tabela `contas_receber`.

### 4. **Implementar Lógica de Baixa com Movimentação**

```typescript
async create(dto: CreateBaixaRecebimentoDto): Promise<BaixaRecebimento> {
  // 1. Buscar conta a receber
  // 2. Validar saldo disponível
  // 3. Calcular valor líquido (valor + acréscimos - descontos)
  // 4. CRIAR MOVIMENTAÇÃO BANCÁRIA TIPO CRÉDITO
  const movimentacao = this.movimentacaoRepository.create({
    dataMovimento: new Date(dto.data),
    descricao: `Recebimento ${contaReceber.documento}`,
    conta: contaBancaria.banco,
    categoria: 'Recebimento de Cliente',
    valor: totalRecebido,
    tipoMovimento: TipoMovimento.CREDITO, // ✅ CRÉDITO
    contaBancaria,
    empresaId: contaReceber.empresa.id,
    planoContas: contaReceber.planoContas,
    referencia: TipoReferencia.RECEBER, // ✅ REFERÊNCIA
    observacao: dto.observacao,
  });

  // 5. ATUALIZAR SALDO BANCÁRIO (+)
  contaBancaria.saldo_atual += totalRecebido;

  // 6. Criar baixa e vincular movimentação
  // 7. Persistir tudo
  // 8. Auditoria
}
```

### 5. **Implementar Estorno**

```typescript
async estornar(id: string, justificativa: string): Promise<BaixaRecebimento> {
  // 1. Buscar baixa
  // 2. Restaurar saldo da conta a receber
  // 3. CRIAR MOVIMENTAÇÃO REVERSA TIPO DÉBITO
  const movimentacaoEstorno = this.movimentacaoRepository.create({
    dataMovimento: new Date(),
    descricao: `Estorno - ${contaReceber.documento}`,
    valor: baixa.total,
    tipoMovimento: TipoMovimento.DEBITO, // ✅ DÉBITO (reverso)
    referencia: TipoReferencia.RECEBER,
    observacao: justificativa,
    // ... outros campos
  });

  // 4. REVERTER SALDO BANCÁRIO (-)
  contaBancaria.saldo_atual -= baixa.total;

  // 5. Marcar baixa como deletada
  // 6. Persistir
  // 7. Auditoria
}
```

### 6. **Criar Testes Completos**

Similar aos testes de baixa-pagamento:
- Testes de criação de baixa
- Testes de cálculo de valores
- Testes de integração bancária
- Testes de estorno
- Validações de regras de negócio

---

## Estimativa de Implementação

### Tarefas:
1. ⏱️ Refatorar entidade ContasReceber - 30 min
2. ⏱️ Criar migration para ContasReceber - 15 min
3. ⏱️ Criar entidade BaixaRecebimento - 20 min
4. ⏱️ Criar service de BaixaRecebimento - 45 min
5. ⏱️ Criar controller e DTOs - 20 min
6. ⏱️ Implementar integração com movimentação bancária - 30 min
7. ⏱️ Implementar estorno - 30 min
8. ⏱️ Criar testes completos - 60 min
9. ⏱️ Atualizar módulos e dependências - 15 min
10. ⏱️ Documentação - 15 min

**Total**: ~4 horas

---

## Conclusão

O módulo de **Contas a Pagar** está **completo e funcional**, cumprindo todos os requisitos:
- ✅ Gera movimentação tipo débito
- ✅ Calcula valor líquido corretamente
- ✅ Estorno reverte movimentação

O módulo de **Contas a Receber** está **incompleto**, faltando:
- ❌ Sistema de baixa de recebimento
- ❌ Geração de movimentação tipo crédito
- ❌ Integração bancária
- ❌ Sistema de estorno

**Recomendação**: Implementar módulo completo de baixa de recebimento seguindo o padrão estabelecido em baixa de pagamento.
