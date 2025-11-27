import * as Joi from 'joi';

/**
 * Schema de validação para variáveis de ambiente
 *
 * Garante que todas as variáveis obrigatórias estejam definidas
 * e que valores tenham formato correto antes da aplicação iniciar.
 */
export const envValidationSchema = Joi.object({
  // Configuração de Porta
  PORT_NUMBER: Joi.number().default(3000),

  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database Configuration
  DATABASE_NAME: Joi.string().required().messages({
    'any.required': 'DATABASE_NAME é obrigatório',
    'string.empty': 'DATABASE_NAME não pode estar vazio',
  }),
  DATABASE_USER: Joi.string().required().messages({
    'any.required': 'DATABASE_USER é obrigatório',
    'string.empty': 'DATABASE_USER não pode estar vazio',
  }),
  DATABASE_PASSWORD: Joi.string().required().min(8).messages({
    'any.required': 'DATABASE_PASSWORD é obrigatório',
    'string.empty': 'DATABASE_PASSWORD não pode estar vazio',
    'string.min': 'DATABASE_PASSWORD deve ter no mínimo 8 caracteres',
  }),
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),

  // JWT Configuration
  JWT_SECRET: Joi.string().required().min(32).messages({
    'any.required': 'JWT_SECRET é obrigatório',
    'string.empty': 'JWT_SECRET não pode estar vazio',
    'string.min': 'JWT_SECRET deve ter no mínimo 32 caracteres para segurança',
  }),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_ISSUER: Joi.string().default('financeiro-api'),

  // Encryption Configuration
  ENCRYPTION_KEY: Joi.string().required().length(64).hex().messages({
    'any.required':
      'ENCRYPTION_KEY é obrigatória para criptografar dados sensíveis',
    'string.empty': 'ENCRYPTION_KEY não pode estar vazia',
    'string.length':
      'ENCRYPTION_KEY deve ter exatamente 64 caracteres hexadecimais (32 bytes)',
    'string.hex': 'ENCRYPTION_KEY deve conter apenas caracteres hexadecimais (0-9, a-f)',
  }),

  // HTTPS/SSL Configuration
  ENABLE_HTTPS: Joi.boolean().default(false),
  SSL_CERT_PATH: Joi.string().when('ENABLE_HTTPS', {
    is: true,
    then: Joi.required().messages({
      'any.required':
        'SSL_CERT_PATH é obrigatório quando ENABLE_HTTPS=true',
    }),
    otherwise: Joi.optional(),
  }),
  SSL_KEY_PATH: Joi.string().when('ENABLE_HTTPS', {
    is: true,
    then: Joi.required().messages({
      'any.required':
        'SSL_KEY_PATH é obrigatório quando ENABLE_HTTPS=true',
    }),
    otherwise: Joi.optional(),
  }),

  // CORS Configuration
  CORS_ORIGIN: Joi.string().default('http://localhost:3001'),
  CORS_CREDENTIALS: Joi.boolean().default(true),

  // Secrets Management (opcional para integração com serviços externos)
  USE_SECRETS_MANAGER: Joi.boolean().default(false),
  AWS_REGION: Joi.string().when('USE_SECRETS_MANAGER', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SECRETS_MANAGER_SECRET_NAME: Joi.string().when('USE_SECRETS_MANAGER', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

/**
 * Valida variáveis de ambiente no startup da aplicação
 * Lança erro se alguma variável obrigatória estiver faltando ou inválida
 */
export function validateEnv(config: Record<string, unknown>) {
  const { error, value } = envValidationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true, // Permite outras variáveis não definidas no schema
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message).join(', ');
    throw new Error(`❌ Erro de validação de variáveis de ambiente: ${errors}`);
  }

  return value;
}
