import { validateInvoiceOutputPrerequisites, RequiredFieldMissing, ExecutionContext, ValidateInvoiceOutputPrerequisitesOutput } from '../../src/logic/invoice-output-validation';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-202: 必須フィールドが1件以上不足している商談から請求書出力検証を実行すると、RequiredFieldMissing エラーを返し isValid=false になる', () => {
  it('不足フィールドを検出して RequiredFieldMissing エラーを含む結果を返す', async () => {
    const mockListRecords = dataStore.listRecords as jest.Mock;

    const executionContext: ExecutionContext = {
      userId: 'USER-SALES-001',
      executionTimestamp: '2025-01-07T10:30:00Z',
      sessionId: 'SESSION-ABC123',
    };

    // 商談データ: 必須フィールドが不足している（customerContactId、productInfo がない）
    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === 'deals') {
        return Promise.resolve([
          {
            dealId: 'DEAL-20250107-001',
            dealName: 'テスト商談',
            dealDate: '2025-01-07',
            stageName: '成約',
            // customerContactId, productInfo が欠けている
          },
        ]);
      }
      if (tableName === 'invoices') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const input = {
      dealId: 'DEAL-20250107-001',
      executionContext,
    };

    const result = await validateInvoiceOutputPrerequisites(input) as ValidateInvoiceOutputPrerequisitesOutput;

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toHaveLength(1);
    expect(result.validationErrors[0]).toMatchObject({
      errorCode: 'RequiredFieldMissing',
      affectedFields: expect.arrayContaining(['customerContactId', 'productInfo']),
      severity: 'error',
    });
    expect(result.warningMessage).toContain('請求書出力に必須のフィールドが不足しています');
    expect(result.warningMessage).toContain('customerContactId, productInfo');
    expect(result.detailedValidationReport.fieldCompletenessCheck.missingFields).toEqual(['customerContactId', 'productInfo']);
  });
});
