import * as assert from 'assert';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

export function getEnvOrThrow(envName: string): string {
  const env = process.env[envName];
  assert.ok(env, `Missing environment variable ${envName}`);
  return env;
}

export function getEnvOrDefault(envName: string, defaultValue: string): string {
  return process.env[envName] ?? defaultValue;
}

export const PORT_NUMBER = getEnvOrDefault('PORT_NUMBER', '3000');

export const DATABASE_NAME = getEnvOrThrow('DATABASE_NAME');
export const DATABASE_USER = getEnvOrThrow('DATABASE_USER');
export const DATABASE_PASSWORD = getEnvOrThrow('DATABASE_PASSWORD');
export const JWT_SECRET = getEnvOrThrow('JWT_SECRET');
export const JWT_EXPIRES_IN = getEnvOrDefault('JWT_EXPIRES_IN', '3600s');
export const JWT_ISSUER = getEnvOrDefault('JWT_ISSUER', 'meu-app');
