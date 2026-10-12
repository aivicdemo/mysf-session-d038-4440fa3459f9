jest.mock('../../src/logic/data-persistence');

import {
  validateInvoiceOutputPrerequisites,
  ValidateInvoiceOutputPrerequisitesInput,
  ValidateInvoiceOutputPrerequisitesOutput,
  ExecutionContext,
} from '../../src/logic/invoice-output-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-215: validateInvoiceOutputPrerequisites - detailedValidationReport の検証', () => {
  const dealId = 'DEAL-20250107-001';
  const executionContext: ExecutionContext = {
    userId: 'USER-0001',
    executionTimestamp: '2025-01-07T10:30:00Z',
    sessionId: 'SESSION-abc123xyz',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250107-001',
      accountId: 'ACC-001',
      accountContactId: 'CONT-001',
      dealAmount: 500000,
      dealStage: '成約',
      dealDate: '2025-01-07',
    });
  });

  it('検証が合格した場合、detailedValidationReport に各検証項目の詳細結果が格納される', async () => {
    const input: ValidateInvoiceOutputPrerequisitesInput = {
      dealId,
      executionContext,
    };

    const result: ValidateInvoiceOutputPrerequisitesOutput = await validateInvoiceOutputPrerequisites(input);

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toEqual([]);
    expect(result.warningMessage).toBeNull();
    expect(result.detailedValidationReport).toBeDefined();
  });
});
