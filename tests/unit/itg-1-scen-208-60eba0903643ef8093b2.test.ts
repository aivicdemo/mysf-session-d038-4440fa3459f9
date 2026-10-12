jest.mock('../../src/logic/data-persistence');

import {
  validateInvoiceOutputPrerequisites,
  ValidateInvoiceOutputPrerequisitesInput,
  ValidateInvoiceOutputPrerequisitesOutput,
  ExecutionContext,
} from '../../src/logic/invoice-output-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-208: validateInvoiceOutputPrerequisites - 複数の検証エラー条件', () => {
  const dealId = 'DEAL-20250107-005';
  const executionContext: ExecutionContext = {
    userId: 'USER-12345',
    executionTimestamp: '2025-01-07T10:30:00Z',
    sessionId: 'SESSION-ABC-789',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250107-005',
      accountId: null,
      accountContactId: null,
      dealAmount: -50000,
      dealStage: '初期段階',
      dealDate: '2025-12-31',
    });
  });

  it('複数の検証エラー条件が同時に存在する場合、複数の検証エラーを配列で返す', async () => {
    const input: ValidateInvoiceOutputPrerequisitesInput = {
      dealId,
      executionContext,
    };

    const result: ValidateInvoiceOutputPrerequisitesOutput = await validateInvoiceOutputPrerequisites(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThan(1);
  });
});
