# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a financial management API built with NestJS, MikroORM, and PostgreSQL. The API manages multi-tenant financial operations including accounts payable/receivable, bank accounts, bank transactions, chart of accounts, and financial statements (DRE).

## Technology Stack

- **Framework**: NestJS 10.x
- **ORM**: MikroORM 6.x with PostgreSQL driver
- **Database**: PostgreSQL
- **Authentication**: JWT with passport-jwt
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## Development Commands

### Running the Application
```bash
npm run start:dev          # Development mode with watch
npm run start:debug        # Debug mode with watch
npm run build              # Build for production
npm run start:prod         # Run production build
```

### Database Operations
```bash
npm run migration:create   # Create a new migration
npm run migration:up       # Run pending migrations
npm run migration:down     # Rollback last migration
npm run seeder:run         # Run database seeders
```

### Testing
```bash
npm test                   # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests
npm run test:debug         # Debug tests with Node inspector
```

### Code Quality
```bash
npm run lint               # Lint and fix code
npm run format             # Format code with Prettier
```

## Architecture

### Multi-Tenancy System

The application implements a sophisticated multi-tenancy architecture:

1. **AuthMiddleware** (`src/middlewares/auth.middleware.ts`): Validates JWT tokens and injects `user` and `userEmpresas` into the request object. The `userEmpresas` array contains all companies the user has access to.

2. **EmpresaGuard** (`src/auth/empresa.guard.ts`): Enforces company-level access control. Validates that users can only access data from companies they're associated with. Checks both `empresaId` and `cliente_id` in request parameters/body.

3. **RolesGuard** (`src/auth/roles.guard.ts`): Enforces role-based access control (RBAC). Uses the `@Roles()` decorator to restrict endpoints to specific user profiles.

4. **Request Flow**: Most authenticated endpoints follow this pattern:
   ```
   Request → AuthMiddleware → EmpresaGuard → RolesGuard → Controller
   ```

### Entity Architecture

- **Base Entity**: All entities extend `DeafultEntity` which provides `createdAt` and `updatedAt` timestamps
- **Multi-tenant Relations**: Most entities have `empresa_id` or `cliente_id` foreign keys for tenant isolation
- **Audit Trail**: The `Auditoria` entity tracks authentication, authorization, and business operation events

### Key Business Entities

- **Empresa**: Companies/tenants with support for headquarters (sede) and branches (filiais)
- **Usuario**: Users with many-to-many relationships to companies via `UsuarioEmpresaFilial`
- **ContasPagar/ContasReceber**: Accounts payable and receivable with installment support
- **BaixaPagamento**: Payment settlements with support for partial payments, discounts, and penalties
- **PlanoContas**: Chart of accounts following standard accounting structure
- **MovimentacoesBancarias**: Bank transactions linked to accounts payable/receivable
- **ExtratoBancario**: Bank statements with automatic import and reconciliation support

### Service Layer Patterns

Services typically inject repositories and other services. Complex operations like payment settlements involve multiple entities:

- `ContasPagarService` handles account creation, installment generation, and status management
- `BaixaPagamentoService` handles payment processing with automatic bank transaction creation
- `MovimentacoesBancariasService` manages bank account balance updates
- `AuditService` is injected across services to log all significant operations

## Important Conventions

### Authentication & Authorization

- Unauthenticated routes: `/auth/login`, `/usuario/cadastro`, `POST /empresas`
- All other routes require JWT authentication
- Use `@CurrentUser()` decorator to access the authenticated user
- Use `@Roles('ADMIN', 'MANAGER')` decorator for role-based restrictions
- The `EmpresaGuard` is applied globally; use `@SetMetadata('skipEmpresaValidation', true)` to bypass it

### API Documentation

- Swagger is available at `http://localhost:3000/api` after starting the app
- All endpoints use Bearer token authentication
- DTOs are documented with class-validator decorators which appear in Swagger

### Database Migrations

- Migrations are in `src/database/migrations/`
- MikroORM config is in `src/config/mikro-orm.config.ts`
- All entities must be registered in the config file
- Migration naming: `Migration{YYYYMMDDHHMMSS}_description.ts`

### Testing Strategy

- Unit tests use `.spec.ts` suffix and are co-located with source files
- E2E tests use `.e2e-spec.ts` suffix and live in `test/` directory
- Integration tests validate complex workflows (e.g., payment settlements, multi-entity operations)
- Tests extensively mock repositories and services

### Import Path Aliases

- Use absolute imports like `import { Usuario } from 'src/entities/usuario/usuario.entity'`
- TypeScript paths are configured in `tsconfig.json` with base `./`

## Environment Configuration

Required environment variables (see `.env.example`):
```
DATABASE_NAME=database-name
DATABASE_USER=database-user
DATABASE_PASSWORD=database-password
JWT_SECRET=your_super_secret_key
PORT_NUMBER=3000
```

## Common Patterns

### Repository Pattern
```typescript
@InjectRepository(EntityName)
private readonly repository: EntityNameRepository
```

### Query with Multi-Tenancy
```typescript
// Filter by empresa_id for tenant isolation
await this.repository.find(
  { empresa_id: empresaId },
  { populate: ['relatedEntity'] }
);
```

### Audit Logging
```typescript
await this.auditService.log(
  AuditEventType.OPERATION_NAME,
  userId,
  { /* context data */ },
  AuditSeverity.INFO,
  empresaId
);
```

### Error Handling
- Use NestJS built-in exceptions: `NotFoundException`, `BadRequestException`, `ForbiddenException`
- Business logic validations throw appropriate HTTP exceptions
- Guards throw `ForbiddenException` for authorization failures

## Domain-Specific Notes

### Payment Settlement (Baixa de Pagamento)

The payment settlement system is complex and involves:
1. Validating the payment date against the due date
2. Calculating discounts (if paid early) and penalties (if paid late)
3. Creating bank transactions (`MovimentacoesBancarias`)
4. Updating account status and remaining balances
5. Supporting partial payments and multiple settlements per account
6. Audit logging of all operations

### Bank Statement Import

The system supports importing bank statements (OFX format) via the `banking` npm package and automatically reconciling them with existing transactions.

### Chart of Accounts (Plano de Contas)

- Follows hierarchical structure with parent-child relationships
- Validation prevents deletion of accounts with existing transactions
- Supports both expense and revenue classification
