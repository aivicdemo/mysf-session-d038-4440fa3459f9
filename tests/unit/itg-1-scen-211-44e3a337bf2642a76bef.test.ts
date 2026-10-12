jest.mock('../../src/logic/data-persistence');

import {
  validateInvoiceOutputPrerequisites,
  ValidateInvoiceOutputPrerequisitesInput,
  ValidateInvoiceOutputPrerequisitesOutput,
  ExecutionContext,
} from '../../src/logic/invoice-output-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-211: validateInvoiceOutputPrerequisites - 商談金額が0以下の場合', () => {
  const dealId = 'DEAL-20250207-001';
  const executionContext: ExecutionContext = {
    userId: 'USER-12345',
    executionTimestamp: '2025-02-07T10:30:00Z',
    sessionId: 'SESSION-67890',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250207-001',
      accountId: 'ACC-001',
      accountContactId: 'CONT-001',
      dealAmount: -50000,
      dealStage: '成約',
      dealDate: '2025-02-05',
    });
  });

  it('商談金額が0以下の場合、InvalidFieldValue エラーを返す', async () => {
    const input: ValidateInvoiceOutputPrerequisitesInput = {
      dealId,
      executionContext,
    };

    const result: ValidateInvoiceOutputPrerequisitesOutput = await validateInvoiceOutputPrerequisites(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThan(0);
  });
});
