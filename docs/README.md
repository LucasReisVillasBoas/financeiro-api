# Documentação do Sistema Financeiro API

Este diretório contém toda a documentação técnica, arquitetural e de validação do sistema.

## 📚 Índice da Documentação

### Documentação de Referência

- **[API.md](./API.md)** - Documentação completa dos endpoints da API
  - Autenticação e autorização
  - Endpoints de todas as funcionalidades
  - Exemplos de requisições e respostas
  - Swagger disponível em `http://localhost:3000/api`

- **[DOCUMENTACAO_TESTES.md](./DOCUMENTACAO_TESTES.md)** - Documentação completa dos testes
  - Status atual: 299 testes passando
  - Cobertura de funcionalidades
  - Como executar os testes
  - Estratégia de testes unitários, integração e E2E

### Implementações e Funcionalidades

- **[DOCUMENTACAO_EXTRATO_BANCARIO.md](./DOCUMENTACAO_EXTRATO_BANCARIO.md)** - Sistema de Extratos Bancários
  - Importação de extratos OFX
  - Conciliação automática e manual
  - Gestão de movimentações bancárias

- **[REFATORACAO_MOVIMENTACAO_BANCARIA.md](./REFATORACAO_MOVIMENTACAO_BANCARIA.md)** - Refatoração de Movimentações Bancárias
  - Nova arquitetura de movimentações
  - Diferenciação entre lançamentos automáticos e manuais
  - Sistema de conciliação

- **[ANALISE_CONTAS_RECEBER.md](./ANALISE_CONTAS_RECEBER.md)** - Sistema de Contas a Receber
  - Análise da implementação
  - Estrutura de dados
  - Relacionamentos entre entidades

### Validações e Testes

- **[VALIDACAO_CONCILIACAO_MANUAL.md](./VALIDACAO_CONCILIACAO_MANUAL.md)** - Validação de Conciliação Manual
  - Testes de conciliação de lançamentos
  - Casos de uso e cenários validados
  - Resultados dos testes

- **[VALIDACAO_LANCAMENTOS_MANUAIS.md](./VALIDACAO_LANCAMENTOS_MANUAIS.md)** - Validação de Lançamentos Manuais
  - Criação e gestão de lançamentos manuais
  - Testes implementados
  - Casos de borda

- **[VALIDACAO_RELATORIOS_MOVIMENTACAO_BANCARIA.md](./VALIDACAO_RELATORIOS_MOVIMENTACAO_BANCARIA.md)** - Validação de Relatórios
  - Testes de geração de relatórios
  - Validação de cálculos e saldos
  - Exportação de dados

- **[RESUMO_IMPLEMENTACAO.md](./RESUMO_IMPLEMENTACAO.md)** - Resumo da Implementação de Testes
  - Status geral do projeto
  - Critérios de aceite
  - Próximos passos

## 🚀 Quick Start

Para começar a desenvolver:

1. Consulte o arquivo principal [README.md](../README.md) na raiz do projeto para configuração inicial
2. Revise [CLAUDE.md](../CLAUDE.md) para entender a arquitetura e padrões do projeto
3. Consulte [API.md](./API.md) para detalhes dos endpoints
4. Veja [DOCUMENTACAO_TESTES.md](./DOCUMENTACAO_TESTES.md) para rodar os testes

## 📊 Status do Projeto

- **Testes**: 299 passando / 362 total
- **Suites**: 17 passando / 24 total
- **Cobertura**: Testes unitários, integração e E2E implementados

## 🔗 Links Úteis

- Swagger UI: `http://localhost:3000/api` (após iniciar a aplicação)
- Repositório: [GitHub](https://github.com/LucasReisVillasBoas/financeiro-api)

## 📝 Convenções de Documentação

- Arquivos em MAIÚSCULAS seguem o padrão do projeto
- Documentações de validação começam com `VALIDACAO_`
- Documentações técnicas começam com `DOCUMENTACAO_`
- Análises e refatorações descrevem implementações específicas
