# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Em Desenvolvimento

- Sistema de notificações por email
- Dashboard de métricas em tempo real
- Integração com gateways de pagamento

---

## [1.0.0] - 2024-11-30

### Adicionado

#### Sistema de Backup Automático

- Backups automáticos programados (diário, semanal, mensal)
- Armazenamento local e em nuvem (AWS S3)
- Política de retenção multi-nível configurável
- Restauração com validação de integridade (checksum SHA256)
- Compressão automática (gzip)
- Endpoints de API para gerenciamento de backups
- Auditoria de todas as operações de backup

#### Documentação Técnica Completa

- Modelo de dados (ERD) com diagrama Mermaid
- Especificação OpenAPI/Swagger aprimorada
- Manual DevOps com instruções de deploy
- Manual de Suporte Técnico
- Changelog versionado

#### Melhorias no Swagger

- Descrição detalhada da API
- Tags organizadas por módulo
- Exemplos de requisição/resposta
- Exportação em JSON e YAML (`/api-json`, `/api-yaml`)

### Alterado

- Swagger UI com configurações personalizadas
- Organização de endpoints por tags

### Segurança

- Endpoints de backup restritos ao perfil ADMIN
- Validação de integridade de backups via checksum

---

## [0.9.0] - 2024-11-15

### Adicionado

#### Importação de Extratos Bancários

- Suporte a formato OFX (Open Financial Exchange)
- Suporte a formato CSV com auto-detecção de colunas
- Algoritmo de matching automático multi-critério
- Score de confiança para sugestões de conciliação
- Interface para aceitar/rejeitar/ignorar sugestões

#### Conciliação Bancária

- Conciliação manual de movimentações
- Desconciliação (estorno) de pagamentos conciliados
- Atualização automática de status

### Alterado

- Entidade MovimentacoesBancarias com campos de conciliação
- Serviço de movimentações com suporte a conciliação

---

## [0.8.0] - 2024-11-01

### Adicionado

#### Sistema de Auditoria

- Logs imutáveis de todas as operações sensíveis
- Eventos de autenticação (login/logout)
- Eventos de autorização (acesso negado)
- Eventos de operações CRUD
- Endpoint de consulta de auditoria (admin)

#### Proteção CSRF

- Guard global de proteção CSRF
- Validação de origin em requisições

#### Criptografia de Dados Sensíveis

- Criptografia AES-256-GCM para dados financeiros
- Transformers personalizados para MikroORM
- Campos criptografados: valores monetários, dados bancários

### Segurança

- Headers de segurança via Helmet
- Rate limiting para proteção contra abuso
- Sanitização de inputs contra XSS

---

## [0.7.0] - 2024-10-15

### Adicionado

#### Relatórios Financeiros

- DRE (Demonstrativo de Resultado do Exerc�cio)
- Fluxo de Caixa
- Relatório de Contas a Pagar
- Relatório de Contas a Receber
- Relatório de Movimentações Bancárias
- Exportação em PDF, Excel (XLSX) e CSV

### Alterado

- Plano de Contas com estrutura hierárquica completa

---

## [0.6.0] - 2024-10-01

### Adicionado

#### Baixas de Pagamento/Recebimento

- Baixa total e parcial
- Cálculo automático de acréscimos e descontos
- Atualização automática de status da conta
- Criação automática de movimentação bancária
- Estorno de baixas

#### Movimentações Bancárias

- CRUD completo de movimentações
- Tipos: Crédito, Débito, Entrada, Saída
- Vinculação com contas a pagar/receber
- Atualização automática de saldo

### Alterado

- ContasPagar com campo `saldo` para baixas parciais
- ContasReceber com campo `saldo` para baixas parciais

---

## [0.5.0] - 2024-09-15

### Adicionado

#### Contas a Pagar

- CRUD completo
- Status: Pendente, Vencida, Paga, Parcialmente Paga
- Parcelamento automático
- Vinculação com fornecedor e plano de contas
- Cancelamento com justificativa

#### Contas a Receber

- CRUD completo
- Tipos: Boleto, PIX, Cartão, etc
- Status: Pendente, Parcial, Liquidado, Cancelado, Vencido
- Vinculação com cliente e plano de contas

### Alterado

- Entidade Pessoa com suporte a múltiplos tipos (cliente, fornecedor)

---

## [0.4.0] - 2024-09-01

### Adicionado

#### Contas Bancárias

- CRUD completo
- Saldo inicial e saldo atual
- Criptografia de dados bancários
- Constraint de unicidade (banco/agência/conta)

#### Plano de Contas

- Estrutura hierárquica (pai/filhos)
- Tipos: Receita, Custo, Despesa, Outros
- Flag de permite_lancamento
- Validação de exclusão (não permite se tem lançamentos)

---

## [0.3.0] - 2024-08-15

### Adicionado

#### Pessoas (Clientes/Fornecedores)

- CRUD completo
- Tipos: cliente, fornecedor, transportadora, funcion�rio
- Vinculação com endereço
- Situação financeira: Ativo, Inativo, Bloqueado, Suspenso
- Limite de crédito

#### Endereços e Cidades

- Cadastro de cidades com código IBGE
- Endereços vinculados a pessoas

---

## [0.2.0] - 2024-08-01

### Adicionado

#### Multi-Tenancy

- Estrutura matriz/filial para empresas
- Isolamento de dados por empresa
- EmpresaGuard para validação de acesso
- validação usuário-empresa-filial

#### Perfis de Acesso

- Estrutura de permissões em JSONB
- RolesGuard para controle de acesso
- Decorador @Roles()

### Alterado

- Todas as entidades com `empresa_id` para isolamento

---

## [0.1.0] - 2024-07-15

### Adicionado

#### Estrutura Base

- Projeto NestJS configurado
- MikroORM com PostgreSQL
- Autenticação JWT
- Swagger/OpenAPI
- Validação com class-validator

#### Usuários

- Cadastro de usuários
- Login/Logout
- Hash de senha com bcrypt

#### Empresas

- CRUD de empresas
- Campos básicos (CNPJ, razão social, endereço)

---

## Guia de Versionamento

### Formato de Versão: MAJOR.MINOR.PATCH

- **MAJOR**: Alterações incompatíveis com versões anteriores
- **MINOR**: Novas funcionalidades retrocompatíveis
- **PATCH**: Correções de bugs retrocompatíveis

### Categorias de Mudanças

- **Adicionado**: Novas funcionalidades
- **Alterado**: Mudanças em funcionalidades existentes
- **Obsoleto**: Funcionalidades que serão removidas em versões futuras
- **Removido**: Funcionalidades removidas
- **Corrigido**: Correções de bugs
- **Seguran�a**: Correções de vulnerabilidades

---

## Links

- [Repositório](https://github.com/seu-repo/financeiro-api)
- [Documentação](./docs/)
- [Issues](https://github.com/seu-repo/financeiro-api/issues)
