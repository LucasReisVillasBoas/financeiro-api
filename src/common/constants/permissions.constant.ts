/**
 * Sistema de Permissões Hierárquicas
 *
 * Níveis (cada nível inclui os anteriores):
 * 1. VISUALIZAR - apenas visualizar
 * 2. EDITAR - visualizar + editar
 * 3. CRIAR - visualizar + editar + criar
 * 4. EXCLUIR - visualizar + editar + criar + excluir
 * 5. COMPLETA - todas as permissões
 */

// Níveis de permissão
export enum PermissionLevel {
  VISUALIZAR = 'visualizar',
  EDITAR = 'editar',
  CRIAR = 'criar',
  EXCLUIR = 'excluir',
  COMPLETA = 'completa',
}

// Ações disponíveis no sistema
export const PERMISSION_ACTIONS = {
  VISUALIZAR: 'visualizar',
  LISTAR: 'listar',
  EDITAR: 'editar',
  CRIAR: 'criar',
  EXCLUIR: 'excluir',
  EXPORTAR: 'exportar',
} as const;

// Módulos do sistema
export const SYSTEM_MODULES = [
  'empresas',
  'financeiro',
  'usuarios',
  'relatorios',
  'contatos',
  'cidades',
  'pessoas',
  'auditoria',
] as const;

export type SystemModule = (typeof SYSTEM_MODULES)[number];

/**
 * Hierarquia de permissões - cada nível inclui as ações dos níveis anteriores
 */
export const PERMISSION_HIERARCHY: Record<PermissionLevel, string[]> = {
  [PermissionLevel.VISUALIZAR]: ['visualizar', 'listar'],
  [PermissionLevel.EDITAR]: ['visualizar', 'listar', 'editar'],
  [PermissionLevel.CRIAR]: ['visualizar', 'listar', 'editar', 'criar'],
  [PermissionLevel.EXCLUIR]: ['visualizar', 'listar', 'editar', 'criar', 'excluir'],
  [PermissionLevel.COMPLETA]: ['visualizar', 'listar', 'editar', 'criar', 'excluir', 'exportar'],
};

/**
 * Retorna as ações para um nível de permissão
 */
export function getActionsForLevel(level: PermissionLevel): string[] {
  return PERMISSION_HIERARCHY[level] || [];
}

/**
 * Verifica se um nível de permissão inclui uma ação específica
 */
export function levelIncludesAction(level: PermissionLevel, action: string): boolean {
  return PERMISSION_HIERARCHY[level]?.includes(action) || false;
}

/**
 * Gera permissões completas para TODOS os módulos (Master Admin)
 */
export function generateMasterAdminPermissions(): Record<string, string[]> {
  const permissions: Record<string, string[]> = {};
  for (const module of SYSTEM_MODULES) {
    permissions[module] = [...PERMISSION_HIERARCHY[PermissionLevel.COMPLETA]];
  }
  return permissions;
}

/**
 * Gera permissões para um módulo específico com um nível
 */
export function generateModulePermissions(
  module: string,
  level: PermissionLevel,
): string[] {
  return [...PERMISSION_HIERARCHY[level]];
}

/**
 * Gera permissões para múltiplos módulos com níveis específicos
 */
export function generatePermissions(
  modulePermissions: Record<string, PermissionLevel>,
): Record<string, string[]> {
  const permissions: Record<string, string[]> = {};
  for (const [module, level] of Object.entries(modulePermissions)) {
    permissions[module] = [...PERMISSION_HIERARCHY[level]];
  }
  return permissions;
}

/**
 * Permissões do Master Admin (criador da conta)
 * Todas as permissões em todos os módulos
 */
export const MASTER_ADMIN_PERMISSIONS = generateMasterAdminPermissions();

/**
 * Labels para exibição no frontend
 */
export const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  [PermissionLevel.VISUALIZAR]: 'Visualizar',
  [PermissionLevel.EDITAR]: 'Editar',
  [PermissionLevel.CRIAR]: 'Criar',
  [PermissionLevel.EXCLUIR]: 'Excluir',
  [PermissionLevel.COMPLETA]: 'Completa',
};

/**
 * Descrições para exibição no frontend
 */
export const PERMISSION_LEVEL_DESCRIPTIONS: Record<PermissionLevel, string> = {
  [PermissionLevel.VISUALIZAR]: 'Apenas visualizar e listar registros',
  [PermissionLevel.EDITAR]: 'Visualizar e editar registros existentes',
  [PermissionLevel.CRIAR]: 'Visualizar, editar e criar novos registros',
  [PermissionLevel.EXCLUIR]: 'Visualizar, editar, criar e excluir registros',
  [PermissionLevel.COMPLETA]: 'Acesso total ao módulo (inclui exportação)',
};

/**
 * Labels dos módulos para exibição
 */
export const MODULE_LABELS: Record<string, string> = {
  empresas: 'Empresas',
  financeiro: 'Financeiro',
  usuarios: 'Usuários',
  relatorios: 'Relatórios',
  contatos: 'Contatos',
  cidades: 'Cidades',
  pessoas: 'Pessoas/Clientes',
  auditoria: 'Auditoria',
};
