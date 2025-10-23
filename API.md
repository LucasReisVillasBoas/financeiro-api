# Documentação da API - Sistema Financeiro

## Base URL

```
http://localhost:{PORT}
```

## Autenticação

A maioria dos endpoints requer autenticação via JWT Bearer Token.

**Header obrigatório:**

```
Authorization: Bearer {token}
```

---

## Endpoints

### 1. Autenticação

#### 1.1. Login

**POST** `/auth/login`

Realiza o login do usuário e retorna um token JWT.

**Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**

```json
{
  "token": "string"
}
```

---

### 2. Usuários

#### 2.1. Criar Usuário

**POST** `/usuario/cadastro`

Cria um novo usuário no sistema.

**Body:**

```json
{
  "email": "string",
  "login": "string",
  "senha": "string",
  "nome": "string",
  "telefone": "string",
  "cargo": "string",
  "ativo": true,
  "cidade": {}, // Objeto Cidade (opcional)
  "contatos": [] // Array de strings com IDs de contatos (opcional)
}
```

**Response (201):**

```json
{
  "message": "Usuário criado",
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "nome": "string",
    "cargo": "string",
    "email": "abc****@domain.com", // Email mascarado
    "telefone": "******1234", // Telefone mascarado
    "ativo": true,
    "empresasFiliais": [{ "id": "uuid" }],
    "cidade": "uuid",
    "usuarioContatos": [{ "id": "uuid" }],
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Observações:**

- Os campos `login` e `senha` não são retornados por segurança
- Email e telefone são mascarados na resposta

**Permissões:** Não requer autenticação

---

#### 2.2. Buscar Usuário

**GET** `/usuario`

Retorna os dados do usuário autenticado.

**Response (200):**

```json
{
  "message": "Usuário encontrado com sucesso",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "nome": "string",
    "cargo": "string",
    "email": "abc****@domain.com",
    "telefone": "******1234",
    "ativo": true,
    "empresasFiliais": [{ "id": "uuid" }],
    "cidade": "uuid",
    "usuarioContatos": [{ "id": "uuid" }],
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 2.3. Atualizar Usuário

**PATCH** `/usuario/:id`

Atualiza os dados de um usuário.

**Parâmetros:**

- `id` (path): UUID do usuário

**Body (todos os campos opcionais):**

```json
{
  "email": "string",
  "login": "string",
  "senha": "string",
  "nome": "string",
  "telefone": "string",
  "cargo": "string",
  "ativo": true,
  "cidadeId": "string (UUID)",
  "contatoIds": ["string (UUID)"]
}
```

**Response (200):**

```json
{
  "message": "Usuário atualizado",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "nome": "string",
    "cargo": "string",
    "email": "abc****@domain.com",
    "telefone": "******1234",
    "ativo": true,
    "empresasFiliais": [{ "id": "uuid" }],
    "cidade": "uuid",
    "usuarioContatos": [{ "id": "uuid" }],
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissões:** Administrador

---

#### 2.4. Associar Empresa/Filial ao Usuário

**POST** `/usuario/:id/empresas`

Associa uma empresa ou filial a um usuário.

**Parâmetros:**

- `id` (path): UUID do usuário

**Body:**

```json
{
  "empresaId": "string (UUID)"
}
```

**Response (200):**

```json
{
  "message": "Associação feita com sucesso!",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "usuario": {
      "id": "uuid",
      "nome": "string",
      "email": "string"
    },
    "empresa": {
      "id": "uuid",
      "razao_social": "string",
      "nome_fantasia": "string"
    },
    "filial": false,
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissões:** Administrador

---

#### 2.5. Listar Associações de Empresa do Usuário

**GET** `/usuario/:id/empresas`

Lista todas as associações de empresas/filiais de um usuário.

**Parâmetros:**

- `id` (path): UUID do usuário

**Response (200):**

```json
{
  "message": "Associações listadas com sucesso!",
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "usuario": {
        "id": "uuid",
        "nome": "string"
      },
      "empresa": {
        "id": "uuid",
        "razao_social": "string"
      },
      "filial": false,
      "criadoEm": "2025-01-01T00:00:00.000Z",
      "atualizadoEm": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 2.6. Remover Associação de Empresa

**DELETE** `/usuario/:id/empresas/:assocId`

Remove uma associação entre usuário e empresa/filial.

**Parâmetros:**

- `id` (path): UUID do usuário
- `assocId` (path): UUID da associação

**Response (200):**

```json
{
  "message": "Associação removida com sucesso!",
  "statusCode": 200
}
```

**Permissões:** Administrador

---

### 3. Empresas

#### 3.1. Criar Empresa

**POST** `/empresas`

Cria uma nova empresa.

**Body:**

```json
{
  "cliente_id": "string (UUID)",
  "razao_social": "string",
  "nome_fantasia": "string",
  "cnpj_cpf": "string",
  "inscricao_estadual": "string (opcional)",
  "inscricao_municipal": "string (opcional)",
  "cep": "string (opcional)",
  "logradouro": "string (opcional)",
  "numero": "string (opcional)",
  "bairro": "string (opcional)",
  "complemento": "string (opcional)",
  "cidade": "string (opcional)",
  "codigo_ibge": "string (opcional)",
  "uf": "string (opcional)",
  "telefone": "string (opcional)",
  "celular": "string (opcional)",
  "email": "string (opcional)",
  "data_abertura": "date (opcional)"
}
```

**Response (201):**

```json
{
  "message": "Empresa criada",
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "sede": null,
    "cliente_id": "uuid",
    "razao_social": "Empresa LTDA",
    "nome_fantasia": "Nome Fantasia",
    "cnpj_cpf": "12.345.678/0001-90",
    "inscricao_estadual": "123456789",
    "inscricao_municipal": "123456",
    "cep": "12345-678",
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "bairro": "Centro",
    "complemento": "Sala 1",
    "cidade": "São Paulo",
    "codigo_ibge": "3550308",
    "uf": "SP",
    "telefone": "******1234",
    "celular": "******5678",
    "email": "emp****@empresa.com",
    "data_abertura": "2020-01-01T00:00:00.000Z",
    "data_inclusao": "2025-01-01T00:00:00.000Z",
    "ativo": true,
    "deletadoEm": null,
    "cidades": []
  }
}
```

**Observações:**

- Email, telefone e celular são mascarados na resposta

**Permissões:** Não especificado (público)

---

#### 3.2. Listar Empresas por Cliente

**GET** `/empresas/cliente/:clienteId`

Lista todas as empresas de um cliente específico.

**Parâmetros:**

- `clienteId` (path): UUID do cliente

**Response (200):**

```json
{
  "message": "Empresas encontradas",
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "sede": null,
      "cliente_id": "uuid",
      "razao_social": "Empresa LTDA",
      "nome_fantasia": "Nome Fantasia",
      "cnpj_cpf": "12.345.678/0001-90",
      "inscricao_estadual": "123456789",
      "inscricao_municipal": "123456",
      "cep": "12345-678",
      "logradouro": "Rua Exemplo",
      "numero": "123",
      "bairro": "Centro",
      "complemento": "Sala 1",
      "cidade": "São Paulo",
      "codigo_ibge": "3550308",
      "uf": "SP",
      "telefone": "******1234",
      "celular": "******5678",
      "email": "emp****@empresa.com",
      "data_abertura": "2020-01-01T00:00:00.000Z",
      "data_inclusao": "2025-01-01T00:00:00.000Z",
      "ativo": true,
      "deletadoEm": null,
      "cidades": []
    }
  ]
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 3.3. Buscar Empresa por ID

