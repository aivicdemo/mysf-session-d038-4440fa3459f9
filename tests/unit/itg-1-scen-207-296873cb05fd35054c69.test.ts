import {
  validateInvoiceOutputPrerequisites,
} from '../../src/logic/invoice-output-validation';
import type {
  ValidateInvoiceOutputPrerequisitesOutput,
  InvoiceOutputValidationError,
} from '../../src/logic/invoice-output-validation';

jest.mock('../../src/logic/data-persistence.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchValidationRulesByTable: jest.fn(),
  fetchRelatedInvoicesByDealId: jest.fn(),
}));

describe('SCEN-207: InvoiceModificationInProgress error when related invoice is in modification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isValid=false with InvoiceModificationInProgress error when related invoice is in modification', async () => {
    const dataPersistence = require('../../src/logic/data-persistence');

    // Preconditions from spec SCEN-207:
    // dealId: DEAL-20250107-001
    // All field checks pass (fieldCompletenessResult.isComplete=true, fieldValidityResult.isValid=true)
    // dealStageEligibility.isEligible=true (dealStage='成約')
    // relatedInvoiceState.modificationStatus='InProgress' (relatedInvoiceId: INV-20250107-001)

    dataPersistence.fetchDealById.mockResolvedValueOnce({
      dealId: 'DEAL-20250107-001',
      customerId: 'CUST-2025-0001',
      salesRepresentativeId: 'USER-001',
      dealAmount: 1500000,
      dealStage: '成約',
      contractedDate: '2025-01-05',
      dealName: 'Deal Name',
      dealDescription: 'Description',
      invoiceSLADeadline: '2025-01-15T00:00:00Z',
    });

    dataPersistence.fetchAllDealStages.mockResolvedValueOnce([
      { stageName: '成約', isContractedStage: true, isInvalidStage: false },
    ]);

    dataPersistence.fetchValidationRulesByTable.mockResolvedValueOnce([]);

    dataPersistence.fetchRelatedInvoicesByDealId.mockResolvedValueOnce([
      {
        invoiceId: 'INV-20250107-001',
        modificationStatus: 'InProgress',
        modifyingUserName: '営業太郎',
        modifyingStartDateTime: '2025-01-07T09:00:00Z',
      },
    ]);

    // Call the target function
    const result = await validateInvoiceOutputPrerequisites({
      dealId: 'DEAL-20250107-001',
      executionContext: {
        userId: 'USER-001',
        executionTimestamp: '2025-01-07T09:30:00Z',
        sessionId: 'SESSION-001',
      },
    });

    // Verify the expected result structure for SCEN-207:
    // isValid=false
    // validationErrors contains InvoiceModificationInProgress error
    // warningMessage includes '修正中' and '修正完了後に出力してください'
    // detailedValidationReport.relatedInvoiceStateCheck has hasInvoiceInModification=true

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toHaveLength(1);
    expect(result.validationErrors[0].errorCode).toBe('InvoiceModificationInProgress');
    expect(result.warningMessage).toContain('修正中');
    expect(result.warningMessage).toContain('修正完了後に出力してください');
    expect(result.detailedValidationReport.relatedInvoiceStateCheck.hasInvoiceInModification).toBe(true);
  });
});
