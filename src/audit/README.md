# Sistema de Auditoria

## Visão Geral

O módulo de auditoria fornece um sistema extensível para registrar eventos de segurança, autenticação e autorização na aplicação. Atualmente implementado como um **esqueleto funcional** que registra eventos no console, mas projetado para ser facilmente estendido para armazenar logs em diferentes destinos.

## Status Atual

✅ **Implementado:**
- Serviço de auditoria com interface completa
- Integração com guards de autenticação e autorização
- Logs de tentativas de login (sucesso e falha)
- Logs de tentativas de acesso negado (RBAC e multi-tenancy)
- Captura de metadados (IP, User-Agent, timestamp)
- Testes unitários e e2e

⚠️ **Pendente (Decisão de Negócio):**
- Definição do destino de armazenamento dos logs
- Configuração de retenção de logs
- Dashboard/interface para visualização de logs

## Arquitetura

```
src/audit/
├── audit.service.ts    # Serviço principal de auditoria
├── audit.module.ts     # Módulo global de auditoria
└── README.md          # Esta documentação
```

O módulo é marcado como `@Global()`, tornando o `AuditService` disponível em toda a aplicação sem necessidade de importação explícita.

## Eventos Registrados

### Autenticação
- `LOGIN_SUCCESS` - Login bem-sucedido
- `LOGIN_FAILED` - Tentativa de login falhada
- `TOKEN_EXPIRED` - Token JWT expirado
- `TOKEN_INVALID` - Token JWT inválido

### Autorização
- `ACCESS_DENIED_NO_ROLE` - Acesso negado por falta de perfil adequado
- `ACCESS_DENIED_NO_EMPRESA` - Usuário sem acesso a nenhuma empresa
- `ACCESS_DENIED_WRONG_EMPRESA` - Tentativa de acesso a empresa não autorizada
- `ACCESS_DENIED_WRONG_CLIENTE` - Tentativa de acesso a cliente não autorizado
- `ACCESS_GRANTED` - Acesso concedido com sucesso

### Operações (Estrutura pronta para uso futuro)
- `EMPRESA_CREATED`, `EMPRESA_UPDATED`, `EMPRESA_DELETED`, `EMPRESA_ACCESSED`
- `USUARIO_CREATED`, `USUARIO_UPDATED`, `USUARIO_DELETED`, `USUARIO_PERFIL_CHANGED`
- `PERFIL_CREATED`, `PERFIL_UPDATED`, `PERFIL_DELETED`

## Estrutura de Log

Cada evento registrado contém:

```typescript
{
  timestamp: Date;           // Data/hora do evento
  eventType: AuditEventType; // Tipo do evento (ex: LOGIN_FAILED)
  severity: AuditSeverity;   // INFO, WARNING, ERROR, CRITICAL
  userId?: string;           // ID do usuário (quando disponível)
  userEmail?: string;        // Email do usuário
  empresaId?: string;        // ID da empresa relacionada
  clienteId?: string;        // ID do cliente relacionado
  resource?: string;         // Recurso acessado (ex: /empresas/123)
  action?: string;           // Ação HTTP (GET, POST, etc)
  ipAddress?: string;        // Endereço IP da requisição
  userAgent?: string;        // User Agent do navegador
  requestId?: string;        // ID da requisição (para correlação)
  details?: Record<string, any>; // Detalhes adicionais específicos do evento
  success: boolean;          // Se a operação foi bem-sucedida
  errorMessage?: string;     // Mensagem de erro (quando aplicável)
}
```

## Uso

### Registro Automático

Os guards já registram eventos automaticamente:

```typescript
// RolesGuard - registra acesso negado por falta de perfil
await this.auditService.logAccessDeniedNoRole(
  userId,
  userEmail,
  requiredRoles,
  userRoles,
  resource,
  action,
  ipAddress
);

// EmpresaGuard - registra acesso negado por empresa/cliente inválido
await this.auditService.logAccessDeniedWrongEmpresa(
  userId,
  userEmail,
  empresaId,
  userEmpresasIds,
  resource,
  action,
  ipAddress
);
```

### Registro Manual

Para registrar eventos customizados:

```typescript
import { AuditService, AuditEventType, AuditSeverity } from '../audit/audit.service';

constructor(private readonly auditService: AuditService) {}

async minhaOperacao(usuarioId: string, empresaId: string) {
  // ... lógica ...

  await this.auditService.log({
    timestamp: new Date(),
    eventType: AuditEventType.EMPRESA_UPDATED,
    severity: AuditSeverity.INFO,
    userId: usuarioId,
    empresaId: empresaId,
    resource: '/empresas/' + empresaId,
    action: 'PUT',
    success: true,
    details: {
      camposAlterados: ['razao_social', 'cnpj']
    }
  });
}
```

### Métodos Auxiliares

```typescript
// Extrair IP da requisição
const ipAddress = AuditService.extractIpAddress(request);

// Extrair User Agent
const userAgent = AuditService.extractUserAgent(request);
```

## Opções de Armazenamento

O serviço está pronto para ser estendido com diferentes backends de armazenamento. Para implementar um novo destino:

### 1. Implementar a Interface AuditLogStorage