**GET** `/empresas/:id`

Retorna os dados de uma empresa específica.

**Parâmetros:**

- `id` (path): UUID da empresa

**Response (200):**

```json
{
  "message": "Empresa encontrada",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "sede": null,
    "cliente_id": "uuid",
    "razao_social": "Empresa LTDA",
    "nome_fantasia": "Nome Fantasia",
    "cnpj_cpf": "12.345.678/0001-90",
    "inscricao_estadual": "123456789",
    "inscricao_municipal": "123456",
    "cep": "12345-678",
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "bairro": "Centro",
    "complemento": "Sala 1",
    "cidade": "São Paulo",
    "codigo_ibge": "3550308",
    "uf": "SP",
    "telefone": "******1234",
    "celular": "******5678",
    "email": "emp****@empresa.com",
    "data_abertura": "2020-01-01T00:00:00.000Z",
    "data_inclusao": "2025-01-01T00:00:00.000Z",
    "ativo": true,
    "deletadoEm": null,
    "cidades": []
  }
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 3.4. Atualizar Empresa

**PUT** `/empresas/:id`

Atualiza os dados de uma empresa.

**Parâmetros:**

- `id` (path): UUID da empresa

**Body (mesma estrutura do criar empresa, todos os campos opcionais):**

```json
{
  "razao_social": "string",
  "nome_fantasia": "string"
  // ... outros campos opcionais
}
```

**Response (200):**

```json
{
  "message": "Empresa atualizada",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "sede": null,
    "cliente_id": "uuid",
    "razao_social": "Empresa LTDA",
    "nome_fantasia": "Nome Fantasia",
    "cnpj_cpf": "12.345.678/0001-90",
    "inscricao_estadual": "123456789",
    "inscricao_municipal": "123456",
    "cep": "12345-678",
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "bairro": "Centro",
    "complemento": "Sala 1",
    "cidade": "São Paulo",
    "codigo_ibge": "3550308",
    "uf": "SP",
    "telefone": "******1234",
    "celular": "******5678",
    "email": "emp****@empresa.com",
    "data_abertura": "2020-01-01T00:00:00.000Z",
    "data_inclusao": "2025-01-01T00:00:00.000Z",
    "ativo": true,
    "deletadoEm": null,
    "cidades": []
  }
}
```

**Permissões:** Administrador, Editor

---

#### 3.5. Remover Empresa (Soft Delete)

**DELETE** `/empresas/:id`

Remove uma empresa (soft delete).

**Parâmetros:**

- `id` (path): UUID da empresa

**Response (200):**

```json
{
  "message": "Empresa deletada",
  "statusCode": 200
}
```

**Permissões:** Administrador

---

#### 3.6. Criar Filial

**POST** `/empresas/:id/filiais`

Cria uma filial para uma empresa.

**Parâmetros:**

- `id` (path): UUID da empresa sede

**Body:**

```json
{
  "empresa_id": "string (UUID)",
  "cliente_id": "string (UUID)",
  "razao_social": "string",
  "nome_fantasia": "string",
  "cnpj_cpf": "string",
  "inscricao_estadual": "string (opcional)",
  "inscricao_municipal": "string (opcional)",
  "cep": "string (opcional)",
  "logradouro": "string (opcional)",
  "numero": "string (opcional)",
  "bairro": "string (opcional)",
  "complemento": "string (opcional)",
  "cidade": "string (opcional)",
  "codigo_ibge": "string (opcional)",
  "uf": "string (opcional)",
  "telefone": "string (opcional)",
  "celular": "string (opcional)",
  "email": "string (opcional)",
  "data_abertura": "date (opcional)"
}
```

**Response (201):**

```json
{
  "message": "Filial criada",
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "sede": {
      "id": "uuid",
      "razao_social": "Empresa Sede LTDA"
    },
    "cliente_id": "uuid",
    "razao_social": "Filial LTDA",
    "nome_fantasia": "Filial Nome",
    "cnpj_cpf": "12.345.678/0002-90",
    "inscricao_estadual": "987654321",
    "inscricao_municipal": "654321",
    "cep": "98765-432",
    "logradouro": "Av Filial",
    "numero": "456",
    "bairro": "Bairro Novo",
    "complemento": "Loja 2",
    "cidade": "Rio de Janeiro",
    "codigo_ibge": "3304557",
    "uf": "RJ",
    "telefone": "******9999",
    "celular": "******8888",
    "email": "fil****@filial.com",
    "data_abertura": "2021-01-01T00:00:00.000Z",
    "data_inclusao": "2025-01-01T00:00:00.000Z",
    "ativo": true,
    "deletadoEm": null,
    "cidades": []
  }
}
```

**Permissões:** Administrador

---

#### 3.7. Listar Filiais

**GET** `/empresas/:id/filiais`

Lista todas as filiais de uma empresa.

**Parâmetros:**

- `id` (path): UUID da empresa sede

**Response (200):**

```json
{
  "message": "Filiais encontradas",
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "sede": {
        "id": "uuid",
        "razao_social": "Empresa Sede LTDA"
      },
      "cliente_id": "uuid",
      "razao_social": "Filial LTDA",
      "nome_fantasia": "Filial Nome",
      "cnpj_cpf": "12.345.678/0002-90",
      "inscricao_estadual": "987654321",
      "inscricao_municipal": "654321",
      "cep": "98765-432",
      "logradouro": "Av Filial",
      "numero": "456",
      "bairro": "Bairro Novo",
      "complemento": "Loja 2",
      "cidade": "Rio de Janeiro",
      "codigo_ibge": "3304557",
      "uf": "RJ",
      "telefone": "******9999",
      "celular": "******8888",
      "email": "fil****@filial.com",
      "data_abertura": "2021-01-01T00:00:00.000Z",
      "data_inclusao": "2025-01-01T00:00:00.000Z",
      "ativo": true,
      "deletadoEm": null,
      "cidades": []
    }
  ]
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 3.8. Atualizar Filial

