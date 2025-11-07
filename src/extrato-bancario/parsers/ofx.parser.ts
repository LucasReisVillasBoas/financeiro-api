import { Injectable } from '@nestjs/common';
import { Banking } from 'banking';
import type { TransacaoExtrato } from '../dto/importar-extrato.dto';

@Injectable()
export class OfxParser {
  async parse(conteudo: Buffer): Promise<TransacaoExtrato[]> {
    return new Promise((resolve, reject) => {
      const ofxString = conteudo.toString('utf-8');

      Banking.parse(ofxString, (res) => {
        try {
          if (!res || !res.body || !res.body.OFX) {
            reject(new Error('Formato OFX inválido'));
            return;
          }

          const transacoes: TransacaoExtrato[] = [];
          const ofx = res.body.OFX;

          // Tentar extrair transações de conta corrente
          const bankStatements =
            ofx.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN ||
            [];

          // Garantir que seja um array
          const statements = Array.isArray(bankStatements)
            ? bankStatements
            : [bankStatements];

          for (const stmt of statements) {
            if (!stmt || !stmt.DTPOSTED || !stmt.TRNAMT) continue;

            // Parse da data (formato YYYYMMDD ou YYYYMMDDHHMMSS)
            const dataStr = stmt.DTPOSTED.toString();
            const ano = parseInt(dataStr.substring(0, 4));
            const mes = parseInt(dataStr.substring(4, 6)) - 1;
            const dia = parseInt(dataStr.substring(6, 8));
            const data = new Date(ano, mes, dia);

            // Parse do valor
            const valor = Math.abs(parseFloat(stmt.TRNAMT));
            const tipo = parseFloat(stmt.TRNAMT) < 0 ? 'debito' : 'credito';

            transacoes.push({
              data,
              descricao: stmt.MEMO || stmt.NAME || 'Transação sem descrição',
              documento: stmt.CHECKNUM || stmt.REFNUM || stmt.FITID,
              valor,
              tipo,
            });
          }

          resolve(transacoes);
        } catch (error) {
          reject(new Error(`Erro ao processar OFX: ${error.message}`));
        }
      });
    });
  }
}
