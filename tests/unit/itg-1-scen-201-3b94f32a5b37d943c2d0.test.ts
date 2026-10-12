jest.mock('../../src/logic/data-persistence');

import {
  validateInvoiceOutputPrerequisites,
  ValidateInvoiceOutputPrerequisitesInput,
  ValidateInvoiceOutputPrerequisitesOutput,
  ExecutionContext,
} from '../../src/logic/invoice-output-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-201: validateInvoiceOutputPrerequisites - 正常系', () => {
  const dealId = 'DEAL-20240115-001';
  const executionContext: ExecutionContext = {
    userId: 'USER-SALES-001',
    executionTimestamp: '2024-01-15T10:30:00Z',
    sessionId: 'SESSION-ABC123XYZ',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20240115-001',
      accountId: 'ACC-20240101-001',
      accountContactId: 'CONTACT-20240105-001',
      dealAmount: 500000,
      dealStage: '成約',
      dealDate: '2024-01-10',
    });
  });

  it('全必須フィールドが揃い正当な値を持つ場合、isValid=true、validationErrors=[]、warningMessage=nullを返す', async () => {
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
