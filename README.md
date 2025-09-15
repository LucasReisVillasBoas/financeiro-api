📌 Financeiro API

API desenvolvida em NestJS + MikroORM + PostgreSQL para gerenciamento financeiro.

🚀 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

Node.js 24.5.0

npm 11.5.1

PostgreSQL
 (pode usar o DBeaver
 para gerenciar o banco)

VS Code
 (IDE recomendada)

⚙️ Configuração do Git

Antes de clonar, configure seu nome e email no Git:

git config --global user.name "Seu Nome"
git config --global user.email "seuemail@example.com"

📥 Clonando o projeto
git clone https://github.com/LucasReisVillasBoas/financeiro-api.git
cd financeiro-api

🛠️ Configuração do ambiente

Crie um arquivo .env na raiz do projeto com as variáveis de conexão ao banco:

DATABASE_NAME='my-personal-db'
DATABASE_USER='postgres'
DATABASE_PASSWORD='postgres123'


Crie o banco local no PostgreSQL (via DBeaver ou terminal):

CREATE DATABASE "my-personal-db";

📦 Instalando dependências
npm install

▶️ Rodando a aplicação

Modo desenvolvimento:

npm run start:dev


Modo produção:

npm run build
npm run start:prod

📚 Documentação da API

Acesse o Swagger após subir a aplicação:

👉 http://localhost:3000/api