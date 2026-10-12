import { verifyInvoiceOutputConsistency, TestContextInvalid } from '../../src/logic/invoice-output-verification';

describe('SCEN-223: テスト実行環境の識別情報が不正の場合', () => {
  test('テストコンテキスト不正エラーが発生する', async () => {
    const legacySystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-10',
        invoiceAmount: 110000,
        taxAmount: 10000,
        taxExcludedAmount: 100000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 1,
            unitPrice: 100000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
        ],
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-10',
        invoiceAmount: 110000,
        taxAmount: 10000,
        taxExcludedAmount: 100000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 1,
            unitPrice: 100000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
        ],
      },
    ];

    const testExecutionContext = {
      environmentId: '',
      targetPeriodStart: '2024-01-01',
      targetPeriodEnd: '2024-01-31',
      executedAt: '2024-01-15T10:00:00Z',
    };

    await expect(
      verifyInvoiceOutputConsistency({
        legacySystemInvoices,
        newSystemInvoices,
        testExecutionContext,
      })
    ).rejects.toThrow(TestContextInvalid);
  });

  test('エラーメッセージに環境IDと対象期間が含まれる', async () => {
    const legacySystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-10',
        invoiceAmount: 110000,
        taxAmount: 10000,
        taxExcludedAmount: 100000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 1,
            unitPrice: 100000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
        ],
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-10',
        invoiceAmount: 110000,
        taxAmount: 10000,
        taxExcludedAmount: 100000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 1,
            unitPrice: 100000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
        ],
      },
    ];

    const testExecutionContext = {
      environmentId: '',
      targetPeriodStart: '2024-01-01',
      targetPeriodEnd: '2024-01-31',
      executedAt: '2024-01-15T10:00:00Z',
    };

    try {
      await verifyInvoiceOutputConsistency({
        legacySystemInvoices,
        newSystemInvoices,
        testExecutionContext,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TestContextInvalid);
      expect((error as Error).message).toContain('テスト実行コンテキストが不正です');
      expect((error as Error).message).toContain('2024-01-01 - 2024-01-31');
    }
  });
});
