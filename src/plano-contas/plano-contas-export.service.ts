import { Injectable } from '@nestjs/common';
import { PlanoContas } from '../entities/plano-contas/plano-contas.entity';

@Injectable()
export class PlanoContasExportService {
  /**
   * Gera CSV a partir de uma lista de contas
   */
  generateCSV(contas: PlanoContas[]): string {
    // Cabeçalho
    const headers = [
      'Código',
      'Descrição',
      'Tipo',
      'Nível',
      'Permite Lançamento',
      'Ativo',
      'Código Pai',
      'Empresa',
      'Criado em',
    ];

    // Linhas de dados
    const rows = contas.map((conta) => [
      conta.codigo,
      `"${conta.descricao.replace(/"/g, '""')}"`, // Escapar aspas duplas
      conta.tipo,
      conta.nivel.toString(),
      conta.permite_lancamento ? 'Sim' : 'Não',
      conta.ativo ? 'Ativo' : 'Inativo',
      conta.parent?.codigo || '',
      conta.empresa?.nome_fantasia || conta.empresa?.razao_social || '',
      conta.created_at.toISOString(),
    ]);

    // Montar CSV
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
      '\n',
    );

    return csv;
  }

  /**
   * Gera estrutura para Excel (formato simplificado)
   * Retorna um array de objetos que pode ser convertido para XLS por uma biblioteca
   */
  generateExcelData(contas: PlanoContas[]): any[] {
    return contas.map((conta) => ({
      Código: conta.codigo,
      Descrição: conta.descricao,
      Tipo: conta.tipo,
      Nível: conta.nivel,
      'Permite Lançamento': conta.permite_lancamento ? 'Sim' : 'Não',
      Status: conta.ativo ? 'Ativo' : 'Inativo',
      'Código Pai': conta.parent?.codigo || '',
      Empresa:
        conta.empresa?.nome_fantasia || conta.empresa?.razao_social || '',
      'Criado em': conta.created_at.toISOString().split('T')[0],
    }));
  }

  /**
   * Gera HTML para exportação ou visualização
   */
  generateHTML(contas: PlanoContas[]): string {
    const rows = contas
      .map(
        (conta) => `
      <tr>
        <td>${conta.codigo}</td>
        <td>${conta.descricao}</td>
        <td>${conta.tipo}</td>
        <td>${conta.nivel}</td>
        <td>${conta.permite_lancamento ? 'Sim' : 'Não'}</td>
        <td>${conta.ativo ? 'Ativo' : 'Inativo'}</td>
        <td>${conta.parent?.codigo || '-'}</td>
        <td>${conta.empresa?.nome_fantasia || conta.empresa?.razao_social || ''}</td>
      </tr>
    `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Plano de Contas</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Plano de Contas</h1>
  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Descrição</th>
        <th>Tipo</th>
        <th>Nível</th>
        <th>Permite Lançamento</th>
        <th>Status</th>
        <th>Código Pai</th>
        <th>Empresa</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>
    `;
  }
}
