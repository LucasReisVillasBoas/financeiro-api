export enum TipoPessoa {
  CLIENTE = 'cliente',
  FORNECEDOR = 'fornecedor',
  FUNCIONARIO = 'funcionario',
  TRANSPORTADORA = 'transportadora',
  MEDICO = 'medico',
  CONVENIO = 'convenio',
  HOSPITAL = 'hospital',
}

export enum SituacaoPessoa {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  BLOQUEADO = 'bloqueado',
  PENDENTE = 'pendente',
}

/**
 * Tipo de Contribuinte conforme tabela SEFAZ
 * Ref: Manual de Integração do Contribuinte v6.0+
 */
export enum TipoContribuinte {
  /**
   * 1 - Contribuinte ICMS (possui inscrição estadual)
   * Pessoa jurídica ou física que realiza operações que envolvem circulação de mercadorias
   */
  CONTRIBUINTE_ICMS = '1',

  /**
   * 2 - Contribuinte isento de Inscrição no cadastro de Contribuintes do ICMS
   * Produtor rural, pequeno produtor, etc.
   */
  CONTRIBUINTE_ISENTO = '2',

  /**
   * 9 - Não Contribuinte
   * Pessoa física ou jurídica que não realiza operações que envolvem ICMS
   */
  NAO_CONTRIBUINTE = '9',
}

/**
 * Situação Financeira da Pessoa
 * Controla o status financeiro para operações de crédito
 */
export enum SituacaoFinanceira {
  /**
   * Ativo - Pode realizar operações normalmente
   */
  ATIVO = 'ativo',

  /**
   * Inativo - Não pode realizar novas operações
   */
  INATIVO = 'inativo',

  /**
   * Bloqueado - Bloqueado por inadimplência ou outros motivos
   */
  BLOQUEADO = 'bloqueado',

  /**
   * Suspenso - Temporariamente suspenso
   */
  SUSPENSO = 'suspenso',
}