**PUT** `/empresas/filiais/:filialId`

Atualiza os dados de uma filial.

**Parâmetros:**

- `filialId` (path): UUID da filial

**Body (todos os campos opcionais):**

```json
{
  "razao_social": "string",
  "nome_fantasia": "string",
  "cnpj_cpf": "string",
  "inscricao_estadual": "string",
  "inscricao_municipal": "string",
  "cep": "string",
  "logradouro": "string",
  "numero": "string",
  "bairro": "string",
  "complemento": "string",
  "cidade": "string",
  "codigo_ibge": "string",
  "uf": "string",
  "telefone": "string",
  "celular": "string",
  "email": "string",
  "data_abertura": "date"
}
```

**Response (200):**

```json
{
  "message": "Filial atualizada",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "sede": {
      "id": "uuid",
      "razao_social": "Empresa Sede LTDA"
    },
    "cliente_id": "uuid",
    "razao_social": "Filial LTDA Atualizada",
    "nome_fantasia": "Filial Nome Atualizado",
    "cnpj_cpf": "12.345.678/0002-90",
    "inscricao_estadual": "987654321",
    "inscricao_municipal": "654321",
    "cep": "98765-432",
    "logradouro": "Av Filial",
    "numero": "456",
    "bairro": "Bairro Novo",
    "complemento": "Loja 2",
    "cidade": "Rio de Janeiro",
    "codigo_ibge": "3304557",
    "uf": "RJ",
    "telefone": "******9999",
    "celular": "******8888",
    "email": "fil****@filial.com",
    "data_abertura": "2021-01-01T00:00:00.000Z",
    "data_inclusao": "2025-01-01T00:00:00.000Z",
    "ativo": true,
    "deletadoEm": null,
    "cidades": []
  }
}
```

