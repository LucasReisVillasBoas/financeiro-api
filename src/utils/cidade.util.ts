import type { Cidade } from '../entities/cidade/cidade.entity';

export function sanitizeCidadeResponse(cidade: Cidade): any {
  if (!cidade) return cidade;

  const { cliente, filial, ...rest } = cidade;

  return {
    ...rest,
    clienteId: cliente?.id,
    filialId: filial?.id,
  };
}

export function sanitizeCidadesResponse(cidades: Cidade[]): any[] {
  if (!Array.isArray(cidades)) return cidades;

  return cidades.map(sanitizeCidadeResponse);
}
