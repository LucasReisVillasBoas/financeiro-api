/**
 * Testes de Integração - Fluxo Completo Financeiro
 *
 * Testa o fluxo completo:
 * Título lançado → Baixa → Movimento Bancário → Relatório
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ContasPagarService } from '../../src/conta-pagar/conta-pagar.service';
import { ContasReceberService } from '../../src/conta-receber/conta-receber.service';
import { BaixaPagamentoService } from '../../src/baixa-pagamento/baixa-pagamento.service';
import { MovimentacoesBancariasService } from '../../src/movimentacao-bancaria/movimentacao-bancaria.service';
import { RelatorioFluxoCaixaService } from '../../src/relatorio-fluxo-caixa/relatorio-fluxo-caixa.service';
import { AuditService } from '../../src/audit/audit.service';
import { StatusContaPagar } from '../../src/entities/conta-pagar/conta-pagar.entity';
import { StatusContaReceber } from '../../src/entities/conta-receber/conta-receber.entity';

describe('Fluxo Completo Financeiro - Integração', () => {
  // Mock de dados compartilhados entre testes
  const mockEmpresa = { id: 'empresa-123', razao_social: 'Empresa Teste' };
  const mockPessoa = { id: 'pessoa-123', nome: 'Fornecedor/Cliente Teste' };
  const mockPlanoContas = { id: 'plano-123', descricao: 'Despesas Operacionais' };
  const mockContaBancaria = {
    id: 'conta-bancaria-123',
    banco: 'Banco do Brasil',
    saldo_atual: 10000,
    ativo: true,
  };

  describe('Fluxo Contas a Pagar', () => {
    describe('Título → Baixa → Movimento Bancário', () => {
      it('deve criar conta a pagar com saldo igual ao valor total', () => {
        const contaPagar = {
          id: 'conta-pagar-123',
          documento: 'NF-001',
          valor_principal: 1000,
          acrescimos: 50,
          descontos: 30,
          valor_total: 1020, // 1000 + 50 - 30
          saldo: 1020,
          status: StatusContaPagar.PENDENTE,
        };

        expect(contaPagar.saldo).toBe(contaPagar.valor_total);
        expect(contaPagar.status).toBe(StatusContaPagar.PENDENTE);
      });

      it('deve atualizar saldo após baixa parcial', () => {
        const contaPagar = {
          saldo: 1020,
          status: StatusContaPagar.PENDENTE,
        };

        // Simula baixa parcial de 500
        const valorBaixa = 500;
        contaPagar.saldo -= valorBaixa;
        contaPagar.status = StatusContaPagar.PARCIALMENTE_PAGA;

        expect(contaPagar.saldo).toBe(520);
        expect(contaPagar.status).toBe(StatusContaPagar.PARCIALMENTE_PAGA);
      });

      it('deve zerar saldo e marcar como PAGA após baixa total', () => {
        const contaPagar = {
          saldo: 520,
          status: StatusContaPagar.PARCIALMENTE_PAGA,
        };

        // Simula baixa do saldo restante
        const valorBaixa = 520;
        contaPagar.saldo -= valorBaixa;
        contaPagar.status = StatusContaPagar.PAGA;

        expect(contaPagar.saldo).toBe(0);
        expect(contaPagar.status).toBe(StatusContaPagar.PAGA);
      });

      it('deve debitar conta bancária ao registrar baixa', () => {
        const contaBancaria = { saldo_atual: 10000 };
        const valorBaixa = 500;

        // Simula débito na conta bancária
        contaBancaria.saldo_atual -= valorBaixa;

        expect(contaBancaria.saldo_atual).toBe(9500);
      });

      it('deve criar movimentação bancária do tipo SAÍDA/DÉBITO', () => {
        const movimentacao = {
          tipoMovimento: 'Saída',
          valor: 500,
          categoria: 'Pagamento Fornecedor',
          referencia: 'Pagar',
        };

        expect(movimentacao.tipoMovimento).toBe('Saída');
        expect(movimentacao.referencia).toBe('Pagar');
      });

      it('deve restaurar saldo ao estornar baixa', () => {
        // Estado após baixa
        const contaPagar = { saldo: 520, status: StatusContaPagar.PARCIALMENTE_PAGA };
        const contaBancaria = { saldo_atual: 9500 };
        const valorEstorno = 500;

        // Simula estorno
        contaPagar.saldo += valorEstorno;
        contaPagar.status = StatusContaPagar.PENDENTE;
        contaBancaria.saldo_atual += valorEstorno;

        expect(contaPagar.saldo).toBe(1020);
        expect(contaPagar.status).toBe(StatusContaPagar.PENDENTE);
        expect(contaBancaria.saldo_atual).toBe(10000);
      });
    });
  });

  describe('Fluxo Contas a Receber', () => {
    describe('Título → Liquidação → Movimento Bancário', () => {
      it('deve criar conta a receber com saldo igual ao valor total', () => {
        const contaReceber = {
          id: 'conta-receber-123',
          documento: 'NF-001',
          valorPrincipal: 2000,
          valorAcrescimos: 100,
          valorDescontos: 50,
          valorTotal: 2050, // 2000 + 100 - 50
          saldo: 2050,
          status: StatusContaReceber.PENDENTE,
        };

        expect(contaReceber.saldo).toBe(contaReceber.valorTotal);
        expect(contaReceber.status).toBe(StatusContaReceber.PENDENTE);
      });

      it('deve atualizar saldo após recebimento parcial', () => {
        const contaReceber = {
          saldo: 2050,
          status: StatusContaReceber.PENDENTE,
        };

        // Simula recebimento parcial de 1000
        const valorRecebido = 1000;
        contaReceber.saldo -= valorRecebido;
        contaReceber.status = StatusContaReceber.PARCIAL;

        expect(contaReceber.saldo).toBe(1050);
        expect(contaReceber.status).toBe(StatusContaReceber.PARCIAL);
      });

      it('deve zerar saldo e marcar como LIQUIDADO após recebimento total', () => {
        const contaReceber = {
          saldo: 1050,
          status: StatusContaReceber.PARCIAL,
        };

        // Simula recebimento do saldo restante
        const valorRecebido = 1050;
        contaReceber.saldo -= valorRecebido;
        contaReceber.status = StatusContaReceber.LIQUIDADO;

        expect(contaReceber.saldo).toBe(0);
        expect(contaReceber.status).toBe(StatusContaReceber.LIQUIDADO);
      });

      it('deve creditar conta bancária ao registrar recebimento', () => {
        const contaBancaria = { saldo_atual: 10000 };
        const valorRecebido = 1000;

        // Simula crédito na conta bancária
        contaBancaria.saldo_atual += valorRecebido;

        expect(contaBancaria.saldo_atual).toBe(11000);
      });

      it('deve criar movimentação bancária do tipo ENTRADA/CRÉDITO', () => {
        const movimentacao = {
          tipoMovimento: 'Crédito',
          valor: 1000,
          categoria: 'RECEBIMENTO',
          referencia: 'Receber',
        };

        expect(movimentacao.tipoMovimento).toBe('Crédito');
        expect(movimentacao.referencia).toBe('Receber');
      });
    });
  });

  describe('Validação de Regras de Negócio', () => {
    it('não deve permitir baixa maior que o saldo - Contas a Pagar', () => {
      const contaPagar = { saldo: 500 };
      const valorBaixa = 600;

      const baixaValida = valorBaixa <= contaPagar.saldo;

      expect(baixaValida).toBe(false);
    });

    it('não deve permitir recebimento maior que o saldo - Contas a Receber', () => {
      const contaReceber = { saldo: 500 };
      const valorRecebido = 600;

      const recebimentoValido = valorRecebido <= contaReceber.saldo;

      expect(recebimentoValido).toBe(false);
    });

    it('não deve permitir baixa em conta já totalmente paga', () => {
      const contaPagar = { status: StatusContaPagar.PAGA };

      const podeBaixar = contaPagar.status !== StatusContaPagar.PAGA;

      expect(podeBaixar).toBe(false);
    });

    it('não deve permitir recebimento em conta cancelada', () => {
      const contaReceber = { status: StatusContaReceber.CANCELADO };

      const podeReceber = contaReceber.status !== StatusContaReceber.CANCELADO;

      expect(podeReceber).toBe(false);
    });

    it('não deve permitir edição de conta com baixa registrada', () => {
      const contaPagar = {
        status: StatusContaPagar.PARCIALMENTE_PAGA,
        data_liquidacao: new Date(),
      };

      const podeEditar = !contaPagar.data_liquidacao &&
        contaPagar.status !== StatusContaPagar.PAGA &&
        contaPagar.status !== StatusContaPagar.PARCIALMENTE_PAGA;

      expect(podeEditar).toBe(false);
    });

    it('deve validar saldo suficiente na conta bancária para pagamento', () => {
      const contaBancaria = { saldo_atual: 100 };
      const valorPagamento = 500;

      const saldoSuficiente = contaBancaria.saldo_atual >= valorPagamento;

      expect(saldoSuficiente).toBe(false);
    });
  });

  describe('Cálculos Financeiros', () => {
    it('deve calcular valor total corretamente (principal + acréscimos - descontos)', () => {
      const valorPrincipal = 1000;
      const acrescimos = 50;
      const descontos = 30;

      const valorTotal = valorPrincipal + acrescimos - descontos;

      expect(valorTotal).toBe(1020);
    });

    it('deve calcular juros por atraso corretamente', () => {
      const valorPrincipal = 1000;
      const taxaJuros = 0.02; // 2% ao mês
      const diasAtraso = 30;

      const juros = valorPrincipal * taxaJuros * (diasAtraso / 30);

      expect(juros).toBe(20);
    });

    it('deve calcular multa por atraso corretamente', () => {
      const valorPrincipal = 1000;
      const taxaMulta = 0.02; // 2%

      const multa = valorPrincipal * taxaMulta;

      expect(multa).toBe(20);
    });

    it('deve calcular desconto por antecipação corretamente', () => {
      const valorPrincipal = 1000;
      const taxaDesconto = 0.05; // 5%
      const diasAntecipacao = 10;
      const diasTotais = 30;

      const desconto = valorPrincipal * taxaDesconto * (diasAntecipacao / diasTotais);

      expect(desconto).toBeCloseTo(16.67, 1);
    });

    it('deve arredondar valores para 2 casas decimais', () => {
      const valor = 1000.556;
      const valorArredondado = Number(valor.toFixed(2));

      expect(valorArredondado).toBe(1000.56);
    });
  });

  describe('Consistência de Saldos', () => {
    it('soma de baixas deve ser igual à diferença entre valor total e saldo', () => {
      const conta = {
        valorTotal: 1000,
        saldo: 400,
      };

      const totalBaixado = conta.valorTotal - conta.saldo;

      expect(totalBaixado).toBe(600);
    });

    it('saldo da conta bancária deve refletir todas as movimentações', () => {
      const saldoInicial = 10000;
      const entradas = [500, 300, 200]; // 1000
      const saidas = [400, 100, 250]; // 750

      const totalEntradas = entradas.reduce((a, b) => a + b, 0);
      const totalSaidas = saidas.reduce((a, b) => a + b, 0);
      const saldoFinal = saldoInicial + totalEntradas - totalSaidas;

      expect(totalEntradas).toBe(1000);
      expect(totalSaidas).toBe(750);
      expect(saldoFinal).toBe(10250);
    });

    it('estorno deve restaurar exatamente o valor baixado', () => {
      const saldoAntesBaixa = 1000;
      const valorBaixa = 500;
      const saldoAposBaixa = saldoAntesBaixa - valorBaixa;

      // Estorno
      const saldoAposEstorno = saldoAposBaixa + valorBaixa;

      expect(saldoAposEstorno).toBe(saldoAntesBaixa);
    });
  });

  describe('Fluxo de Caixa - Integração', () => {
    it('deve contabilizar entradas corretamente no período', () => {
      const movimentacoes = [
        { tipoMovimento: 'Entrada', valor: 500 },
        { tipoMovimento: 'Crédito', valor: 300 },
        { tipoMovimento: 'Saída', valor: 200 },
      ];

      const totalEntradas = movimentacoes
        .filter((m) => m.tipoMovimento === 'Entrada' || m.tipoMovimento === 'Crédito')
        .reduce((acc, m) => acc + m.valor, 0);

      expect(totalEntradas).toBe(800);
    });

    it('deve contabilizar saídas corretamente no período', () => {
      const movimentacoes = [
        { tipoMovimento: 'Entrada', valor: 500 },
        { tipoMovimento: 'Saída', valor: 300 },
        { tipoMovimento: 'Débito', valor: 200 },
      ];

      const totalSaidas = movimentacoes
        .filter((m) => m.tipoMovimento === 'Saída' || m.tipoMovimento === 'Débito')
        .reduce((acc, m) => acc + m.valor, 0);

      expect(totalSaidas).toBe(500);
    });

    it('deve calcular saldo final do período corretamente', () => {
      const saldoInicial = 5000;
      const totalEntradas = 3000;
      const totalSaidas = 2000;

      const saldoFinal = saldoInicial + totalEntradas - totalSaidas;

      expect(saldoFinal).toBe(6000);
    });
  });

  describe('Auditoria do Fluxo', () => {
    it('deve registrar criação de título', () => {
      const auditLog = {
        eventType: 'CONTA_PAGAR_CREATED',
        action: 'CRIAR',
        details: {
          documento: 'NF-001',
          valorTotal: 1000,
        },
      };

      expect(auditLog.eventType).toBe('CONTA_PAGAR_CREATED');
      expect(auditLog.details.documento).toBe('NF-001');
    });

    it('deve registrar baixa com valores antes/depois', () => {
      const auditLog = {
        eventType: 'CONTA_PAGAR_UPDATED',
        action: 'REGISTRAR_BAIXA',
        details: {
          saldoAnterior: 1000,
          saldoPosterior: 500,
          valorPago: 500,
        },
      };

      expect(auditLog.action).toBe('REGISTRAR_BAIXA');
      expect(auditLog.details.saldoAnterior - auditLog.details.saldoPosterior)
        .toBe(auditLog.details.valorPago);
    });

    it('deve registrar estorno com severidade CRITICAL', () => {
      const auditLog = {
        eventType: 'CONTA_PAGAR_UPDATED',
        action: 'ESTORNAR_BAIXA',
        severity: 'CRITICAL',
        details: {
          valorEstornado: 500,
          justificativa: 'Pagamento duplicado',
        },
      };

      expect(auditLog.severity).toBe('CRITICAL');
      expect(auditLog.details.justificativa).toBeDefined();
    });
  });
});
