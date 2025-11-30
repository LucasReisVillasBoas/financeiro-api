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

  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    retention: {
      daily: {
        enabled: process.env.BACKUP_DAILY_ENABLED !== 'false',
        retentionDays: parseInt(process.env.BACKUP_DAILY_RETENTION_DAYS, 10) || 30,
      },
      weekly: {
        enabled: process.env.BACKUP_WEEKLY_ENABLED !== 'false',
        retentionWeeks: parseInt(process.env.BACKUP_WEEKLY_RETENTION_WEEKS, 10) || 12,
        dayOfWeek: parseInt(process.env.BACKUP_WEEKLY_DAY, 10) || 0, // 0 = Domingo
      },
      monthly: {
        enabled: process.env.BACKUP_MONTHLY_ENABLED !== 'false',
        retentionMonths: parseInt(process.env.BACKUP_MONTHLY_RETENTION_MONTHS, 10) || 12,
        dayOfMonth: parseInt(process.env.BACKUP_MONTHLY_DAY, 10) || 1,
      },
    },
    storage: {
      local: {
        enabled: process.env.BACKUP_LOCAL_ENABLED !== 'false',
        path: process.env.BACKUP_LOCAL_PATH || './backups',
      },
      s3: {
        enabled: process.env.BACKUP_S3_ENABLED === 'true',
        bucket: process.env.BACKUP_S3_BUCKET,
        region: process.env.BACKUP_S3_REGION || 'us-east-1',
        accessKeyId: process.env.BACKUP_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.BACKUP_S3_SECRET_ACCESS_KEY,
      },
    },
    compression: {
      enabled: process.env.BACKUP_COMPRESSION_ENABLED !== 'false',
      level: parseInt(process.env.BACKUP_COMPRESSION_LEVEL, 10) || 6,
    },
  },
});
