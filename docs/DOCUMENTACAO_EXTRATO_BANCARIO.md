# Documentação: Importação e Conciliação de Extratos Bancários

## Sumário
1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Arquitetura](#arquitetura)
4. [API Endpoints](#api-endpoints)
5. [Formatos Suportados](#formatos-suportados)
6. [Algoritmo de Matching](#algoritmo-de-matching)
7. [Fluxo de Conciliação](#fluxo-de-conciliação)
8. [Frontend](#frontend)
9. [Exemplos de Uso](#exemplos-de-uso)

---

## Visão Geral

O módulo de **Extrato Bancário** permite que usuários importem extratos bancários em formato **OFX** ou **CSV** e recebam **sugestões automáticas** de conciliação com movimentações bancárias internas já cadastradas no sistema.

### Benefícios
- ✅ **Automatização**: Reduz trabalho manual de conciliação bancária
- ✅ **Inteligência**: Algoritmo multi-critério com scoring de confiança
- ✅ **Flexibilidade**: Suporta múltiplos formatos e bancos
- ✅ **Auditoria**: Registra todas as operações com rastreabilidade completa
- ✅ **Controle**: Usuário pode aceitar, rejeitar ou ignorar sugestões

---

## Funcionalidades

### 1. Importação de Extratos
- Upload de arquivos OFX ou CSV
- Parse inteligente com detecção automática de colunas (CSV)
- Validação de dados e tratamento de erros
- Limite de 5MB por arquivo

### 2. Matching Automático
- Busca movimentações não conciliadas em janela de ±7 dias
- Cálculo de score de confiança (0-100%)
- Score mínimo de 50% para sugerir match
- Múltiplos critérios: data, valor e descrição

### 3. Gestão de Sugestões
- Aceitar sugestão (marca movimentação como conciliada)
- Rejeitar sugestão (volta item para status pendente)
- Ignorar item (marca como ignorado no sistema)

### 4. Auditoria
- Registro completo de todas as operações
- Rastreamento de usuário, data e detalhes
- Severidade apropriada para cada tipo de evento

---

## Arquitetura

### Entidades

#### ExtratoBancario
```typescript
{
  id: string;                      // UUID
  contaBancaria: ContasBancarias;  // Relacionamento com conta
  dataTransacao: Date;             // Data da transação no extrato
  descricao: string;               // Descrição/histórico
  documento: string;               // Número do documento/cheque
  valor: number;                   // Valor da transação
  tipoTransacao: TipoTransacao;    // 'debito' | 'credito'
  status: StatusExtratoItem;       // Status atual do item
  movimentacaoSugerida?: MovimentacoesBancarias;  // Sugestão de match
  movimentacaoConciliada?: MovimentacoesBancarias; // Match confirmado
  scoreMatch?: number;             // Score de confiança (0-100)
  formatoOrigem: string;           // 'OFX' | 'CSV'
  nomeArquivo: string;             // Nome do arquivo importado
  empresaId: string;               // Empresa relacionada
  importadoPor: string;            // Usuário que importou
}
```

#### Status Possíveis
- **PENDENTE**: Item sem sugestão de conciliação
- **SUGESTAO**: Item com sugestão automática
- **CONCILIADO**: Item conciliado (sugestão aceita)
- **IGNORADO**: Item marcado como ignorado

### Módulos

```
src/extrato-bancario/
├── extrato-bancario.entity.ts       # Entidade principal
├── extrato-bancario.repository.ts   # Repositório customizado
├── extrato-bancario.service.ts      # Lógica de negócio
├── extrato-bancario.controller.ts   # Endpoints REST
├── extrato-bancario.module.ts       # Módulo NestJS
├── matching.service.ts              # Algoritmo de matching
├── parsers/
│   ├── ofx.parser.ts               # Parser de OFX
│   └── csv.parser.ts               # Parser de CSV
└── dto/
    └── importar-extrato.dto.ts     # DTOs e interfaces
```

---

## API Endpoints

### 1. Importar Extrato
**Endpoint**: `POST /extratos-bancarios/importar`
**Content-Type**: `multipart/form-data`
**Autorização**: `Administrador`, `Financeiro`

**Body**:
```typescript
{
  arquivo: File;              // Arquivo OFX ou CSV
  contaBancariaId: string;    // UUID da conta bancária
  formato: 'OFX' | 'CSV';     // Formato do arquivo
}
```

**Response**:
```json
{
  "message": "15 transação(ões) importada(s) com sucesso",
  "statusCode": 201,
  "data": {
    "totalImportado": 15,
    "comSugestao": 12,
    "semSugestao": 3,
    "itens": [
      {
        "id": "uuid",
        "data": "2025-01-15",
        "descricao": "PAGAMENTO FORNECEDOR",
        "valor": 1500.00,
        "tipo": "debito",
        "status": "sugestao",
        "sugestao": {
          "movimentacaoId": "uuid",
          "score": 95,
          "razoes": ["Valor exato", "Data exata", "Descrição 80% similar"],
          "movimentacao": { ... }
        }
      }
    ]
  }
}
```

### 2. Listar Extratos
**Endpoint**: `GET /extratos-bancarios`
**Query Params**: `contaBancariaId` (opcional)

**Response**:
```json
{
  "message": "Extratos encontrados",
  "statusCode": 200,
  "data": [ ... ]
}
```

### 3. Listar Extratos Pendentes
**Endpoint**: `GET /extratos-bancarios/pendentes`
**Query Params**: `contaBancariaId` (obrigatório)

Retorna apenas itens com status `PENDENTE` ou `SUGESTAO`.

### 4. Aceitar Sugestão
**Endpoint**: `POST /extratos-bancarios/:id/aceitar`
**Autorização**: `Administrador`, `Financeiro`

Marca a movimentação como conciliada e atualiza o item do extrato.

### 5. Rejeitar Sugestão
**Endpoint**: `POST /extratos-bancarios/:id/rejeitar`
**Autorização**: `Administrador`, `Financeiro`

Remove a sugestão e volta o item para status `PENDENTE`.

### 6. Ignorar Item
**Endpoint**: `POST /extratos-bancarios/:id/ignorar`
**Autorização**: `Administrador`, `Financeiro`

Marca o item como `IGNORADO`.

---

## Formatos Suportados

### OFX (Open Financial Exchange)

**Biblioteca**: `banking`

**Características**:
- Formato padrão bancário internacional
- Estrutura XML com tags específicas
- Parsing automático de datas, valores e tipos

**Campos Extraídos**:
- `DTPOSTED`: Data da transação
- `TRNAMT`: Valor (negativo = débito, positivo = crédito)
- `MEMO` / `NAME`: Descrição
- `CHECKNUM` / `REFNUM` / `FITID`: Documento de referência

**Exemplo de Transação OFX**:
```xml
<STMTTRN>
  <TRNTYPE>DEBIT</TRNTYPE>
  <DTPOSTED>20250115</DTPOSTED>
  <TRNAMT>-1500.00</TRNAMT>
  <FITID>202501151234</FITID>
  <NAME>FORNECEDOR XYZ LTDA</NAME>
  <MEMO>PAGAMENTO NF 12345</MEMO>
</STMTTRN>
```

### CSV (Comma-Separated Values)

**Biblioteca**: `csv-parse`

**Características**:
- Auto-detecção de colunas em português e inglês
- Suporte a múltiplos formatos de data
- Suporte a valores em formato brasileiro e americano
- Inferência automática de tipo (débito/crédito)

**Colunas Reconhecidas**:
- **Data**: `data`, `date`, `dt`, `datamov`, `data_transacao`
- **Descrição**: `descricao`, `historico`, `memo`, `name`, `descri`
- **Valor**: `valor`, `amount`, `vl`, `value`
- **Tipo** (opcional): `tipo`, `type`, `natureza`
- **Documento** (opcional): `documento`, `doc`, `numero`, `referencia`

**Formatos de Data Suportados**:
- `DD/MM/YYYY` (ex: 15/01/2025)
- `YYYY-MM-DD` (ex: 2025-01-15)
- `YYYYMMDD` (ex: 20250115)

**Formatos de Valor Suportados**:
- Brasileiro: `1.234,56` ou `1234,56`
- Americano: `1,234.56` ou `1234.56`

**Exemplo CSV**:
```csv
data,descricao,valor,tipo
15/01/2025,PAGAMENTO FORNECEDOR,1500.00,Débito
16/01/2025,RECEBIMENTO CLIENTE,2500.50,Crédito
```

---

## Algoritmo de Matching

### Critérios e Pesos

O algoritmo utiliza **3 critérios** com pesos específicos:

| Critério | Peso | Descrição |
|----------|------|-----------|
| Data | 30% | Proximidade entre datas |
| Valor | 40% | Diferença percentual entre valores |
| Descrição | 30% | Similaridade textual |

**Score Total** = (scoreData × 0.3) + (scoreValor × 0.4) + (scoreDescricao × 0.3)

### 1. Score de Data

Avalia a diferença em dias entre a transação do extrato e a movimentação interna:

| Diferença | Score | Feedback |
|-----------|-------|----------|
| 0 dias | 100 | "Data exata" |
| 1 dia | 90 | "Data com 1 dia de diferença" |
| 2 dias | 80 | "Data com 2 dias de diferença" |
| 3 dias | 70 | "Data com 3 dias de diferença" |
| 4-5 dias | 50 | "Data com N dias de diferença" |
| 6-7 dias | 30 | "Data com N dias de diferença" |

**Janela de Busca**: ±7 dias da data da transação

### 2. Score de Valor

Avalia a diferença percentual entre os valores:

| Diferença | Score | Feedback |
|-----------|-------|----------|
| 0% | 100 | "Valor exato" |
| < 0.01% | 95 | "Valor quase exato (diferença < 0.01%)" |
| < 1% | 85 | "Valor muito próximo (diferença < 1%)" |
| < 5% | 60 | "Valor próximo (diferença de X%)" |
| < 10% | 30 | "Valor com diferença de X%" |
| ≥ 10% | 0 | Rejeitado |

**Cálculo**:
```typescript
diferenca = Math.abs(valorTransacao - valorMovimentacao)
percentual = (diferenca / valorTransacao) * 100
```

### 3. Score de Descrição

Avalia a similaridade entre as descrições usando:
- Normalização de texto (remoção de acentos, pontuação, lowercase)
- Comparação de palavras comuns

| Condição | Score | Feedback |
|----------|-------|----------|
| Igualdade exata | 100 | "Descrição idêntica" |
| Uma contém a outra | 80 | "Descrição contém a outra" |
| ≥ 70% palavras comuns | 70 | "Descrição X% similar" |
| ≥ 50% palavras comuns | 50 | "Descrição X% similar" |
| ≥ 30% palavras comuns | 30 | "Descrição X% similar" |
| < 30% palavras comuns | 10 | - |

**Normalização**:
```typescript
texto
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
  .replace(/[^\w\s]/g, '')           // Remove pontuação
  .trim()
```

### 4. Validação de Tipo

Antes de calcular o score, o sistema valida se o tipo da transação é compatível:

- **Débito** (extrato) deve corresponder a **Débito/Saída** (movimentação)
- **Crédito** (extrato) deve corresponder a **Crédito/Entrada** (movimentação)

Se os tipos forem incompatíveis, o score total é **0** e a razão é "Tipo de transação incompatível".

### Score Mínimo

**Threshold**: 50%

Apenas candidatos com score ≥ 50% são considerados como sugestões válidas.

### Seleção da Melhor Sugestão

1. Calcula score para todas as movimentações não conciliadas na janela de ±7 dias
2. Filtra apenas candidatos com score ≥ 50%
3. Ordena por score (maior para menor)
4. Retorna o candidato com **maior score**

---

## Fluxo de Conciliação

### Diagrama de Estados

```
┌──────────────┐
│   IMPORTADO  │
└──────┬───────┘
       │
       ├─── Tem Sugestão (score ≥ 50%) ───> [SUGESTAO]
       │                                           │
       │                                           ├─ Aceitar ──> [CONCILIADO]
       │                                           │
       │                                           └─ Rejeitar ──> [PENDENTE]
       │
       └─── Sem Sugestão (score < 50%) ────> [PENDENTE]
                                                    │
                                                    └─ Ignorar ──> [IGNORADO]
```

### Processo Detalhado

#### 1. Importação
```typescript
POST /extratos-bancarios/importar
```

**Etapas**:
1. Validação da conta bancária
2. Parse do arquivo (OFX ou CSV)
3. Validação das transações
4. Para cada transação:
   - Buscar sugestões de matching
   - Criar item do extrato com status apropriado
   - Associar movimentação sugerida (se houver)
5. Persistir todos os itens
6. Registrar auditoria
7. Retornar resultado consolidado

#### 2. Aceitar Sugestão
```typescript
POST /extratos-bancarios/:id/aceitar
```

**Etapas**:
1. Buscar item do extrato
2. Validar que possui sugestão
3. Validar que não está conciliado
4. Marcar movimentação como conciliada:
   - `conciliado = 'S'`
   - `conciliadoEm = now()`
   - `conciliadoPor = userId`
5. Atualizar item do extrato:
   - `status = CONCILIADO`
   - `movimentacaoConciliada = movimentacao`
6. Registrar auditoria

#### 3. Rejeitar Sugestão
```typescript
POST /extratos-bancarios/:id/rejeitar
```

**Etapas**:
1. Buscar item do extrato
2. Marcar como pendente:
   - `status = PENDENTE`
   - `movimentacaoSugerida = undefined`
   - `scoreMatch = undefined`
3. Registrar auditoria

#### 4. Ignorar Item
```typescript
POST /extratos-bancarios/:id/ignorar
```

**Etapas**:
1. Buscar item do extrato
2. Marcar como ignorado:
   - `status = IGNORADO`
3. Registrar auditoria

---

## Frontend

### Componentes Criados

#### 1. ImportarExtrato.tsx
**Localização**: `src/pages/dashboard/sections/ImportarExtrato.tsx`

**Funcionalidades**:
- Seleção de conta bancária
- Seleção de formato (OFX/CSV)
- Upload de arquivo com drag & drop
- Validação de extensão de arquivo
- Exibição de resultado da importação
- Estatísticas visuais (com sugestão / sem sugestão)
- Barra de progresso visual

**Props**:
```typescript
interface ImportarExtratoProps {
  contasBancarias: Array<{ id: string; descricao: string; banco: string }>;
  onImportSuccess?: (resultado: ResultadoImportacao) => void;
}
```

#### 2. SugestoesConciliacao.tsx
**Localização**: `src/pages/dashboard/sections/SugestoesConciliacao.tsx`

**Funcionalidades**:
- Listagem de extratos pendentes
- Filtro por conta bancária
- Estatísticas (com sugestão / pendentes / total)
- Tabela com todas as transações
- Visualização de score com barra de progresso
- Ações rápidas (aceitar, rejeitar, ignorar)
- Dialog com detalhes completos da transação
- Exibição de razões da sugestão

**Props**:
```typescript
interface SugestoesConciliacaoProps {
  contasBancarias: Array<{ id: string; descricao: string; banco: string }>;
}
```

### Service

**Localização**: `src/services/extrato-bancario.service.ts`

**Métodos**:
```typescript
class ExtratoBancarioService {
  async importar(contaBancariaId: string, formato: FormatoExtrato, arquivo: File): Promise<ResultadoImportacao>
  async findAll(contaBancariaId?: string): Promise<ExtratoBancario[]>
  async findPendentes(contaBancariaId: string): Promise<ExtratoBancario[]>
  async aceitarSugestao(itemId: string): Promise<void>
  async rejeitarSugestao(itemId: string): Promise<void>
  async ignorarItem(itemId: string): Promise<void>
}
```

### Tipos TypeScript

**Localização**: `src/types/api.types.ts`

Enums e interfaces completas para:
- `StatusExtratoItem`
- `TipoTransacao`
- `FormatoExtrato`
- `ExtratoBancario`
- `SugestaoMatch`
- `ImportarExtratoDto`
- `ResultadoImportacao`

---

## Exemplos de Uso

### Exemplo 1: Importar Extrato OFX

**Request**:
```bash
curl -X POST http://localhost:3000/extratos-bancarios/importar \
  -H "Authorization: Bearer {token}" \
  -F "arquivo=@extrato_janeiro.ofx" \
  -F "contaBancariaId=123e4567-e89b-12d3-a456-426614174000" \
  -F "formato=OFX"
```

**Response**:
```json
{
  "message": "25 transação(ões) importada(s) com sucesso",
  "statusCode": 201,
  "data": {
    "totalImportado": 25,
    "comSugestao": 20,
    "semSugestao": 5,
    "itens": [ ... ]
  }
}
```

### Exemplo 2: Aceitar Sugestão

**Request**:
```bash
curl -X POST http://localhost:3000/extratos-bancarios/{itemId}/aceitar \
  -H "Authorization: Bearer {token}"
```

**Response**:
```json
{
  "message": "Conciliação aceita com sucesso",
  "statusCode": 200
}
```

### Exemplo 3: CSV com Auto-detecção

**Arquivo**: `extrato.csv`
```csv
data,historico,valor,natureza
15/01/2025,PAGAMENTO FORNECEDOR ABC,1.500,00,Débito
16/01/2025,RECEBIMENTO CLIENTE XYZ,3.250,75,Crédito
17/01/2025,TAXA BANCARIA,15,90,Débito
```

O parser detecta automaticamente:
- Coluna `data` → Data da transação
- Coluna `historico` → Descrição
- Coluna `valor` → Valor (formato brasileiro)
- Coluna `natureza` → Tipo

### Exemplo 4: Sugestão com Score Alto

```json
{
  "id": "uuid",
  "dataTransacao": "2025-01-15",
  "descricao": "PAGAMENTO FORNECEDOR ABC LTDA",
  "valor": 1500.00,
  "tipoTransacao": "debito",
  "status": "sugestao",
  "scoreMatch": 95.0,
  "sugestao": {
    "movimentacaoId": "uuid",
    "score": 95,
    "razoes": [
      "Valor exato",
      "Data exata",
      "Descrição 85% similar"
    ],
    "movimentacao": {
      "id": "uuid",
      "data": "2025-01-15",
      "descricao": "PAGAMENTO FORNECEDOR ABC",
      "valor": 1500.00,
      "tipo": "Saída"
    }
  }
}
```

**Análise**:
- Score Data: 100 (data exata)
- Score Valor: 100 (valor exato)
- Score Descrição: 85 (85% similar)
- **Score Total**: (100 × 0.3) + (100 × 0.4) + (85 × 0.3) = **95.5%**

---

## Banco de Dados

### Tabela: extratos_bancarios

```sql
CREATE TABLE "extratos_bancarios" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conta_bancaria_id" uuid NOT NULL,
  "data_transacao" date NOT NULL,
  "descricao" varchar(500) NOT NULL,
  "documento" varchar(255),
  "valor" decimal(15,2) NOT NULL,
  "tipo_transacao" varchar(20) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pendente',
  "movimentacao_sugerida_id" uuid,
  "movimentacao_conciliada_id" uuid,
  "score_match" decimal(5,2),
  "observacao" text,
  "formato_origem" varchar(50) NOT NULL,
  "nome_arquivo" varchar(100) NOT NULL,
  "empresa_id" uuid,
  "importado_por" uuid,
  "criado_em" timestamptz NOT NULL DEFAULT now(),
  "atualizado_em" timestamptz NOT NULL DEFAULT now(),
  "deletado_em" timestamptz,

  CONSTRAINT "fk_extrato_conta_bancaria"
    FOREIGN KEY ("conta_bancaria_id")
    REFERENCES "contas_bancarias"("id") ON DELETE CASCADE,

  CONSTRAINT "fk_extrato_movimentacao_sugerida"
    FOREIGN KEY ("movimentacao_sugerida_id")
    REFERENCES "movimentacoes_bancarias"("id") ON DELETE SET NULL,

  CONSTRAINT "fk_extrato_movimentacao_conciliada"
    FOREIGN KEY ("movimentacao_conciliada_id")
    REFERENCES "movimentacoes_bancarias"("id") ON DELETE SET NULL
);

CREATE INDEX "idx_extrato_conta_data"
  ON "extratos_bancarios"("conta_bancaria_id", "data_transacao");

CREATE INDEX "idx_extrato_status"
  ON "extratos_bancarios"("status");
```

### Índices

- **idx_extrato_conta_data**: Composto (conta + data) para queries de listagem
- **idx_extrato_status**: Simples para filtros por status

---

## Testes

### Execução
```bash
npm test
```

### Cobertura
- ✅ 269 testes passando
- ✅ 17 suites de teste
- ✅ Cobertura completa de serviços, controllers e parsers

---

## Segurança

### Autenticação e Autorização
- Todos os endpoints requerem autenticação JWT
- Operações de importação e conciliação restritas aos perfis:
  - `Administrador`
  - `Financeiro`

### Validações
- Tamanho máximo de arquivo: 5MB
- Validação de formato de arquivo
- Validação de conta bancária existente
- Validação de empresa associada

### Auditoria
Todos os eventos são registrados com:
- Tipo de evento (`AuditEventType.MOVIMENTACAO_BANCARIA_*`)
- Severidade (`INFO`, `WARNING`, `ERROR`)
- Usuário responsável
- Empresa relacionada
- Detalhes completos da operação

---

## Melhorias Futuras

### Curto Prazo
- [ ] Conciliação manual (usuário escolhe movimentação)
- [ ] Exportação de extratos conciliados
- [ ] Filtros avançados na listagem

### Médio Prazo
- [ ] Machine Learning para melhorar matching
- [ ] Suporte a mais formatos (XLSX, QIF)
- [ ] Conciliação em lote
- [ ] Dashboard com métricas

### Longo Prazo
- [ ] Integração direta com APIs bancárias
- [ ] Regras customizáveis de matching por empresa
- [ ] Análise preditiva de fluxo de caixa

---

## Suporte

Para dúvidas ou problemas, consulte:
- [Documentação do NestJS](https://docs.nestjs.com/)
- [Documentação do MikroORM](https://mikro-orm.io/docs)
- [Banking Library](https://www.npmjs.com/package/banking)
- [CSV Parse](https://csv.js.org/parse/)

---

**Versão**: 1.0.0
**Data**: Janeiro 2025
**Autor**: Sistema Financeiro API
