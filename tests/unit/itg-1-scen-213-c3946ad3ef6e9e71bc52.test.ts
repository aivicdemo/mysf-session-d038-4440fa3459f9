import {
  validateInvoiceOutputPrerequisites,
  type ValidateInvoiceOutputPrerequisitesOutput,
  type InvoiceOutputValidationError,
} from '../../src/logic/invoice-output-validation';

jest.mock('../../src/logic/data-persistence.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchValidationRulesByTable: jest.fn(),
  fetchRelatedInvoicesByDealId: jest.fn(),
}));

describe('SCEN-213: RequiredFieldMissing error when productInfo is empty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isValid=false with RequiredFieldMissing error when productInfo is null', async () => {
    const dataPersistence = require('../../src/logic/data-persistence');

    // Preconditions from spec SCEN-213:
    // dealId: DEAL-20250107-001
    // productInfo is null (missing required field)
    // fieldValidityResult.isValid=true (other fields are valid)
    // dealStageEligibility.isEligible=true (dealStage='成約')
    // relatedInvoiceState.hasNoConflict=true (no related invoices in conflict)

    dataPersistence.fetchDealById.mockResolvedValueOnce({
      dealId: 'DEAL-20250107-001',
      customerId: 'CUST-2025-0001',
      contactId: 'CONT-2025-0042',
      dealAmount: 1500000,
      dealStage: '成約',
      productInfo: null, // Missing required field
      dealDate: '2025-01-05',
      dealName: 'Deal Name',
      dealDescription: 'Description',
      invoiceSLADeadline: '2025-01-15T00:00:00Z',
      salesRepresentativeId: 'USER-sales-001',
      contractedDate: '2025-01-05',
    });

    dataPersistence.fetchAllDealStages.mockResolvedValueOnce([
      { stageName: '成約', isContractedStage: true, isInvalidStage: false },
    ]);

    dataPersistence.fetchValidationRulesByTable.mockResolvedValueOnce([]);

    dataPersistence.fetchRelatedInvoicesByDealId.mockResolvedValueOnce([]);

    // Call the target function
    const result = await validateInvoiceOutputPrerequisites({
      dealId: 'DEAL-20250107-001',
      executionContext: {
        userId: 'USER-sales-001',
        executionTimestamp: '2025-01-07T10:00:00Z',
        sessionId: 'SESSION-002',
      },
    });

    // Verify the expected result structure for SCEN-213:
    // isValid=false
    // validationErrors contains RequiredFieldMissing error for productInfo
    // warningMessage includes 'productInfo' and '補完'
    // detailedValidationReport.fieldCompletenessCheck.passed=false with productInfo in missingFields

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toHaveLength(1);
    expect(result.validationErrors[0].errorCode).toBe('RequiredFieldMissing');
    expect(result.validationErrors[0].errorMessage).toContain('productInfo');
    expect(result.warningMessage).toContain('productInfo');
    expect(result.warningMessage).toContain('補完');
    expect(result.detailedValidationReport.fieldCompletenessCheck.passed).toBe(false);
    expect(result.detailedValidationReport.fieldCompletenessCheck.missingFields).toContain('productInfo');
  });
});
