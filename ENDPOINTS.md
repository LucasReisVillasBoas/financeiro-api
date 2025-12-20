# Documentacao de Endpoints - Financeiro API

## Autenticacao

### Funcionalidade: Login de usuario
- **Endpoint**: `POST /auth/login`
- **Descricao**: Realiza autenticacao do usuario no sistema e retorna token JWT
- **Request**:
  - email (string, obrigatorio)
  - password (string, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Logout de usuario
- **Endpoint**: `POST /auth/logout`
- **Descricao**: Realiza logout do usuario autenticado
- **Request**: Nenhum (usa token JWT)
- **Testado**: SIM [ ] | NAO [X]

---

## Usuarios

### Funcionalidade: Criar usuario
- **Endpoint**: `POST /usuario/cadastro`
- **Descricao**: Cria um novo usuario no sistema
- **Request**:
  - email (string, obrigatorio)
  - login (string, obrigatorio)
  - senha (string, obrigatorio, min 6 caracteres)
  - nome (string, obrigatorio)
  - telefone (string, obrigatorio)
  - cargo (string, obrigatorio)
  - ativo (boolean, obrigatorio)
  - cidade (object, opcional)
  - contatos (array, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar usuario atual
- **Endpoint**: `GET /usuario`
- **Descricao**: Retorna dados do usuario autenticado
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar todos usuarios
- **Endpoint**: `GET /usuario/all`
- **Descricao**: Lista todos os usuarios das empresas do usuario autenticado
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar usuario por ID
- **Endpoint**: `GET /usuario/id/:id`
- **Descricao**: Retorna dados de um usuario especifico pelo ID
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar usuario
- **Endpoint**: `PATCH /usuario/:id`
- **Descricao**: Atualiza dados de um usuario existente
- **Request**:
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Associar usuario a empresa/filial
- **Endpoint**: `POST /usuario/:id/empresas`
- **Descricao**: Associa um usuario a uma empresa ou filial
- **Request**:
  - id (path param, obrigatorio)
  - empresaId (string, obrigatorio)
  - filialId (string, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar associacoes do usuario
- **Endpoint**: `GET /usuario/:id/empresas`
- **Descricao**: Lista todas as empresas/filiais associadas ao usuario
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Remover associacao usuario-empresa
- **Endpoint**: `DELETE /usuario/:id/empresas/:assocId`
- **Descricao**: Remove associacao entre usuario e empresa/filial
- **Request**:
  - id (path param, obrigatorio)
  - assocId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Empresas

### Funcionalidade: Criar empresa
- **Endpoint**: `POST /empresas`
- **Descricao**: Cria uma nova empresa (sede)
- **Request**:
  - cliente_id (string, obrigatorio)
  - razao_social (string, obrigatorio, 3-255 caracteres)
  - nome_fantasia (string, obrigatorio, 3-255 caracteres)
  - cnpj_cpf (string, obrigatorio)
  - inscricao_estadual (string, opcional)
  - inscricao_municipal (string, opcional)
  - cep (string, opcional)
  - logradouro (string, opcional)
  - numero (string, opcional)
  - bairro (string, opcional)
  - complemento (string, opcional)
  - cidade (string, opcional)
  - codigo_ibge (string, opcional)
  - uf (string, opcional, 2 letras maiusculas)
  - telefone (string, opcional)
  - celular (string, opcional)
  - email (string, opcional)
  - data_abertura (date, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar empresas por cliente
- **Endpoint**: `GET /empresas/cliente/:clienteId`
- **Descricao**: Lista todas as empresas de um cliente especifico
- **Request**: clienteId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar empresa por ID
- **Endpoint**: `GET /empresas/:id`
- **Descricao**: Retorna dados de uma empresa especifica
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar empresa por CNPJ
- **Endpoint**: `GET /empresas/document/:cnpj`
- **Descricao**: Busca empresa pelo CNPJ
- **Request**: cnpj (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar empresa
- **Endpoint**: `PUT /empresas/:id`
- **Descricao**: Atualiza dados de uma empresa existente
- **Request**:
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Remover empresa (soft delete)
- **Endpoint**: `DELETE /empresas/:id`
- **Descricao**: Remove logicamente uma empresa
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Criar filial
- **Endpoint**: `POST /empresas/:id/filiais`
- **Descricao**: Cria uma nova filial para uma empresa sede
- **Request**:
  - id (path param, obrigatorio - ID da sede)
  - mesmos campos de criar empresa
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar filiais
- **Endpoint**: `GET /empresas/:id/filiais`
- **Descricao**: Lista todas as filiais de uma empresa sede
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar filial
- **Endpoint**: `PUT /empresas/filiais/:filialId`
- **Descricao**: Atualiza dados de uma filial
- **Request**:
  - filialId (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Remover filial (soft delete)
- **Endpoint**: `DELETE /empresas/filiais/:filialId`
- **Descricao**: Remove logicamente uma filial
- **Request**: filialId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Pessoas (Clientes/Fornecedores)

### Funcionalidade: Criar pessoa completa
- **Endpoint**: `POST /pessoas/completo`
- **Descricao**: Cria pessoa com endereco em formato simplificado
- **Request**: dados da pessoa com endereco integrado
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Criar pessoa (formato avancado)
- **Endpoint**: `POST /pessoas`
- **Descricao**: Cria nova pessoa (fornecedor/cliente)
- **Request**:
  - empresaId (UUID, obrigatorio)
  - enderecoId (UUID, obrigatorio)
  - tipos (array de TipoPessoa, obrigatorio)
  - razaoNome (string, opcional, max 60)
  - fantasiaApelido (string, opcional, max 60)
  - documento (string, opcional - CPF/CNPJ)
  - ieRg (string, opcional)
  - im (string, opcional)
  - tipoContribuinte (enum, opcional)
  - consumidorFinal (boolean, opcional)
  - aniversario (date, opcional)
  - limiteCredito (number, opcional)
  - situacaoFinanceira (enum, opcional)
  - email (string, opcional)
  - telefone (string, opcional)
  - situacao (enum, opcional)
  - ativo (boolean, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar pessoas por cliente
- **Endpoint**: `GET /pessoas/cliente/:clienteId`
- **Descricao**: Lista pessoas de um cliente especifico
- **Request**: clienteId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar pessoas com filtros
- **Endpoint**: `GET /pessoas`
- **Descricao**: Lista todas as pessoas com filtros opcionais
- **Request**: query params de filtro
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar pessoa por ID
- **Endpoint**: `GET /pessoas/:id`
- **Descricao**: Retorna dados de uma pessoa especifica
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar pessoa
- **Endpoint**: `PUT /pessoas/:id`
- **Descricao**: Atualiza dados de uma pessoa
- **Request**:
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Excluir pessoa (soft delete)
- **Endpoint**: `DELETE /pessoas/:id`
- **Descricao**: Exclui logicamente uma pessoa
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Reativar pessoa
- **Endpoint**: `POST /pessoas/:id/reativar`
- **Descricao**: Reativa uma pessoa previamente excluida
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Contas a Pagar

### Funcionalidade: Criar conta a pagar
- **Endpoint**: `POST /contas-pagar`
- **Descricao**: Cria uma nova conta a pagar
- **Request**:
  - documento (string, obrigatorio)
  - serie (string, opcional)
  - parcela (int, obrigatorio, min 1)
  - tipo (enum: Fornecedor, Emprestimo, Imposto, Salario, Aluguel, Servico, Outros)
  - descricao (string, obrigatorio)
  - data_emissao (date, obrigatorio)
  - vencimento (date, obrigatorio)
  - data_lancamento (date, obrigatorio)
  - data_liquidacao (date, opcional)
  - valor_principal (number, obrigatorio, > 0)
  - acrescimos (number, opcional)
  - descontos (number, opcional)
  - pessoaId (UUID, obrigatorio)
  - planoContasId (UUID, obrigatorio)
  - empresaId (UUID, obrigatorio)
  - status (enum, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contas a pagar
- **Endpoint**: `GET /contas-pagar`
- **Descricao**: Lista todas as contas a pagar
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contas a pagar por empresa
- **Endpoint**: `GET /contas-pagar/empresa/:empresaId`
- **Descricao**: Lista contas a pagar de uma empresa especifica
- **Request**: empresaId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar conta a pagar por ID
- **Endpoint**: `GET /contas-pagar/:id`
- **Descricao**: Retorna dados de uma conta a pagar especifica
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar conta a pagar
- **Endpoint**: `PUT /contas-pagar/:id`
- **Descricao**: Atualiza dados de uma conta a pagar
- **Request**:
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Marcar conta como paga
- **Endpoint**: `PATCH /contas-pagar/:id/pagar`
- **Descricao**: Marca uma conta como paga
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Excluir conta a pagar
- **Endpoint**: `DELETE /contas-pagar/:id`
- **Descricao**: Exclui logicamente uma conta a pagar
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Cancelar conta a pagar
- **Endpoint**: `POST /contas-pagar/:id/cancelar`
- **Descricao**: Cancela uma conta a pagar com justificativa
- **Request**:
  - id (path param, obrigatorio)
  - motivo (string, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Gerar parcelas
- **Endpoint**: `POST /contas-pagar/gerar-parcelas`
- **Descricao**: Gera multiplas parcelas de uma conta a pagar
- **Request**: dados para geracao de parcelas
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Registrar baixa de conta a pagar
- **Endpoint**: `POST /contas-pagar/:id/registrar-baixa`
- **Descricao**: Registra baixa com criacao automatica de movimentacao bancaria
- **Request**:
  - id (path param, obrigatorio)
  - dados da baixa no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Estornar baixa de conta a pagar
- **Endpoint**: `POST /contas-pagar/:id/estornar-baixa`
- **Descricao**: Estorna baixa e remove movimentacao bancaria associada
- **Request**:
  - id (path param, obrigatorio)
  - justificativa (string, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Contas a Receber

### Funcionalidade: Criar conta a receber
- **Endpoint**: `POST /contas-receber`
- **Descricao**: Cria uma nova conta a receber
- **Request**:
  - descricao (string, obrigatorio, max 500)
  - pessoaId (UUID, obrigatorio)
  - planoContasId (UUID, obrigatorio)
  - documento (string, obrigatorio, max 50)
  - serie (string, opcional, max 10)
  - parcela (int, min 1, default 1)
  - tipo (enum: BOLETO, DUPLICATA, NOTA_PROMISSORIA, CHEQUE, CARTAO_CREDITO, CARTAO_DEBITO, PIX, DINHEIRO, OUTROS)
  - dataEmissao (date, obrigatorio)
  - dataLancamento (date, obrigatorio)
  - vencimento (date, obrigatorio)
  - dataLiquidacao (date, opcional)
  - valorPrincipal (number, obrigatorio)
  - valorAcrescimos (number, opcional)
  - valorDescontos (number, opcional)
  - valorTotal (number, obrigatorio)
  - saldo (number, obrigatorio)
  - status (enum, opcional)
  - empresaId (UUID, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contas a receber
- **Endpoint**: `GET /contas-receber`
- **Descricao**: Lista todas as contas a receber
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contas a receber por empresa
- **Endpoint**: `GET /contas-receber/empresa/:empresaId`
- **Descricao**: Lista contas a receber de uma empresa especifica
- **Request**: empresaId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar conta a receber por ID
- **Endpoint**: `GET /contas-receber/:id`
- **Descricao**: Retorna dados de uma conta a receber especifica
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar conta a receber
- **Endpoint**: `PUT /contas-receber/:id`
- **Descricao**: Atualiza dados de uma conta a receber
- **Request**:
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Liquidar conta a receber
- **Endpoint**: `PATCH /contas-receber/:id/liquidar`
- **Descricao**: Liquida uma conta a receber
- **Request**:
  - id (path param, obrigatorio)
  - valorRecebido (number, obrigatorio)
  - dataLiquidacao (string, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Criar conta a receber parcelada
- **Endpoint**: `POST /contas-receber/parcelado`
- **Descricao**: Cria multiplas parcelas de conta a receber
- **Request**: dados para criacao parcelada
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Cancelar conta a receber
- **Endpoint**: `PATCH /contas-receber/:id/cancelar`
- **Descricao**: Cancela uma conta a receber
- **Request**:
  - id (path param, obrigatorio)
  - motivo (string, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Excluir conta a receber
- **Endpoint**: `DELETE /contas-receber/:id`
- **Descricao**: Exclui logicamente uma conta a receber
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Baixas de Pagamento

### Funcionalidade: Criar baixa de pagamento
- **Endpoint**: `POST /baixas-pagamento`
- **Descricao**: Registra uma baixa de pagamento
- **Request**:
  - contaPagarId (UUID, obrigatorio)
  - contaBancariaId (UUID, obrigatorio)
  - valor (number, obrigatorio, > 0)
  - acrescimos (number, opcional)
  - descontos (number, opcional)
  - data (date, obrigatorio)
  - observacao (string, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar baixas de pagamento
- **Endpoint**: `GET /baixas-pagamento`
- **Descricao**: Lista todas as baixas de pagamento
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar baixas por conta a pagar
- **Endpoint**: `GET /baixas-pagamento/conta-pagar/:contaPagarId`
- **Descricao**: Lista baixas de uma conta a pagar especifica
- **Request**: contaPagarId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar baixa de pagamento por ID
- **Endpoint**: `GET /baixas-pagamento/:id`
- **Descricao**: Retorna dados de uma baixa especifica
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Estornar baixa de pagamento
- **Endpoint**: `POST /baixas-pagamento/:id/estornar`
- **Descricao**: Estorna uma baixa de pagamento
- **Request**:
  - id (path param, obrigatorio)
  - justificativa (string, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Baixas de Recebimento

### Funcionalidade: Criar baixa de recebimento
- **Endpoint**: `POST /baixas-recebimento`
- **Descricao**: Registra uma baixa de recebimento
- **Request**:
  - contaReceberId (UUID, obrigatorio)
  - contaBancariaId (UUID, obrigatorio)
  - data (date, obrigatorio)
  - valor (number, obrigatorio, > 0)
  - acrescimos (number, opcional)
  - descontos (number, opcional)
  - observacao (string, opcional, max 1000)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar baixas de recebimento
- **Endpoint**: `GET /baixas-recebimento`
- **Descricao**: Lista todas as baixas de recebimento
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar baixas por conta a receber
- **Endpoint**: `GET /baixas-recebimento/conta-receber/:contaReceberId`
- **Descricao**: Lista baixas de uma conta a receber especifica
- **Request**: contaReceberId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar baixa de recebimento por ID
- **Endpoint**: `GET /baixas-recebimento/:id`
- **Descricao**: Retorna dados de uma baixa especifica
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar movimentacao de uma baixa
- **Endpoint**: `GET /baixas-recebimento/:id/movimentacao`
- **Descricao**: Retorna movimentacao bancaria vinculada a baixa
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Estornar baixa de recebimento
- **Endpoint**: `DELETE /baixas-recebimento/:id/estornar`
- **Descricao**: Estorna uma baixa de recebimento
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Contas Bancarias

### Funcionalidade: Criar conta bancaria
- **Endpoint**: `POST /contas-bancarias`
- **Descricao**: Cria uma nova conta bancaria
- **Request**:
  - cliente_id (string, obrigatorio)
  - empresaId (UUID, obrigatorio)
  - banco (string, obrigatorio)
  - agencia (string, obrigatorio, apenas numeros)
  - agencia_digito (string, opcional)
  - conta (string, obrigatorio, apenas numeros)
  - conta_digito (string, opcional)
  - descricao (string, obrigatorio)
  - tipo (enum: Conta Corrente, Conta Poupanca, Conta Salario, Conta Investimento)
  - saldo_inicial (number, obrigatorio)
  - data_referencia_saldo (date, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contas bancarias
- **Endpoint**: `GET /contas-bancarias`
- **Descricao**: Lista todas as contas bancarias
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contas bancarias por empresa
- **Endpoint**: `GET /contas-bancarias/empresa/:empresaId`
- **Descricao**: Lista contas bancarias de uma empresa especifica
- **Request**: empresaId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar conta bancaria por ID
- **Endpoint**: `GET /contas-bancarias/:id`
- **Descricao**: Retorna dados de uma conta bancaria especifica
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar conta bancaria
- **Endpoint**: `PUT /contas-bancarias/:id`
- **Descricao**: Atualiza dados de uma conta bancaria
- **Request**:
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Ativar/Inativar conta bancaria
- **Endpoint**: `PATCH /contas-bancarias/:id/toggle-status`
- **Descricao**: Alterna status ativo/inativo da conta
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Excluir conta bancaria
- **Endpoint**: `DELETE /contas-bancarias/:id`
- **Descricao**: Exclui logicamente uma conta bancaria
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Movimentacoes Bancarias

### Funcionalidade: Criar movimentacao bancaria
- **Endpoint**: `POST /movimentacoes-bancarias`
- **Descricao**: Cria uma nova movimentacao bancaria
- **Request**:
  - dataMovimento (date, obrigatorio)
  - descricao (string, obrigatorio)
  - conta (string, obrigatorio)
  - categoria (string, obrigatorio)
  - valor (number, obrigatorio, >= 0)
  - tipoMovimento (enum: Credito, Debito, Entrada, Saida)
  - contaBancaria (UUID, obrigatorio)
  - empresaId (UUID, opcional)
  - observacao (string, opcional)
  - conciliado (string, opcional: S/N)
  - referencia (enum: Pagar, Receber, Manual)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar movimentacoes bancarias
- **Endpoint**: `GET /movimentacoes-bancarias`
- **Descricao**: Lista todas as movimentacoes com totais
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar movimentacoes por periodo
- **Endpoint**: `GET /movimentacoes-bancarias/periodo`
- **Descricao**: Lista movimentacoes de um periodo especifico
- **Request**:
  - dataInicio (query param, obrigatorio)
  - dataFim (query param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar movimentacoes por conta
- **Endpoint**: `GET /movimentacoes-bancarias/conta/:contaId`
- **Descricao**: Lista movimentacoes de uma conta especifica
- **Request**: contaId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar movimentacao por ID
- **Endpoint**: `GET /movimentacoes-bancarias/:id`
- **Descricao**: Retorna dados de uma movimentacao especifica
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar movimentacao
- **Endpoint**: `PUT /movimentacoes-bancarias/:id`
- **Descricao**: Atualiza dados de uma movimentacao
- **Request**:
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Excluir movimentacao
- **Endpoint**: `DELETE /movimentacoes-bancarias/:id`
- **Descricao**: Exclui logicamente uma movimentacao
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Conciliar movimentacoes
- **Endpoint**: `POST /movimentacoes-bancarias/conciliar`
- **Descricao**: Marca movimentacoes como conciliadas
- **Request**: lista de IDs de movimentacoes
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Desconciliar movimentacoes
- **Endpoint**: `POST /movimentacoes-bancarias/desconciliar`
- **Descricao**: Remove conciliacao de movimentacoes
- **Request**: lista de IDs de movimentacoes
- **Testado**: SIM [ ] | NAO [X]

---

## Extratos Bancarios

### Funcionalidade: Importar extrato bancario
- **Endpoint**: `POST /extratos-bancarios/importar`
- **Descricao**: Importa extrato bancario (OFX ou CSV)
- **Request**:
  - arquivo (file, obrigatorio - multipart)
  - contaBancariaId (string, obrigatorio)
  - formato (string, obrigatorio: OFX ou CSV)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar extratos
- **Endpoint**: `GET /extratos-bancarios`
- **Descricao**: Lista todos os extratos importados
- **Request**: contaBancariaId (query param, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar extratos pendentes
- **Endpoint**: `GET /extratos-bancarios/pendentes`
- **Descricao**: Lista extratos pendentes de conciliacao
- **Request**: contaBancariaId (query param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Aceitar sugestao de conciliacao
- **Endpoint**: `POST /extratos-bancarios/:id/aceitar`
- **Descricao**: Aceita sugestao de conciliacao automatica
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Rejeitar sugestao de conciliacao
- **Endpoint**: `POST /extratos-bancarios/:id/rejeitar`
- **Descricao**: Rejeita sugestao de conciliacao
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Ignorar item do extrato
- **Endpoint**: `POST /extratos-bancarios/:id/ignorar`
- **Descricao**: Marca item do extrato como ignorado
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Plano de Contas

### Funcionalidade: Criar conta
- **Endpoint**: `POST /plano-contas`
- **Descricao**: Cria uma nova conta no plano de contas
- **Request**:
  - empresaId (UUID, obrigatorio)
  - codigo (string, obrigatorio, formato: 1.1.01)
  - descricao (string, obrigatorio, max 255)
  - tipo (enum: Receita, Custo, Despesa, Outros)
  - parentId (UUID, opcional)
  - nivel (int, obrigatorio, >= 1)
  - permite_lancamento (boolean, opcional)
  - ativo (boolean, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar todas as contas
- **Endpoint**: `GET /plano-contas`
- **Descricao**: Lista todas as contas do plano de contas
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contas por empresa
- **Endpoint**: `GET /plano-contas/empresa/:empresaId`
- **Descricao**: Lista contas de uma empresa especifica
- **Request**: empresaId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contas por tipo
- **Endpoint**: `GET /plano-contas/empresa/:empresaId/tipo/:tipo`
- **Descricao**: Lista contas por tipo (Receita, Custo, etc)
- **Request**:
  - empresaId (path param, obrigatorio)
  - tipo (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contas analiticas
- **Endpoint**: `GET /plano-contas/empresa/:empresaId/analiticas`
- **Descricao**: Lista todas as contas analiticas
- **Request**: empresaId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contas analiticas ativas
- **Endpoint**: `GET /plano-contas/empresa/:empresaId/analiticas-ativas`
- **Descricao**: Lista apenas contas analiticas ativas
- **Request**: empresaId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar arvore de contas
- **Endpoint**: `GET /plano-contas/empresa/:empresaId/tree`
- **Descricao**: Retorna estrutura hierarquica das contas
- **Request**: empresaId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar contas
- **Endpoint**: `GET /plano-contas/empresa/:empresaId/search`
- **Descricao**: Busca contas por termo
- **Request**:
  - empresaId (path param, obrigatorio)
  - term (query param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Exportar para CSV
- **Endpoint**: `GET /plano-contas/empresa/:empresaId/export/csv`
- **Descricao**: Exporta plano de contas em CSV
- **Request**: empresaId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Exportar para Excel
- **Endpoint**: `GET /plano-contas/empresa/:empresaId/export/excel`
- **Descricao**: Exporta plano de contas em Excel
- **Request**: empresaId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Importar CSV
- **Endpoint**: `POST /plano-contas/empresa/:empresaId/import/csv`
- **Descricao**: Importa plano de contas de arquivo CSV
- **Request**:
  - empresaId (path param, obrigatorio)
  - file (file, obrigatorio - multipart)
  - sobrescrever (boolean, opcional)
  - dryRun (boolean, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Validar importacao
- **Endpoint**: `POST /plano-contas/empresa/:empresaId/import/validate`
- **Descricao**: Valida dados de importacao sem executar
- **Request**:
  - empresaId (path param, obrigatorio)
  - dados no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Importar dados
- **Endpoint**: `POST /plano-contas/empresa/:empresaId/import`
- **Descricao**: Importa dados do plano de contas
- **Request**:
  - empresaId (path param, obrigatorio)
  - dados no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contas filhas
- **Endpoint**: `GET /plano-contas/:id/filhos`
- **Descricao**: Lista contas filhas de uma conta
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar breadcrumb
- **Endpoint**: `GET /plano-contas/:id/breadcrumb`
- **Descricao**: Retorna caminho hierarquico da conta
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar conta por ID
- **Endpoint**: `GET /plano-contas/:id`
- **Descricao**: Retorna dados de uma conta especifica
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar conta
- **Endpoint**: `PATCH /plano-contas/:id`
- **Descricao**: Atualiza dados de uma conta
- **Request**:
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Ativar/Inativar conta
- **Endpoint**: `PATCH /plano-contas/:id/toggle-status`
- **Descricao**: Alterna status ativo/inativo da conta
- **Request**:
  - id (path param, obrigatorio)
  - ativo (boolean, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Verificar uso da conta
- **Endpoint**: `GET /plano-contas/:id/uso`
- **Descricao**: Verifica se conta esta em uso
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Substituir conta
- **Endpoint**: `POST /plano-contas/:id/substituir`
- **Descricao**: Substitui conta em todos os lancamentos
- **Request**:
  - id (path param, obrigatorio - conta origem)
  - contaDestinoId (string, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Excluir conta
- **Endpoint**: `DELETE /plano-contas/:id`
- **Descricao**: Exclui logicamente uma conta
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## DRE (Demonstrativo de Resultados)

### Funcionalidade: Gerar DRE
- **Endpoint**: `GET /dre`
- **Descricao**: Gera demonstrativo de resultados
- **Request**:
  - empresaId (query param, obrigatorio)
  - dataInicio (query param, obrigatorio)
  - dataFim (query param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Gerar DRE consolidado
- **Endpoint**: `GET /dre/consolidado`
- **Descricao**: Gera DRE consolidado de multiplas empresas
- **Request**:
  - empresaIds (query param, obrigatorio - separados por virgula)
  - dataInicio (query param, obrigatorio)
  - dataFim (query param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Gerar DRE comparativo
- **Endpoint**: `GET /dre/comparativo`
- **Descricao**: Compara DRE de dois periodos
- **Request**:
  - empresaId (query param, obrigatorio)
  - periodo1Inicio (query param, obrigatorio)
  - periodo1Fim (query param, obrigatorio)
  - periodo2Inicio (query param, obrigatorio)
  - periodo2Fim (query param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Relatorios

### Funcionalidade: Relatorio de DRE
- **Endpoint**: `GET /relatorios/dre`
- **Descricao**: Gera relatorio DRE formatado para frontend
- **Request**: filtros via query params
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Relatorio de Fluxo de Caixa
- **Endpoint**: `GET /relatorios/fluxo-caixa`
- **Descricao**: Gera relatorio de fluxo de caixa
- **Request**: filtros via query params
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Relatorio de Contas a Pagar
- **Endpoint**: `GET /relatorios/contas-pagar`
- **Descricao**: Gera relatorio de contas a pagar
- **Request**: filtros via query params
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Exportar Contas a Pagar CSV
- **Endpoint**: `GET /relatorios/contas-pagar/exportar/csv`
- **Descricao**: Exporta relatorio de contas a pagar em CSV
- **Request**: filtros via query params
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Exportar Contas a Pagar Excel
- **Endpoint**: `GET /relatorios/contas-pagar/exportar/excel`
- **Descricao**: Exporta relatorio de contas a pagar em Excel
- **Request**: filtros via query params
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Exportar Contas a Pagar PDF
- **Endpoint**: `GET /relatorios/contas-pagar/exportar/pdf`
- **Descricao**: Exporta relatorio de contas a pagar em PDF
- **Request**: filtros via query params
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Relatorio de Contas a Receber
- **Endpoint**: `GET /relatorios/contas-receber`
- **Descricao**: Gera relatorio de contas a receber
- **Request**: filtros via query params
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Exportar Contas a Receber CSV
- **Endpoint**: `GET /relatorios/contas-receber/exportar/csv`
- **Descricao**: Exporta relatorio de contas a receber em CSV
- **Request**: filtros via query params
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Exportar Contas a Receber Excel
- **Endpoint**: `GET /relatorios/contas-receber/exportar/excel`
- **Descricao**: Exporta relatorio de contas a receber em Excel
- **Request**: filtros via query params
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Exportar Contas a Receber PDF
- **Endpoint**: `GET /relatorios/contas-receber/exportar/pdf`
- **Descricao**: Exporta relatorio de contas a receber em PDF
- **Request**: filtros via query params
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Relatorio de Movimentacoes Bancarias
- **Endpoint**: `GET /movimentacoes-bancarias/relatorio`
- **Descricao**: Gera relatorio de movimentacoes bancarias
- **Request**: filtros via query params
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Exportar Movimentacoes
- **Endpoint**: `GET /movimentacoes-bancarias/relatorio/exportar`
- **Descricao**: Exporta relatorio de movimentacoes (CSV, Excel ou PDF)
- **Request**:
  - filtros via query params
  - formato (query param: CSV, EXCEL ou PDF)
- **Testado**: SIM [ ] | NAO [X]

---

## Auditoria

### Funcionalidade: Listar registros de auditoria
- **Endpoint**: `GET /auditoria`
- **Descricao**: Lista registros de auditoria com filtros
- **Request**:
  - usuarioId (query param, opcional)
  - empresaId (query param, opcional)
  - modulo (query param, opcional)
  - acao (query param, opcional)
  - resultado (query param, opcional)
  - dataInicio (query param, opcional)
  - dataFim (query param, opcional)
  - limit (query param, opcional)
  - offset (query param, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar logs por usuario
- **Endpoint**: `GET /auditoria/usuario/:usuarioId`
- **Descricao**: Lista logs de um usuario especifico
- **Request**:
  - usuarioId (path param, obrigatorio)
  - limit (query param, opcional)
  - offset (query param, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar logs por empresa
- **Endpoint**: `GET /auditoria/empresa/:empresaId`
- **Descricao**: Lista logs de uma empresa especifica
- **Request**:
  - empresaId (path param, obrigatorio)
  - limit (query param, opcional)
  - offset (query param, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar logs por modulo
- **Endpoint**: `GET /auditoria/modulo/:modulo`
- **Descricao**: Lista logs de um modulo especifico
- **Request**:
  - modulo (path param, obrigatorio)
  - limit (query param, opcional)
  - offset (query param, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar logs por acao
- **Endpoint**: `GET /auditoria/acao/:acao`
- **Descricao**: Lista logs de uma acao especifica
- **Request**:
  - acao (path param, obrigatorio)
  - limit (query param, opcional)
  - offset (query param, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Estatisticas de auditoria
- **Endpoint**: `GET /auditoria/statistics`
- **Descricao**: Retorna estatisticas agregadas de auditoria
- **Request**:
  - dataInicio (query param, opcional)
  - dataFim (query param, opcional)
  - empresaId (query param, opcional)
  - usuarioId (query param, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar registro por ID
- **Endpoint**: `GET /auditoria/:id`
- **Descricao**: Retorna registro de auditoria especifico
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Backup

### Funcionalidade: Criar backup
- **Endpoint**: `POST /backup`
- **Descricao**: Cria backup manual do banco de dados
- **Request**:
  - level (string, opcional: DAILY, WEEKLY, MONTHLY)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar backups
- **Endpoint**: `GET /backup`
- **Descricao**: Lista todos os backups disponiveis
- **Request**:
  - storage (query param, opcional)
  - level (query param, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Restaurar backup
- **Endpoint**: `POST /backup/restore`
- **Descricao**: Restaura backup do banco de dados
- **Request**:
  - backupId (string, obrigatorio)
  - storage (string, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Testar restauracao
- **Endpoint**: `POST /backup/test-restore`
- **Descricao**: Testa restauracao sem aplicar
- **Request**:
  - backupId (string, obrigatorio)
  - storage (string, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Excluir backup
- **Endpoint**: `DELETE /backup`
- **Descricao**: Exclui um backup especifico
- **Request**:
  - backupId (string, obrigatorio)
  - storage (string, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Aplicar politica de retencao
- **Endpoint**: `POST /backup/retention`
- **Descricao**: Remove backups expirados conforme politica
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Status do sistema de backup
- **Endpoint**: `GET /backup/status`
- **Descricao**: Retorna status do sistema de backup
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

---

## Perfis

### Funcionalidade: Criar perfil
- **Endpoint**: `POST /perfis`
- **Descricao**: Cria um novo perfil de acesso
- **Request**:
  - clienteId (string, obrigatorio)
  - nome (string, obrigatorio)
  - permissoes (object, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar perfis por cliente
- **Endpoint**: `GET /perfis/:clienteId`
- **Descricao**: Lista perfis de um cliente
- **Request**: clienteId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar perfil por ID
- **Endpoint**: `GET /perfis/:clienteId/:id`
- **Descricao**: Retorna dados de um perfil especifico
- **Request**:
  - clienteId (path param, obrigatorio)
  - id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar perfil
- **Endpoint**: `PATCH /perfis/:clienteId/:id`
- **Descricao**: Atualiza dados de um perfil
- **Request**:
  - clienteId (path param, obrigatorio)
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Excluir perfil
- **Endpoint**: `DELETE /perfis/:clienteId/:id`
- **Descricao**: Exclui logicamente um perfil
- **Request**:
  - clienteId (path param, obrigatorio)
  - id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Usuario-Perfil

### Funcionalidade: Listar associacoes
- **Endpoint**: `GET /usuario-perfil`
- **Descricao**: Lista todas as associacoes usuario-perfil
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar associacoes por cliente
- **Endpoint**: `GET /usuario-perfil/cliente/:clienteId`
- **Descricao**: Lista associacoes de um cliente
- **Request**: clienteId (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar associacao
- **Endpoint**: `PUT /usuario-perfil/:id`
- **Descricao**: Atualiza uma associacao usuario-perfil
- **Request**:
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Remover associacao
- **Endpoint**: `DELETE /usuario-perfil/:id`
- **Descricao**: Remove associacao usuario-perfil
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Cidades

### Funcionalidade: Criar cidade
- **Endpoint**: `POST /cidades`
- **Descricao**: Cria uma nova cidade
- **Request**:
  - nome (string, obrigatorio, max 255)
  - clienteId (UUID, opcional)
  - filialId (UUID, opcional)
  - codigoIbge (string, opcional)
  - uf (string, opcional, 2 caracteres)
  - pais (string, opcional, default: Brasil)
  - codigoBacen (string, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar cidades
- **Endpoint**: `GET /cidades`
- **Descricao**: Lista todas as cidades do cliente
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar cidades por UF
- **Endpoint**: `GET /cidades/uf/:uf`
- **Descricao**: Lista cidades de uma UF especifica
- **Request**: uf (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar cidade por codigo IBGE
- **Endpoint**: `GET /cidades/ibge/:codigoIbge`
- **Descricao**: Busca cidade pelo codigo IBGE
- **Request**: codigoIbge (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar cidade por ID
- **Endpoint**: `GET /cidades/:id`
- **Descricao**: Retorna dados de uma cidade especifica
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar cidade
- **Endpoint**: `PATCH /cidades/:id`
- **Descricao**: Atualiza dados de uma cidade
- **Request**:
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Remover cidade
- **Endpoint**: `DELETE /cidades/:id`
- **Descricao**: Remove uma cidade
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Contatos

### Funcionalidade: Criar contato
- **Endpoint**: `POST /contatos`
- **Descricao**: Cria um novo contato
- **Request**:
  - nome (string, obrigatorio)
  - funcao (string, obrigatorio)
  - telefone (string, obrigatorio)
  - celular (string, obrigatorio)
  - email (string, obrigatorio)
  - clienteId (UUID, opcional)
  - filialId (UUID, opcional)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Listar contatos
- **Endpoint**: `GET /contatos`
- **Descricao**: Lista todos os contatos do cliente
- **Request**: Nenhum
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar contato por ID
- **Endpoint**: `GET /contatos/:id`
- **Descricao**: Retorna dados de um contato especifico
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Buscar contato por telefone
- **Endpoint**: `GET /contatos/telefone/:telefone`
- **Descricao**: Busca contato pelo telefone
- **Request**: telefone (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Atualizar contato
- **Endpoint**: `PATCH /contatos/:id`
- **Descricao**: Atualiza dados de um contato
- **Request**:
  - id (path param, obrigatorio)
  - campos a atualizar no body
- **Testado**: SIM [ ] | NAO [X]

### Funcionalidade: Remover contato
- **Endpoint**: `DELETE /contatos/:id`
- **Descricao**: Remove um contato
- **Request**: id (path param, obrigatorio)
- **Testado**: SIM [ ] | NAO [X]

---

## Resumo Total de Endpoints

| Modulo | Quantidade |
|--------|------------|
| Autenticacao | 2 |
| Usuarios | 8 |
| Empresas | 10 |
| Pessoas | 8 |
| Contas a Pagar | 12 |
| Contas a Receber | 9 |
| Baixas de Pagamento | 5 |
| Baixas de Recebimento | 6 |
| Contas Bancarias | 7 |
| Movimentacoes Bancarias | 9 |
| Extratos Bancarios | 6 |
| Plano de Contas | 21 |
| DRE | 3 |
| Relatorios | 12 |
| Auditoria | 7 |
| Backup | 7 |
| Perfis | 5 |
| Usuario-Perfil | 4 |
| Cidades | 7 |
| Contatos | 6 |
| **TOTAL** | **154** |

---

*Documento gerado automaticamente em 19/12/2025*
