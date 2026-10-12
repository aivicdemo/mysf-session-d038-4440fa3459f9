jest.mock('../../src/logic/data-persistence');

import {
  validateInvoiceOutputPrerequisites,
  ValidateInvoiceOutputPrerequisitesInput,
  ValidateInvoiceOutputPrerequisitesOutput,
  ExecutionContext,
} from '../../src/logic/invoice-output-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-203: validateInvoiceOutputPrerequisites - 代表的な入力値での検証', () => {
  const dealId = 'DEAL-20250107-001';
  const executionContext: ExecutionContext = {
    userId: 'USER-00123',
    executionTimestamp: '2025-01-07T10:30:00Z',
    sessionId: 'SESSION-ABC123XYZ',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250107-001',
      accountId: 'ACC-2025-00001',
      accountContactId: 'CONT-2025-00001',
      dealAmount: 500000,
      dealStage: '成約',
      dealDate: '2025-01-07',
    });
  });

  it('代表的な入力値で業務ルールが設計どおりに必須フィールドの完全性と妥当性を検証する', async () => {
    const input: ValidateInvoiceOutputPrerequisitesInput = {
      dealId,
      executionContext,
    };

    const result: ValidateInvoiceOutputPrerequisitesOutput = await validateInvoiceOutputPrerequisites(input);

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toEqual([]);
    expect(result.warningMessage).toBeNull();
  });
});
