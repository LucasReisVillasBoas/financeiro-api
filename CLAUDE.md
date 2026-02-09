# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant financial management API (NestJS 10 + MikroORM 6 + PostgreSQL). Manages accounts payable/receivable, bank accounts/transactions, chart of accounts, payment settlements, and financial reports (DRE, cash flow). All financial values and sensitive bank data are encrypted at rest with AES-256-GCM.

## Development Commands

```bash
npm run start:dev          # Dev mode with watch (default port 3002)
npm run start:debug        # Debug mode with watch
npm run build && npm run start:prod  # Production

npm run migration:create   # Create migration
npm run migration:up       # Run pending migrations
npm run migration:down     # Rollback last migration

npm test                   # All unit tests
npm test -- --testPathPattern=plano-contas  # Run tests for a specific module
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # E2E tests

npm run lint               # ESLint with auto-fix
npm run format             # Prettier
```

Swagger UI: `http://localhost:3002/api` | OpenAPI JSON: `/api-json` | YAML: `/api-yaml`

## Architecture

### Request Flow (all authenticated endpoints)

```
Request → AuthMiddleware → CsrfGuard → EmpresaGuard → PermissionsGuard → Controller → Service
```

- **AuthMiddleware** (`src/middlewares/auth.middleware.ts`): Validates JWT, injects `req.user` and `req.userEmpresas` (array of `{empresaId, clienteId, isFilial, sedeId}`). Excluded routes: `/auth/login`, `POST /usuario/cadastro`, `POST /empresas`, `GET /cep/*`.
- **EmpresaGuard** (`src/auth/empresa.guard.ts`): Global guard. Validates user has access to the empresa in params/body (`empresaId`, `empresa_id`, `cliente_id`). Supports sede/filial hierarchy. Skip with `@SetMetadata('skipEmpresaValidation', true)`.
- **PermissionsGuard** (`src/auth/permissions.guard.ts`): Checks granular permissions from user's profiles. Permissions are stored as JSONB in `Perfil.permissoes`: `{ "financeiro": ["criar", "editar", "listar"] }`. Multiple permissions in decorator use OR logic.

### Module Structure

Each domain module follows the same layout:
```
src/<module>/
  ├── <module>.module.ts       # Imports, controllers, providers, exports
  ├── <module>.controller.ts   # HTTP layer with guards and decorators
  ├── <module>.service.ts      # Business logic, audit logging
  ├── <module>.repository.ts   # Custom repository (when needed)
  └── dto/                     # Create/Update/Filter DTOs with class-validator
```

Entities live separately in `src/entities/<entity>/`. Every new entity must be registered in `src/config/mikro-orm.config.ts`.

### Key Decorators

```typescript
@CurrentUser()         // Extracts authenticated user from request
@CurrentEmpresas()     // Extracts user's empresas array
@CurrentCliente()      // Extracts current client info
@Roles('ADMIN')        // Role-based access (RolesGuard)
@Permissions({ module: 'financeiro', action: 'criar' })  // Granular permissions
// Shortcuts: @CanCreate('module'), @CanEdit('module'), @CanList('module'), @CanDelete('module'), @CanView('module')
```

### Entity Conventions

- All entities extend `DeafultEntity` (note: intentional misspelling in codebase) which provides `createdAt`/`updatedAt`
- IDs are UUIDs generated via `gen_random_uuid()`
- Multi-tenant isolation: entities have `empresa_id` and/or `cliente_id` foreign keys
- Soft delete pattern: `deletadoEm?: Date` field
- Cancellation: `canceladoEm?: Date` + `justificativaCancelamento?: string`
- Sensitive fields (bank data, financial values) use AES-256-GCM encryption via `EncryptionService`
- Encrypted format: `iv:encryptedData:authTag` (all base64)

### Controller Response Format

All controllers return a consistent shape:
```typescript
{
  message: string,        // Human-readable message in Portuguese
  statusCode: number,     // HTTP status code
  data?: any              // Response payload
}
```

### Service Patterns

Services inject repositories via `@InjectRepository(Entity)`, plus `AuditService` and `EntityManager`. Standard methods:
- `create(dto, userId, userEmail)` — create with audit log
- `findAll()` / `findByEmpresa(empresaId)` — list with soft-delete filter and tenant isolation
- `findOne(id)` — get by ID, throws `NotFoundException`
- `update(id, dto, userId, userEmail)` — update with change tracking and audit
- `softDelete(id)` — sets `deletadoEm` timestamp

Audit logging tracks before/after values for updates:
```typescript
await this.auditService.log({
  timestamp: new Date(),
  eventType: AuditEventType.OPERATION_NAME,
  severity: AuditSeverity.INFO,
  userId, userEmail, empresaId,
  success: true,
  details: { valoresAnteriores, valoresPosteriores, camposAlterados }
});
```

### Multi-Tenancy Query Pattern

Always filter by `empresa_id` for tenant isolation:
```typescript
await this.repository.find(
  { empresa_id: empresaId, deletadoEm: null },
  { populate: ['relatedEntity'] }
);
```

## Adding New Features

### New Module Checklist

1. Create entity in `src/entities/<name>/` extending `DeafultEntity`
2. Register entity in `src/config/mikro-orm.config.ts` entities array
3. Create migration: `npm run migration:create`
4. Create module directory `src/<name>/` with module, controller, service, and DTOs
5. Import module in `src/app.module.ts`
6. Apply guards: `@UseGuards(JwtAuthGuard, PermissionsGuard)` on controller
7. Use `@Permissions()` on each endpoint
8. Inject `AuditService` in service and log all significant operations
9. Filter queries by `empresa_id` for tenant isolation

### New Migration

```bash
npm run migration:create
```

- Add columns as NULLABLE first, populate defaults, then add NOT NULL constraint
- Always implement both `up()` and `down()`
- Naming: `Migration{YYYYMMDDHHMMSS}_description.ts`

## Environment Variables

Required (see `src/settings.ts` and `src/config/configuration.ts`):
```
DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, JWT_SECRET, ENCRYPTION_KEY
```

Optional: `PORT_NUMBER` (default 3002), `JWT_EXPIRES_IN` (default 7d), `CORS_ORIGIN` (default http://localhost:3003), `ENABLE_HTTPS`, `SSL_CERT_PATH`, `SSL_KEY_PATH`, backup config vars.

Generate encryption key: `openssl rand -hex 32`

## Domain-Specific Notes

### Payment Settlement (Baixa de Pagamento)

The most complex flow: validates payment against due date → calculates discounts/penalties → creates `MovimentacoesBancarias` → updates bank account balance (`saldo_atual`) → updates payable status and remaining balance (`saldo`) → creates `BaixaPagamento` record → audit logs everything. Supports partial payments and reversal (estorno).

### Chart of Accounts (Plano de Contas)

Hierarchical parent-child structure with `codigo` validation. Cannot delete accounts that have associated transactions. Types: RECEITA, DESPESA, CUSTO.

### Bank Statement Import (Extrato Bancario)

OFX file parsing via `banking` npm package with automatic reconciliation against existing `MovimentacoesBancarias`.

## Import Paths

Use absolute imports with `src/` prefix:
```typescript
import { Usuario } from 'src/entities/usuario/usuario.entity';
```
