jest.mock('../../src/logic/data-persistence');

import {
  validateInvoiceOutputPrerequisites,
  ValidateInvoiceOutputPrerequisitesInput,
  ValidateInvoiceOutputPrerequisitesOutput,
  ExecutionContext,
} from '../../src/logic/invoice-output-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-210: validateInvoiceOutputPrerequisites - 顧客情報不完全エラー', () => {
  const dealId = 'DEAL-20240115-001';
  const executionContext: ExecutionContext = {
    userId: 'USER-00123',
    executionTimestamp: '2024-01-15T10:30:00Z',
    sessionId: 'SESSION-abc123def456',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20240115-001',
      accountId: null,
      accountContactId: '',
      dealAmount: 150000,
      dealStage: '成約',
      dealDate: '2024-01-10',
    });
  });

  it('取引先IDまたは取引先責任者IDが空の場合、RequiredFieldMissing エラーを返す', async () => {
    const input: ValidateInvoiceOutputPrerequisitesInput = {
      dealId,
      executionContext,
    };

    const result: ValidateInvoiceOutputPrerequisitesOutput = await validateInvoiceOutputPrerequisites(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThan(0);
  });
});
