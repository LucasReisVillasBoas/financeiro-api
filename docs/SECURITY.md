# 🔐 Guia de Segurança - Financeiro API

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Segurança de Senhas](#segurança-de-senhas)
3. [Gerenciamento de Secrets](#gerenciamento-de-secrets)
4. [HTTPS/TLS](#httpstls)
5. [Configuração de Desenvolvimento](#configuração-de-desenvolvimento)
6. [Deploy em Produção](#deploy-em-produção)
7. [Boas Práticas](#boas-práticas)
8. [Checklist de Segurança](#checklist-de-segurança)

---

## 🎯 Visão Geral

Esta API implementa múltiplas camadas de segurança para proteger dados sensíveis:

- ✅ **Hash de Senhas**: bcrypt com salt único
- ✅ **Autenticação JWT**: Tokens com expiração configurável
- ✅ **Validação de Variáveis de Ambiente**: Schema validation com Joi
- ✅ **HTTPS/TLS**: Suporte nativo para comunicação criptografada
- ✅ **CORS Configurável**: Proteção contra requisições não autorizadas
- ✅ **Auditoria**: Logs de todas as operações críticas

---

## 🔑 Segurança de Senhas

### Hash de Senhas

**Algoritmo**: bcrypt (bcryptjs)
**Implementação**: `src/usuario/usuario.service.ts`

```typescript
// Hash automático na criação
async create(dto: UsuarioCreateRequestDto) {
  usuario.senha = await this.hashPassword(dto.senha);
}

// Hash automático na atualização
async update(id: string, dto: UsuarioUpdateRequestDto) {
  if (senha) {
    usuario.senha = await this.hashPassword(senha);
  }
}
```

### Validação de Força

**Requisitos de Senha**:
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 dígito
- Pelo menos 1 caractere especial (@$!%*?&)

**Implementação**: `src/utils/auth.util.ts`

```typescript
export function validatePassword(password: string): boolean {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}
```

### Testes

- ✅ `test/usuario/usuario.service.spec.ts:150-175` - Hash na criação
- ✅ `test/usuario/usuario.service.spec.ts:213-234` - Hash na atualização
- ✅ `test/auth/auth.service.spec.ts:95-110` - Validação de senha incorreta

---

## 🔐 Gerenciamento de Secrets

### Desenvolvimento Local

Use arquivo `.env` para desenvolvimento:

```bash
# Copiar template
cp .env.example .env

# Editar com valores reais
nano .env
```

**⚠️ IMPORTANTE**:
- ❌ **NUNCA** commite o arquivo `.env` no Git
- ❌ **NUNCA** compartilhe senhas em texto plano
- ✅ Use `.env.example` como template sem valores reais

### Validação Automática

Todas as variáveis de ambiente são validadas no startup da aplicação:

**Arquivo**: `src/config/env.validation.ts`

```typescript
export const envValidationSchema = Joi.object({
  DATABASE_PASSWORD: Joi.string().required().min(8),
  JWT_SECRET: Joi.string().required().min(32),
  // ... outras validações
});
```

**Comportamento**:
- ❌ Se variável obrigatória estiver faltando: aplicação NÃO inicia
- ❌ Se valor for inválido: aplicação NÃO inicia
- ✅ Se tudo estiver correto: aplicação inicia normalmente

### Produção - Secrets Manager

#### AWS Secrets Manager

```bash
# Criar secret
aws secretsmanager create-secret \
  --name financeiro-api/prod \
  --secret-string '{
    "DATABASE_PASSWORD": "senha-forte-aqui",
    "JWT_SECRET": "jwt-secret-forte-aqui"
  }'

# Configurar .env
USE_SECRETS_MANAGER=true
AWS_REGION=us-east-1
SECRETS_MANAGER_SECRET_NAME=financeiro-api/prod
```

#### Outras Opções

- **HashiCorp Vault**: Secrets dinâmicos com rotação automática
- **Azure Key Vault**: Integração com Azure App Service
- **Google Secret Manager**: Para deploy no Google Cloud
- **Docker Secrets**: Para ambientes Docker Swarm

---

## 🌐 HTTPS/TLS

### Por Que HTTPS?

- 🔒 **Criptografia de dados** em trânsito
- 🛡️ **Proteção contra ataques** man-in-the-middle
- ✅ **Conformidade** com padrões de segurança (PCI-DSS, LGPD, etc.)
- 🔐 **Proteção de credenciais** (JWT tokens, senhas)

### Desenvolvimento Local

#### Opção 1: HTTP (Padrão)

```bash
# .env
ENABLE_HTTPS=false

# Iniciar aplicação
npm run start:dev

# Acesso: http://localhost:3000
```

#### Opção 2: HTTPS com Certificados Self-Signed

```bash
# 1. Gerar certificados
npm run generate:ssl

# 2. Habilitar HTTPS no .env
ENABLE_HTTPS=true
SSL_KEY_PATH=./ssl/server.key
SSL_CERT_PATH=./ssl/server.cert

# 3. Iniciar aplicação
npm run start:dev

# Acesso: https://localhost:3000
```

**⚠️ Avisos de Segurança no Navegador**:
- Certificados self-signed causam avisos no navegador
- Isso é **normal** em desenvolvimento
- Para aceitar: "Avançado" → "Continuar para localhost"

### Produção

#### Certificados Válidos

**NÃO use certificados self-signed em produção!**

Opções recomendadas:

1. **Let's Encrypt** (Gratuito)
   ```bash
   # Instalar certbot
   sudo apt-get install certbot

   # Obter certificado
   sudo certbot certonly --standalone -d api.seudominio.com

   # Configurar .env
   ENABLE_HTTPS=true
   SSL_KEY_PATH=/etc/letsencrypt/live/api.seudominio.com/privkey.pem
   SSL_CERT_PATH=/etc/letsencrypt/live/api.seudominio.com/fullchain.pem
   ```

2. **Reverse Proxy** (Nginx/Apache)

   Configuração recomendada:
   - HTTPS no Nginx/Apache (porta 443)
   - HTTP na aplicação NestJS (porta 3000)
   - Nginx faz SSL termination

   ```nginx
   server {
       listen 443 ssl http2;
       server_name api.seudominio.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header X-Forwarded-Proto https;
           proxy_set_header Host $host;
       }
   }
   ```

3. **Cloud Load Balancer**
   - AWS ALB/NLB: Gerencia SSL automaticamente
   - Google Cloud Load Balancer: Integra com Google-managed certificates
   - Azure Application Gateway: Gerencia certificados SSL

---

## 💻 Configuração de Desenvolvimento

### Passo a Passo

```bash
# 1. Clonar repositório
git clone <repo-url>
cd financeiro-api

# 2. Instalar dependências
npm install

# 3. Configurar .env
cp .env.example .env
nano .env

# Editar variáveis obrigatórias:
DATABASE_NAME=my_database
DATABASE_USER=postgres
DATABASE_PASSWORD=senha-forte-aqui
JWT_SECRET=$(openssl rand -base64 32)

# 4. (Opcional) Gerar certificados SSL
npm run generate:ssl

# 5. (Opcional) Habilitar HTTPS
ENABLE_HTTPS=true

# 6. Executar migrações
npm run migration:up

# 7. Iniciar aplicação
npm run start:dev
```

### Testes

```bash
# Rodar todos os testes
npm test

# Testes de segurança específicos
npm test -- --testNamePattern="password|hash|bcrypt"

# Cobertura
npm run test:cov
```

---

## 🚀 Deploy em Produção

### Checklist Pré-Deploy

- [ ] JWT_SECRET tem no mínimo 32 caracteres
- [ ] DATABASE_PASSWORD é forte (12+ caracteres)
- [ ] ENABLE_HTTPS=true
- [ ] Certificados SSL válidos configurados
- [ ] CORS_ORIGIN aponta para domínio de produção (HTTPS)
- [ ] USE_SECRETS_MANAGER=true (se aplicável)
- [ ] Secrets rotativos configurados
- [ ] Logs de auditoria habilitados
- [ ] Backup automático configurado
- [ ] Monitoramento de segurança ativo

### Variáveis de Ambiente - Produção

```bash
# Obrigatórias
NODE_ENV=production
DATABASE_NAME=prod_database
DATABASE_USER=prod_user
DATABASE_PASSWORD=<secret-forte-64-chars>
JWT_SECRET=<secret-forte-32-chars-min>
ENABLE_HTTPS=true
SSL_CERT_PATH=/etc/ssl/certs/api.cert
SSL_KEY_PATH=/etc/ssl/private/api.key
CORS_ORIGIN=https://app.seudominio.com

# Recomendadas
USE_SECRETS_MANAGER=true
AWS_REGION=us-east-1
SECRETS_MANAGER_SECRET_NAME=financeiro-api/prod
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Não copiar .env - usar variáveis de ambiente do sistema
EXPOSE 3000

CMD ["node", "dist/main"]
```

```bash
# Build
docker build -t financeiro-api .

# Run (passando variáveis de ambiente)
docker run -p 3000:3000 \
  -e DATABASE_NAME=prod_db \
  -e DATABASE_PASSWORD=<secret> \
  -e JWT_SECRET=<secret> \
  -e ENABLE_HTTPS=false \
  financeiro-api
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: v1
kind: Secret
metadata:
  name: financeiro-api-secrets
type: Opaque
data:
  database-password: <base64-encoded>
  jwt-secret: <base64-encoded>

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: financeiro-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: financeiro-api:latest
        env:
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: financeiro-api-secrets
              key: database-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: financeiro-api-secrets
              key: jwt-secret
```

---

## ✅ Boas Práticas

### Senhas

- ✅ Use senhas fortes com no mínimo 12 caracteres
- ✅ Combine letras maiúsculas, minúsculas, números e símbolos
- ✅ Use geradores de senhas (openssl, 1Password, LastPass)
- ❌ Nunca reutilize senhas entre ambientes
- ❌ Nunca compartilhe senhas em texto plano
- ✅ Rotacione senhas regularmente (trimestral)

### Secrets

- ✅ Use secrets managers em produção
- ✅ Rotacione secrets regularmente
- ✅ Limite acesso a secrets (RBAC)
- ❌ Nunca commite secrets no Git
- ❌ Nunca logue secrets em logs
- ❌ Nunca envie secrets por email/chat

### HTTPS

- ✅ Use HTTPS em produção SEMPRE
- ✅ Use certificados de CA válida (Let's Encrypt)
- ✅ Force redirecionamento HTTP → HTTPS
- ✅ Use HSTS (HTTP Strict Transport Security)
- ❌ Nunca use certificados self-signed em produção
- ❌ Nunca desabilite verificação de certificados

### Auditoria

- ✅ Logue todas as ações críticas
- ✅ Logue tentativas de login falhadas
- ✅ Logue alterações de senha
- ✅ Logue acessos a dados sensíveis
- ✅ Configure alertas para atividades suspeitas
- ✅ Mantenha logs por no mínimo 90 dias

---

## 📋 Checklist de Segurança

### Desenvolvimento

- [x] Hash de senhas com bcrypt implementado
- [x] Validação de força de senha implementada
- [x] Autenticação JWT funcionando
- [x] Variáveis de ambiente validadas
- [x] .env no .gitignore
- [x] Testes de segurança passando
- [x] HTTPS opcional para desenvolvimento

### Staging/QA

- [ ] Secrets diferentes de produção
- [ ] HTTPS habilitado
- [ ] Certificados válidos (ou self-signed aceitável)
- [ ] Testes de penetração executados
- [ ] Scan de vulnerabilidades executado
- [ ] CORS configurado corretamente

### Produção

- [ ] Secrets gerenciados por secrets manager
- [ ] HTTPS obrigatório com certificados válidos
- [ ] HSTS habilitado
- [ ] Rotação automática de secrets configurada
- [ ] Backup automático funcionando
- [ ] Monitoramento de segurança ativo
- [ ] Logs de auditoria centralizados
- [ ] Plano de resposta a incidentes documentado
- [ ] Compliance verificado (LGPD, PCI-DSS, etc.)

---

## 🆘 Suporte e Incidentes de Segurança

### Reportar Vulnerabilidade

Se você descobriu uma vulnerabilidade de segurança:

1. ❌ **NÃO** abra uma issue pública
2. ✅ Envie email para: security@seudominio.com
3. ✅ Inclua: descrição detalhada, passos para reproduzir, impacto
4. ⏱️ Aguarde resposta em até 48 horas

### Contatos

- **Email de Segurança**: security@seudominio.com
- **Equipe de DevOps**: devops@seudominio.com
- **Emergências**: +55 (11) 9xxxx-xxxx

---

## 📚 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [bcrypt Documentation](https://www.npmjs.com/package/bcryptjs)
- [Let's Encrypt](https://letsencrypt.org/)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)

---

**Última Atualização**: 2025-01-25
**Versão**: 1.0.0
