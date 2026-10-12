import { validateInvoiceOutputPrerequisites } from '../../src/logic/invoice-output-validation';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-212: validateInvoiceOutputPrerequisites - DealStageNotEligibleForInvoicing warning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isValid=false with DealStageNotEligibleForInvoicing error and warning message when deal stage is not eligible', async () => {
    const dealId = 'DEAL-20240115-001';
    const executionContext = {
      userId: 'USER-salesPerson-001',
      executionTimestamp: '2024-01-15T10:30:00Z',
      sessionId: 'SESSION-abc123def456',
    };

    const input = {
      dealId,
      executionContext,
    };

    const result = await validateInvoiceOutputPrerequisites(input);

    // isValid=false を確認（商談ステージが成約以外）
    expect(result.isValid).toBe(false);

    // validationErrors に DealStageNotEligibleForInvoicing エラーが1件含まれていることを確認
    expect(result.validationErrors.length).toBeGreaterThan(0);
    const dealStageError = result.validationErrors.find(
      (error) => error.errorCode === 'DealStageNotEligibleForInvoicing'
    );
    expect(dealStageError).toBeDefined();
    expect(dealStageError?.errorMessage).toContain('提案段階');
    expect(dealStageError?.errorMessage).toContain('成約ステージ');

    // warningMessage に同様のメッセージが含まれていることを確認
    expect(result.warningMessage).not.toBeNull();
    expect(result.warningMessage).toContain('提案段階');
    expect(result.warningMessage).toContain('成約ステージ');

    // dealStageEligibilityCheck：isValid=false、validationErrors に DealStageNotEligibleForInvoicing エラーが記録されていることを確認
    expect(result.detailedValidationReport.dealStageEligibilityCheck.passed).toBe(false);
    expect(result.detailedValidationReport.dealStageEligibilityCheck.isEligibleForInvoicing).toBe(false);

    // その他の検証項目は isValid=true、validationErrors=[] として記録されていることを確認
    expect(result.detailedValidationReport.fieldCompletenessCheck.passed).toBe(true);
    expect(result.detailedValidationReport.fieldCompletenessCheck.missingFields.length).toBe(0);

    expect(result.detailedValidationReport.fieldValidityCheck.passed).toBe(true);
    expect(result.detailedValidationReport.fieldValidityCheck.invalidFields.length).toBe(0);

    expect(result.detailedValidationReport.relatedInvoiceStateCheck.passed).toBe(true);
  });
});