**Permissões:** Administrador, Editor

---

#### 3.9. Remover Filial (Soft Delete)

**DELETE** `/empresas/filiais/:filialId`

Remove uma filial (soft delete).

**Parâmetros:**

- `filialId` (path): UUID da filial

**Response (200):**

```json
{
  "message": "Filial deletada",
  "statusCode": 200
}
```

**Permissões:** Administrador

---

### 4. Cidades

#### 4.1. Criar Cidade

**POST** `/cidades`

Cria uma nova cidade.

**Body:**

```json
{
  "clienteId": "string (UUID) - opcional",
  "filialId": "string (UUID) - opcional",
  "nome": "string (1-255 caracteres)",
  "codigoIbge": "string (7 caracteres)",
  "uf": "string (2 caracteres - sigla do estado)",
  "pais": "string (1-100 caracteres) - opcional, padrão: Brasil",
  "codigoBacen": "string (1-10 dígitos numéricos) - opcional"
}
```

**Response (201):**

```json
{
  "message": "Cidade criada",
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "filialId": "uuid",
    "nome": "São Paulo",
    "codigoIbge": "3550308",
    "uf": "SP",
    "pais": "Brasil",
    "codigoBacen": "1058",
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissões:** Administrador, Editor

---

#### 4.2. Listar Todas as Cidades

**GET** `/cidades`

Lista todas as cidades do cliente autenticado.

**Response (200):**

```json
{
  "message": "Cidades encontradas",
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "clienteId": "uuid",
      "filialId": "uuid",
      "nome": "São Paulo",
      "codigoIbge": "3550308",
      "uf": "SP",
      "pais": "Brasil",
      "codigoBacen": "1058",
      "criadoEm": "2025-01-01T00:00:00.000Z",
      "atualizadoEm": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 4.3. Buscar Cidades por UF

**GET** `/cidades/uf/:uf`

Lista cidades de uma UF específica.

**Parâmetros:**

- `uf` (path): Sigla do estado (ex: SP, RJ)

**Response (200):**

```json
{
  "message": "Cidades encontradas",
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "clienteId": "uuid",
      "filialId": "uuid",
      "nome": "São Paulo",
      "codigoIbge": "3550308",
      "uf": "SP",
      "pais": "Brasil",
      "codigoBacen": "1058",
      "criadoEm": "2025-01-01T00:00:00.000Z",
      "atualizadoEm": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 4.4. Buscar Cidade por Código IBGE

**GET** `/cidades/ibge/:codigoIbge`

Busca uma cidade pelo código IBGE.

**Parâmetros:**

- `codigoIbge` (path): Código IBGE de 7 dígitos

**Response (200):**

```json
{
  "message": "Cidade encontrada",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "filialId": "uuid",
    "nome": "São Paulo",
    "codigoIbge": "3550308",
    "uf": "SP",
    "pais": "Brasil",
    "codigoBacen": "1058",
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 4.5. Buscar Cidade por ID

**GET** `/cidades/:id`

Busca uma cidade pelo ID.

**Parâmetros:**

- `id` (path): UUID da cidade

**Response (200):**

```json
{
  "message": "Cidade encontrada",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "filialId": "uuid",
    "nome": "São Paulo",
    "codigoIbge": "3550308",
    "uf": "SP",
    "pais": "Brasil",
    "codigoBacen": "1058",
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 4.6. Atualizar Cidade

**PATCH** `/cidades/:id`

Atualiza os dados de uma cidade.

**Parâmetros:**

- `id` (path): UUID da cidade

**Body (todos os campos opcionais):**

```json
{
  "nome": "string",
  "codigoIbge": "string",
  "uf": "string",
  "pais": "string",
  "codigoBacen": "string"
}
```

**Response (200):**

```json
{
  "message": "Cidade atualizada",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "filialId": "uuid",
    "nome": "São Paulo",
    "codigoIbge": "3550308",
    "uf": "SP",
    "pais": "Brasil",
    "codigoBacen": "1058",
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissões:** Administrador, Editor

---

#### 4.7. Remover Cidade

**DELETE** `/cidades/:id`

Remove uma cidade.

**Parâmetros:**

- `id` (path): UUID da cidade

**Response (200):**

```json
{
  "message": "Cidade removida",
  "statusCode": 200
}
```

**Permissões:** Administrador, Editor

---

### 5. Contatos

#### 5.1. Criar Contato

**POST** `/contatos`

Cria um novo contato.

**Body:**

```json
{
  "clienteId": "string (UUID) - opcional",
  "filialId": "string (UUID) - opcional",
  "nome": "string",
  "funcao": "string",
  "telefone": "string",
  "celular": "string",
  "email": "string"
}
```

**Response (201):**

```json
{
  "message": "Contato criado",
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "filialId": "uuid",
    "nome": "João Silva",
    "funcao": "Gerente",
    "telefone": "******1234",
    "celular": "******5678",
    "email": "joa****@email.com",
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Observações:**

- Email, telefone e celular são mascarados na resposta

**Permissões:** Administrador, Editor

---

#### 5.2. Listar Todos os Contatos

**GET** `/contatos`

Lista todos os contatos do cliente autenticado.

**Response (200):**

```json
{
  "message": "Contatos encontrados",
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "clienteId": "uuid",
      "filialId": "uuid",
      "nome": "João Silva",
      "funcao": "Gerente",
      "telefone": "******1234",
      "celular": "******5678",
      "email": "joa****@email.com",
      "criadoEm": "2025-01-01T00:00:00.000Z",
      "atualizadoEm": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 5.3. Buscar Contato por ID

**GET** `/contatos/:id`

Busca um contato pelo ID.

**Parâmetros:**

- `id` (path): UUID do contato

**Response (200):**

```json
{
  "message": "Contato encontrado",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "filialId": "uuid",
    "nome": "João Silva",
    "funcao": "Gerente",
    "telefone": "******1234",
    "celular": "******5678",
    "email": "joa****@email.com",
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 5.4. Atualizar Contato

**PATCH** `/contatos/:id`

Atualiza os dados de um contato.

**Parâmetros:**

- `id` (path): UUID do contato

**Body (todos os campos opcionais):**

```json
{
  "nome": "string",
  "funcao": "string",
  "telefone": "string",
  "celular": "string",
  "email": "string"
}
```

**Response (200):**

```json
{
  "message": "Contato atualizado",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "filialId": "uuid",
    "nome": "João Silva",
    "funcao": "Diretor",
    "telefone": "******1234",
    "celular": "******5678",
    "email": "joa****@email.com",
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissões:** Administrador, Editor

---

#### 5.5. Remover Contato

**DELETE** `/contatos/:id`

Remove um contato.

**Parâmetros:**

- `id` (path): UUID do contato

**Response (200):**

```json
{
  "message": "Contato removido",
  "statusCode": 200
}
```

**Permissões:** Administrador, Editor

---

### 6. Perfis

#### 6.1. Criar Perfil

**POST** `/perfis`

Cria um novo perfil de usuário.

**Body:**

```json
{
  "clienteId": "string (UUID)",
  "nome": "string",
  "permissoes": {
    "usuarios": ["criar", "editar", "listar"],
    "relatorios": ["visualizar"]
  }
}
```

**Response (201):**

```json
{
  "message": "Perfil criado com sucesso",
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "nome": "Administrador",
    "permissoes": {
      "usuarios": ["criar", "editar", "listar"],
      "relatorios": ["visualizar"]
    },
    "ativo": true,
    "deletadoEm": null
  }
}
```

**Permissões:** Requer autenticação

---

#### 6.2. Listar Perfis por Cliente

**GET** `/perfis/:clienteId`

Lista todos os perfis de um cliente.

**Parâmetros:**

- `clienteId` (path): UUID do cliente

**Response (200):**

```json
{
  "message": "Perfis encontrados",
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "clienteId": "uuid",
      "nome": "Administrador",
      "permissoes": {
        "usuarios": ["criar", "editar", "listar"],
        "relatorios": ["visualizar"]
      },
      "ativo": true,
      "deletadoEm": null
    }
  ]
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 6.3. Buscar Perfil por ID

**GET** `/perfis/:clienteId/:id`

Busca um perfil específico.

**Parâmetros:**

- `clienteId` (path): UUID do cliente
- `id` (path): UUID do perfil

**Response (200):**

```json
{
  "message": "Perfil encontrado",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "nome": "Administrador",
    "permissoes": {
      "usuarios": ["criar", "editar", "listar"],
      "relatorios": ["visualizar"]
    },
    "ativo": true,
    "deletadoEm": null
  }
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 6.4. Atualizar Perfil

**PATCH** `/perfis/:clienteId/:id`

Atualiza os dados de um perfil.

**Parâmetros:**

- `clienteId` (path): UUID do cliente
- `id` (path): UUID do perfil

**Body (todos os campos opcionais):**

```json
{
  "nome": "string",
  "permissoes": {
    "usuarios": ["criar", "editar", "listar"],
    "relatorios": ["visualizar"]
  }
}
```

**Response (200):**

```json
{
  "message": "Perfil atualizado com sucesso",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "nome": "Editor",
    "permissoes": {
      "usuarios": ["editar", "listar"],
      "relatorios": ["visualizar"]
    },
    "ativo": true,
    "deletadoEm": null
  }
}
```

**Permissões:** Administrador, Editor

---

#### 6.5. Remover Perfil (Soft Delete)

**DELETE** `/perfis/:clienteId/:id`

Remove um perfil (soft delete).

**Parâmetros:**

- `clienteId` (path): UUID do cliente
- `id` (path): UUID do perfil

**Response (200):**

```json
{
  "message": "Perfil excluído com sucesso",
  "statusCode": 200
}
```

**Permissões:** Administrador

---

### 7. Usuário-Perfil (Associações)

#### 7.1. Listar Todas as Associações

**GET** `/usuario-perfil`

Lista todas as associações entre usuários e perfis.

**Response (200):**

```json
{
  "message": "Associações encontradas",
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "usuario": "uuid",
      "empresa": "uuid",
      "perfil": "uuid",
      "ativo": true,
      "deletadoEm": null,
      "criadoEm": "2025-01-01T00:00:00.000Z",
      "atualizadoEm": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Observações:**

- Os campos `usuario`, `empresa` e `perfil` retornam apenas os UUIDs (sanitizados)

**Permissões:** Administrador, Editor, Visualizador

---

#### 7.2. Listar Associações por Cliente

**GET** `/usuario-perfil/cliente/:clienteId`

Lista associações de um cliente específico.

**Parâmetros:**

- `clienteId` (path): UUID do cliente

**Response (200):**

```json
{
  "message": "Perfis do cliente encontrados",
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "usuario": "uuid",
      "empresa": "uuid",
      "perfil": "uuid",
      "ativo": true,
      "deletadoEm": null,
      "criadoEm": "2025-01-01T00:00:00.000Z",
      "atualizadoEm": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Permissões:** Administrador, Editor, Visualizador

---

#### 7.3. Atualizar Associação

**PUT** `/usuario-perfil/:id`

Atualiza uma associação usuário-perfil.

**Parâmetros:**

- `id` (path): UUID da associação

**Body:**

```json
{
  "ativo": true
}
```

**Response (200):**

```json
{
  "message": "Associação atualizada com sucesso",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "usuario": "uuid",
    "empresa": "uuid",
    "perfil": "uuid",
    "ativo": true,
    "deletadoEm": null,
    "criadoEm": "2025-01-01T00:00:00.000Z",
    "atualizadoEm": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissões:** Administrador, Editor

---

#### 7.4. Remover Associação (Soft Delete)

**DELETE** `/usuario-perfil/:id`

Remove uma associação (soft delete).

**Parâmetros:**

- `id` (path): UUID da associação

**Response (200):**

```json
{
  "message": "Associação removida com sucesso",
  "statusCode": 200
}
```

**Permissões:** Administrador

---

## Observações Importantes

### Autenticação e Autorização

- A maioria dos endpoints requer um token JWT válido no header `Authorization`
- Os tokens são obtidos através do endpoint `/auth/login`
- Existem três níveis de permissão:
  - **Administrador**: Acesso total
  - **Editor**: Pode criar e editar, mas não deletar
  - **Visualizador**: Apenas leitura

### Padrão de Resposta

Todos os endpoints seguem um padrão de resposta:

```json
{
  "message": "string",
  "statusCode": number,
  "data": object | array
}
```

### UUIDs

- Todos os IDs são UUIDs (v4)
- Formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Soft Delete

- Vários endpoints usam soft delete, ou seja, os registros não são removidos fisicamente do banco de dados, apenas marcados como deletados

### Estados Brasileiros (UF)

Os seguintes estados são aceitos no campo `uf`:

```
AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO
```

### Mascaramento de Dados Sensíveis

Por questões de segurança, alguns dados pessoais são mascarados nas respostas da API:

**Email:**

- Mantém os 3 primeiros caracteres e o domínio
- Exemplo: `joao@email.com` → `joa****@email.com`

**Telefone/Celular:**

- Mantém os 4 últimos dígitos
- Exemplo: `11987654321` → `******4321`

**Campos nunca retornados:**

- `senha` (password)
- `login` (em alguns contextos)

Estes mascaramentos são aplicados automaticamente pelos utils de sanitização da API.
