import { PlanoContas } from '../../entities/plano-contas/plano-contas.entity';

export class PlanoContasResponseDto {
  id: string;
  codigo: string;
  descricao: string;
  tipo: string;
  nivel: number;
  permite_lancamento: boolean;
  ativo: boolean;
  empresaId: string;
  empresaNome?: string;
  parentId?: string;
  parentCodigo?: string;
  filhos?: PlanoContasResponseDto[];
  created_at: Date;
  updated_at: Date;

  static fromEntity(conta: PlanoContas): PlanoContasResponseDto {
    return {
      id: conta.id,
      codigo: conta.codigo,
      descricao: conta.descricao,
      tipo: conta.tipo,
      nivel: conta.nivel,
      permite_lancamento: conta.permite_lancamento,
      ativo: conta.ativo,
      empresaId: conta.empresa?.id,
      empresaNome: conta.empresa?.nome_fantasia || conta.empresa?.razao_social,
      parentId: conta.parent?.id,
      parentCodigo: conta.parent?.codigo,
      filhos: conta.filhos?.isInitialized()
        ? conta.filhos.getItems().map((f) => this.fromEntity(f))
        : undefined,
      created_at: conta.created_at,
      updated_at: conta.updated_at,
    };
  }
}

export class PaginatedPlanoContasResponseDto {
  data: PlanoContasResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
