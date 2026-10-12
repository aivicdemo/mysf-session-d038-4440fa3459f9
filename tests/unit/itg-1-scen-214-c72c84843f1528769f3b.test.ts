import { validateInvoiceOutputPrerequisites, InvalidFieldValue, ExecutionContext, ValidateInvoiceOutputPrerequisitesOutput } from '../../src/logic/invoice-output-validation';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-214: 商談日付が未来日の場合に請求書出力検証を実行すると、警告メッセージを返す', () => {
  it('未来日付フィールドを検出して InvalidFieldValue エラーを含む結果を返す', async () => {
    const mockListRecords = dataStore.listRecords as jest.Mock;

    const executionContext: ExecutionContext = {
      userId: 'USER-00123',
      executionTimestamp: '2024-01-15T10:30:00Z',
      sessionId: 'SESSION-abc123def456',
    };

    // 商談データ: dealDate が未来日
    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === 'deals') {
        return Promise.resolve([
          {
            dealId: 'DEAL-20240115-001',
            dealName: 'テスト商談',
            dealDate: '2024-12-25',
            stageName: '成約',
            customerContactId: 'CUST-001',
            productInfo: 'Product A',
          },
        ]);
      }
      if (tableName === 'invoices') {
        return Promise.resolve([]);
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
      errorCode: 'InvalidFieldValue',
      affectedFields: expect.arrayContaining(['dealDate']),
      severity: 'error',
    });
    expect(result.warningMessage).toContain('不正フィールド: dealDate');
    expect(result.warningMessage).toContain('値を修正してください');
    expect(result.detailedValidationReport.fieldValidityCheck.invalidFields).toHaveLength(1);
    expect(result.detailedValidationReport.fieldValidityCheck.invalidFields[0]).toMatchObject({
      fieldName: 'dealDate',
      reason: '商談日付が未来日です。日付を確認してください。',
    });
  });
});
