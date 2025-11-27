# 🔐 Criptografia de Dados Sensíveis - Guia Completo

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Como Usar nas Entidades](#como-usar-nas-entidades)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Rotação de Chaves](#rotação-de-chaves)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## 🎯 Visão Geral

### O Que É Criptografado?

A aplicação implementa **criptografia AES-256-GCM** para proteger dados sensíveis:

| Tipo de Dado | Algoritmo | Chave | Status |
|--------------|-----------|-------|--------|
| **Dados Bancários** | AES-256-GCM | ENCRYPTION_KEY | ✅ Implementado |
| **Valores Financeiros** | AES-256-GCM | ENCRYPTION_KEY | ✅ Implementado |
| **Senhas de Usuário** | bcrypt | Salt único | ✅ Implementado |

### Por Que AES-256-GCM?

- **AES-256**: Padrão aprovado pelo NIST para dados Top Secret do governo dos EUA
- **GCM Mode**: Galois/Counter Mode - fornece autenticação e criptografia
- **Integridade**: Detecta se os dados foram modificados (tampering)
- **Segurança**: Chave de 256 bits (2^256 combinações possíveis)

---

## 🏗️ Arquitetura

### Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    Aplicação NestJS                      │
├─────────────────────────────────────────────────────────┤
│  Entidade                                                │
│  ┌──────────────────────────────────────────┐           │
│  │ @Property({ type: EncryptedStringType }) │           │
│  │ conta: string;                           │           │
│  └──────────────────────────────────────────┘           │
│                      ↓                                   │
│  MikroORM Transformer                                    │
│  ┌──────────────────────────────────────────┐           │
│  │ EncryptedStringType                      │           │
│  │ - convertToDatabaseValue()               │           │
│  │ - convertToJSValue()                     │           │
│  └──────────────────────────────────────────┘           │
│                      ↓                                   │
│  EncryptionService                                       │
│  ┌──────────────────────────────────────────┐           │
│  │ encrypt() / decrypt()                    │           │
│  │ Algorithm: AES-256-GCM                   │           │
│  └──────────────────────────────────────────┘           │
├─────────────────────────────────────────────────────────┤
│                 Banco de Dados PostgreSQL                │
│  ┌──────────────────────────────────────────┐           │
│  │ conta: TEXT                              │           │
│  │ "iv:encrypted:authTag" (base64)          │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

**SAVE (Aplicação → Banco)**:
```
Plain Text → Transformer → EncryptionService → Encrypted Text → PostgreSQL
"12345678"                                     "a1b2c3:enc:tag"
```

**LOAD (Banco → Aplicação)**:
```
PostgreSQL → Encrypted Text → EncryptionService → Transformer → Plain Text
             "a1b2c3:enc:tag"                                   "12345678"
```

---

## 📝 Como Usar nas Entidades

### 1. Importar Transformers

```typescript
import { EncryptedStringType, EncryptedDecimalType } from 'src/common/encryption';
```

### 2. Aplicar nos Campos

#### Campos de Texto (String)

```typescript
@Entity()
export class ContasBancarias {
  // ❌ ANTES (Plain Text)
  @Property({ type: 'varchar', length: 50 })
  conta: string;

  // ✅ DEPOIS (Criptografado)
  @Property({ type: EncryptedStringType })
  conta: string;
}
```

#### Campos Numéricos (Number)

```typescript
@Entity()
export class ContasBancarias {
  // ❌ ANTES (Plain Text)
  @Property({ type: 'decimal', precision: 15, scale: 2 })
  saldo_atual: number;

  // ✅ DEPOIS (Criptografado)
  @Property({ type: EncryptedDecimalType })
  saldo_atual: number;
}
```

### 3. Usar Normalmente no Código

**O código da aplicação NÃO muda!** A criptografia é transparente:

```typescript
// Criar conta bancária
const conta = new ContasBancarias();
conta.conta = '12345678'; // ✅ Plain text no código
conta.saldo_atual = 50000.00; // ✅ Number normal
await em.persistAndFlush(conta);

// Carregar conta bancária
const contaCarregada = await em.findOne(ContasBancarias, { id: 'abc' });
console.log(contaCarregada.conta); // ✅ "12345678" (descriptografado automaticamente)
console.log(contaCarregada.saldo_atual); // ✅ 50000 (descriptografado automaticamente)
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Contas Bancárias

**Arquivo**: `src/entities/conta-bancaria/conta-bancaria.entity.ts`

```typescript
import { Entity, Property } from '@mikro-orm/core';
import { EncryptedStringType, EncryptedDecimalType } from 'src/common/encryption';

@Entity()
export class ContasBancarias {
  @PrimaryKey()
  id: string;

  // Dados bancários criptografados
  @Property({ type: EncryptedStringType })
  banco: string; // Criptografado

  @Property({ type: EncryptedStringType })
  agencia: string; // Criptografado

  @Property({ type: EncryptedStringType })
  conta: string; // Criptografado

  @Property({ type: EncryptedStringType, nullable: true })
  conta_digito?: string; // Criptografado

  // Valores criptografados
  @Property({ type: EncryptedDecimalType })
  saldo_inicial: number; // Criptografado

  @Property({ type: EncryptedDecimalType })
  saldo_atual: number; // Criptografado

  // Campos não sensíveis (plain text)
  @Property()
  descricao: string; // NÃO criptografado

  @Property()
  ativo: boolean; // NÃO criptografado
}
```

### Exemplo 2: Movimentações Bancárias

**Arquivo**: `src/entities/movimentacao-bancaria/movimentacao-bancaria.entity.ts`

```typescript
import { Entity, Property } from '@mikro-orm/core';
import { EncryptedDecimalType } from 'src/common/encryption';

@Entity()
export class MovimentacoesBancarias {
  @PrimaryKey()
  id: string;

  // Valor criptografado
  @Property({ type: EncryptedDecimalType })
  valor: number; // Criptografado

  // Campos não sensíveis
  @Property()
  dataMovimento: Date; // NÃO criptografado

  @Property()
  descricao: string; // NÃO criptografado (considere criptografar se contém dados sensíveis)

  @Property()
  tipoMovimento: TipoMovimento; // NÃO criptografado
}
```

### Exemplo 3: Contas a Pagar/Receber

```typescript
import { Entity, Property } from '@mikro-orm/core';
import { EncryptedDecimalType } from 'src/common/encryption';

@Entity()
export class ContasPagar {
  @PrimaryKey()
  id: string;

  // Valores criptografados
  @Property({ type: EncryptedDecimalType })
  valor_principal: number; // Criptografado

  @Property({ type: EncryptedDecimalType })
  acrescimos: number; // Criptografado

  @Property({ type: EncryptedDecimalType })
  descontos: number; // Criptografado

  @Property({ type: EncryptedDecimalType })
  valor_total: number; // Criptografado

  @Property({ type: EncryptedDecimalType })
  saldo: number; // Criptografado

  // Campos não sensíveis
  @Property()
  documento: string; // NÃO criptografado (considere criptografar)

  @Property()
  vencimento: Date; // NÃO criptografado
}
```

---

## 🔄 Rotação de Chaves

### Por Que Rotacionar Chaves?

- **Conformidade**: Muitas regulamentações exigem rotação periódica
- **Segurança**: Limita o impacto de uma chave comprometida
- **Boas Práticas**: Recomendado rotacionar a cada 90-180 dias em produção

### Como Rotacionar

#### 1. Gerar Nova Chave

```bash
# Gerar nova chave de criptografia
openssl rand -hex 32
# Resultado: abc123def456...
```

#### 2. Adicionar Nova Chave ao .env

```bash
# .env
ENCRYPTION_KEY_OLD=8213d2398282ad12f82f764fcefe2694f3967c2a1d43bccc0816e04fe9b92fc4
ENCRYPTION_KEY=abc123def456... # Nova chave
```

#### 3. Criar Script de Re-criptografia

```typescript
// scripts/rotate-encryption-key.ts
import { EncryptionService } from '../src/common/encryption/encryption.service';

async function rotateKey() {
  const oldService = new EncryptionService(oldKey);
  const newService = new EncryptionService(newKey);

  // Buscar todos os registros
  const contas = await em.find(ContasBancarias, {});

  for (const conta of contas) {
    // Descriptografar com chave antiga
    const contaPlain = oldService.decrypt(conta.conta);

    // Re-criptografar com chave nova
    conta.conta = newService.encrypt(contaPlain);
  }

  await em.flush();
  console.log('✅ Rotação de chaves concluída');
}
```

#### 4. Remover Chave Antiga

Após confirmar que todos os dados foram re-criptografados:

```bash
# Remover ENCRYPTION_KEY_OLD do .env
```

---

## 🔍 Troubleshooting

### Erro: "ENCRYPTION_KEY é obrigatória"

**Causa**: Variável `ENCRYPTION_KEY` não está configurada no `.env`

**Solução**:
```bash
# 1. Gerar chave
openssl rand -hex 32

# 2. Adicionar ao .env
echo "ENCRYPTION_KEY=sua_chave_aqui" >> .env

# 3. Reiniciar aplicação
npm run start:dev
```

### Erro: "ENCRYPTION_KEY deve ter exatamente 64 caracteres"

**Causa**: Chave não tem o tamanho correto (32 bytes = 64 caracteres hex)

**Solução**:
```bash
# Gerar chave com tamanho correto
openssl rand -hex 32  # Sempre gera 64 caracteres hex
```

### Erro: "Falha na descriptografia - dados corrompidos ou chave inválida"

**Causa**: Tentou descriptografar dados com chave diferente da usada na criptografia

**Possíveis Soluções**:
1. **Chave errada**: Verificar se está usando a chave correta
2. **Rotação de chave**: Se trocou a chave, precisa re-criptografar dados antigos
3. **Dados corrompidos**: Restaurar backup do banco de dados

### Performance Lenta

**Causa**: Criptografia/descriptografia em queries com muitos registros

**Solução**:
```typescript
// ❌ Evitar queries que retornam muitos registros
const todasContas = await em.find(ContasBancarias, {}); // Descriptografa TODAS

// ✅ Usar paginação
const contas = await em.find(ContasBancarias, {}, { limit: 50, offset: 0 });

// ✅ Usar índices para filtros
const conta = await em.findOne(ContasBancarias, { id: 'abc' }); // Rápido
```

---

## ❓ FAQ

### 1. Posso pesquisar por campos criptografados?

**Não diretamente**. Dados criptografados não podem ser pesquisados com queries SQL normais.

**Alternativas**:
```typescript
// ❌ NÃO FUNCIONA
const contas = await em.find(ContasBancarias, { conta: '12345678' });

// ✅ FUNCIONA - Buscar por ID ou campo não criptografado
const conta = await em.findOne(ContasBancarias, { id: 'abc' });

// ✅ FUNCIONA - Buscar todos e filtrar em memória
const todasContas = await em.find(ContasBancarias, {});
const contaEncontrada = todasContas.find(c => c.conta === '12345678');
```

**Para queries de busca**, considere:
1. Manter hash do valor para pesquisa (searchable encryption)
2. Usar índices parciais em campos não criptografados
3. Implementar índice invertido criptografado

### 2. Posso ordenar por campos criptografados?

**Não**. ORDER BY não funciona com campos criptografados.

**Solução**: Ordenar em memória:
```typescript
const contas = await em.find(ContasBancarias, {});
contas.sort((a, b) => a.saldo_atual - b.saldo_atual); // Ordenar em JS
```

### 3. Como fazer backup dos dados?

**Cuidado**: Backup contém dados criptografados. **Você precisa da chave para restaurar!**

```bash
# Backup do banco
pg_dump meu_banco > backup.sql

# IMPORTANTE: Fazer backup da chave também!
# Armazenar em local seguro e separado
echo "ENCRYPTION_KEY=..." > encryption-key-backup.txt
```

### 4. E se eu perder a chave?

**⚠️ Dados são IRRECUPERÁVEIS sem a chave!**

**Prevenção**:
1. ✅ Backup da chave em local seguro (Vault, Secrets Manager)
2. ✅ Múltiplas cópias em locais diferentes
3. ✅ Documentar onde a chave está armazenada
4. ✅ Testar recuperação regularmente

### 5. Preciso criptografar TODOS os campos?

**Não**. Apenas dados sensíveis:

| Campo | Criptografar? | Motivo |
|-------|---------------|--------|
| Número da conta | ✅ SIM | Dado sensível |
| Saldo | ✅ SIM | Informação confidencial |
| Valor de transação | ✅ SIM | Informação financeira |
| Descrição | 🟡 OPCIONAL | Pode conter dados sensíveis |
| Data | ❌ NÃO | Metadado, não sensível |
| Status | ❌ NÃO | Enum, não sensível |
| ID | ❌ NÃO | Referência, não sensível |

### 6. Como validar se a criptografia está funcionando?

**Consultar o banco diretamente**:
```sql
-- Verificar formato dos dados criptografados
SELECT id, conta FROM contas_bancarias LIMIT 1;

-- ✅ Criptografado (formato correto):
-- conta: "R3FwZXJ0eQ==:encrypted_data_here:auth_tag_here"

-- ❌ Plain Text (não criptografado):
-- conta: "12345678"
```

**Via aplicação**:
```typescript
// Buscar registro
const conta = await em.findOne(ContasBancarias, { id: 'abc' });

// Verificar valor descriptografado
console.log(conta.conta); // "12345678" (plain text na aplicação)

// Verificar valor no banco
const raw = await em.getConnection().execute(
  'SELECT conta FROM contas_bancarias WHERE id = $1',
  ['abc']
);
console.log(raw[0].conta); // "iv:encrypted:tag" (criptografado no banco)
```

---

## 🔐 Checklist de Segurança

Antes de ir para produção:

- [ ] ENCRYPTION_KEY gerada com `openssl rand -hex 32`
- [ ] ENCRYPTION_KEY armazenada em Secrets Manager (não no .env)
- [ ] ENCRYPTION_KEY com backup em local seguro
- [ ] Todos os campos sensíveis usando transformers criptografados
- [ ] Testes de criptografia passando
- [ ] Validado que dados no banco estão criptografados (via SQL direto)
- [ ] Documentado onde as chaves estão armazenadas
- [ ] Plano de rotação de chaves definido
- [ ] Procedimento de recuperação de desastres testado

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte este documento
2. Verifique logs da aplicação
3. Consulte `docs/SECURITY.md`
4. Abra issue no repositório

---

**Versão**: 1.0.0
**Última Atualização**: 2025-01-25
**Algoritmo**: AES-256-GCM
