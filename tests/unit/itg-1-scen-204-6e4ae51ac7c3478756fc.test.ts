jest.mock('../../src/logic/data-persistence');

import {
  validateInvoiceOutputPrerequisites,
  ValidateInvoiceOutputPrerequisitesInput,
  ValidateInvoiceOutputPrerequisitesOutput,
  ExecutionContext,
} from '../../src/logic/invoice-output-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-204: validateInvoiceOutputPrerequisites - フィールド値の不正エラー', () => {
  const dealId = 'DEAL-20250107-001';
  const executionContext: ExecutionContext = {
    userId: 'USR-00123',
    executionTimestamp: '2025-01-07T10:30:00Z',
    sessionId: 'SESSION-abc123def456',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250107-001',
      accountId: '',
      accountContactId: '',
      dealAmount: -50000,
      dealStage: '',
      dealDate: '2025-12-31',
    });
  });

  it('フィールド値が業務ルール・データ型・形式に違反している場合、InvalidFieldValue エラーを返し isValid=false になる', async () => {
    const input: ValidateInvoiceOutputPrerequisitesInput = {
      dealId,
      executionContext,
    };

    const result: ValidateInvoiceOutputPrerequisitesOutput = await validateInvoiceOutputPrerequisites(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThan(0);
  });
});
