/**
 * Configuração centralizada da aplicação
 *
 * Este módulo exporta todas as configurações carregadas de variáveis de ambiente
 * de forma tipada e validada.
 */
export default () => ({
  port: parseInt(process.env.PORT_NUMBER, 10) || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    name: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'financeiro-api',
  },

  https: {
    enabled: process.env.ENABLE_HTTPS === 'true',
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3003',
    credentials: process.env.CORS_CREDENTIALS !== 'false',
  },

  secretsManager: {
    enabled: process.env.USE_SECRETS_MANAGER === 'true',
    awsRegion: process.env.AWS_REGION,
    secretName: process.env.SECRETS_MANAGER_SECRET_NAME,
  },
});
