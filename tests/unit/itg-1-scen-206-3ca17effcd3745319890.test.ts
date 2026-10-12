import { validateInvoiceOutputPrerequisites, DuplicateInvoiceDetected, ExecutionContext, ValidateInvoiceOutputPrerequisitesOutput } from '../../src/logic/invoice-output-validation';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-206: 同一商談に対して既に請求書が出力済みである場合に請求書出力検証を実行すると、DuplicateInvoiceDetected エラーを返し isValid=false になる', () => {
  it('重複する請求書を検出して DuplicateInvoiceDetected エラーを含む結果を返す', async () => {
    const mockListRecords = dataStore.listRecords as jest.Mock;

    const executionContext: ExecutionContext = {
      userId: 'USER-0001',
      executionTimestamp: '2024-01-15T10:30:00Z',
      sessionId: 'SESSION-abc123',
    };

    // 商談データ: すべての必須フィールドが揃っている
    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === 'deals') {
        return Promise.resolve([
          {
            dealId: 'DEAL-20240115-001',
            dealName: 'テスト商談',
            dealDate: '2024-01-15',
            stageName: '成約',
            customerContactId: 'CUST-001',
            productInfo: 'Product A',
          },
        ]);
      }
      if (tableName === 'invoices') {
        // 既に出力済みの請求書が存在
        return Promise.resolve([
          {
            invoiceId: 'INV-20240115-001',
            dealId: 'DEAL-20240115-001',
            invoiceStatus: 'completed',
            createdAt: '2024-01-15T09:00:00Z',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const input = {
      dealId: 'DEAL-20240115-001',
      executionContext,
    };

    const result = await validateInvoiceOutputPrerequisites(input) as ValidateInvoiceOutputPrerequisitesOutput;

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toHaveLength(1);
    expect(result.validationErrors[0]).toMatchObject({
      errorCode: 'DuplicateInvoiceDetected',
      errorMessage: 'この商談に対する請求書は既に出力済みです。修正が必要な場合は請求書修正機能を使用してください。',
      severity: 'error',
    });
    expect(result.warningMessage).toContain('この商談に対する請求書は既に出力済みです');
    expect(result.detailedValidationReport.relatedInvoiceStateCheck.existingInvoiceCount).toBe(1);
    expect(result.detailedValidationReport.relatedInvoiceStateCheck.hasDuplicateInvoice).toBe(true);
  });
});