```typescript
export class DatabaseAuditStorage implements AuditLogStorage {
  constructor(private readonly em: EntityManager) {}

  async save(entry: AuditLogEntry): Promise<void> {
    const auditLog = this.em.create(AuditLog, entry);
    await this.em.persistAndFlush(auditLog);
  }

  async findByUserId(userId: string, limit = 100): Promise<AuditLogEntry[]> {
    return await this.em.find(AuditLog, { userId }, { limit });
  }

  // ... outros métodos ...
}
```

### 2. Injetar no AuditService

```typescript
@Injectable()
export class AuditService {
  constructor(
    @Inject('AUDIT_STORAGE') private storage: AuditLogStorage
  ) {}

  async log(entry: AuditLogEntry): Promise<void> {
    console.log('[AUDIT]', this.formatLogEntry(entry)); // Manter por segurança
    await this.storage.save(entry); // Persistir
  }
}
```

### 3. Opções Recomendadas

#### **Banco de Dados (PostgreSQL)**
- ✅ Pros: Simples, integrado, suporta queries complexas
- ❌ Contras: Pode impactar performance do banco principal
- **Recomendação**: Bom para começar, usar tabela separada

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  user_id UUID,
  user_email VARCHAR(255),
  empresa_id UUID,
  cliente_id UUID,
  resource VARCHAR(500),
  action VARCHAR(10),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_empresa_id ON audit_logs(empresa_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
```

#### **Elasticsearch**
- ✅ Pros: Otimizado para logs, busca rápida, visualização (Kibana)
- ❌ Contras: Infraestrutura adicional
- **Recomendação**: Melhor opção para produção com alto volume

```typescript
import { ElasticsearchService } from '@nestjs/elasticsearch';

async save(entry: AuditLogEntry): Promise<void> {
  await this.elasticsearchService.index({
    index: 'audit-logs',
    body: entry
  });
}
```

#### **CloudWatch Logs (AWS)**
- ✅ Pros: Integrado AWS, escalável, sem gerenciamento
- ❌ Contras: Vendor lock-in, custo por volume
- **Recomendação**: Ideal se já usa AWS

```typescript
import { CloudWatchLogs } from 'aws-sdk';

async save(entry: AuditLogEntry): Promise<void> {
  await this.cloudWatch.putLogEvents({
    logGroupName: '/app/audit',
    logStreamName: 'security',
    logEvents: [{
      timestamp: entry.timestamp.getTime(),
      message: JSON.stringify(entry)
    }]
  });
}
```

#### **Arquivo Local (para desenvolvimento)**
- ✅ Pros: Sem dependências
- ❌ Contras: Não escalável, difícil busca
- **Recomendação**: Apenas dev/testes

## Integração Atual

### Guards
- ✅ `RolesGuard` - Registra tentativas de acesso negado por perfil
- ✅ `EmpresaGuard` - Registra tentativas de acesso a empresa/cliente não autorizado
- ✅ `AuthService` - Registra tentativas de login (sucesso e falha)

### AuthMiddleware
⚠️ **TODO**: Adicionar logs de token inválido/expirado:

```typescript
// Em src/middlewares/auth.middleware.ts
catch (error) {
  await this.auditService.logInvalidToken(
    error.name === 'TokenExpiredError' ? 'expired' : 'invalid',
    AuditService.extractIpAddress(req),
    AuditService.extractUserAgent(req)
  );
  return res.status(401).json({ message: 'Unauthorized' });
}
```

## Testes

### Testes Unitários
```bash
npm test test/auth/roles.guard.spec.ts
npm test test/auth/empresa.guard.spec.ts
```

### Testes E2E
```bash
npm test test/auth/multi-tenancy.e2e-spec.ts
```

**Nota**: Os testes e2e estão criados mas precisam de uma base de dados de teste configurada para rodar completamente.

## Compliance e Segurança

### LGPD / GDPR
- ✅ Logs incluem apenas dados necessários para segurança
- ⚠️ **TODO**: Implementar anonimização após período de retenção
- ⚠️ **TODO**: Endpoint para solicitação de dados do usuário

### Retenção de Logs
**Recomendação**:
- Logs de segurança (acesso negado): 1 ano
- Logs de login: 90 dias
- Logs operacionais: 30 dias

### Alertas
**Próximos passos**:
- Alertar após N tentativas de login falhadas
- Alertar tentativas de acesso cross-tenant
- Dashboard de eventos de segurança em tempo real

## Roadmap

### Fase 1 (Atual) ✅
- [x] Estrutura base do serviço
- [x] Integração com guards
- [x] Logs no console
- [x] Testes unitários

### Fase 2 (Próximo)
- [ ] Definir destino de armazenamento
- [ ] Implementar storage escolhido
- [ ] Configurar retenção de logs
- [ ] Adicionar logs no AuthMiddleware

### Fase 3 (Futuro)
- [ ] Dashboard de auditoria
- [ ] Alertas automáticos
- [ ] Exportação de logs
- [ ] Relatórios de conformidade

## Contato

Para dúvidas sobre implementação ou decisões de armazenamento, consultar a equipe de infraestrutura/segurança.
