import type { UsuarioPerfil } from '../entities/usuario-perfil/usuario-perfil.entity';

export function sanitizeUsuarioPerfilResponse(
  usuarioPerfil: UsuarioPerfil,
): any {
  if (!usuarioPerfil) return usuarioPerfil;

  const { usuario, empresa, perfil, ...rest } = usuarioPerfil;

  return {
    ...rest,
    usuario: usuario?.id,
    empresa: empresa?.id,
    perfil: perfil?.id,
  };
}

export function sanitizeUsuarioPerfisResponse(
  usuarioPerfis: UsuarioPerfil[],
): any[] {
  if (!Array.isArray(usuarioPerfis)) return usuarioPerfis;

  return usuarioPerfis.map(sanitizeUsuarioPerfilResponse);
}
