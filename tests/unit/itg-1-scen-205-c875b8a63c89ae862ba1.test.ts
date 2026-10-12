import { validateInvoiceOutputPrerequisites } from '../../src/logic/invoice-output-validation';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-205: validateInvoiceOutputPrerequisites - DealStageNotEligibleForInvoicing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isValid=false with DealStageNotEligibleForInvoicing error when deal stage is not eligible for invoicing', async () => {
    const dealId = 'DEAL-20250207-001';
    const executionContext = {
      userId: 'USER-00123',
      executionTimestamp: '2025-02-07T10:30:00Z',
      sessionId: 'SESSION-abc123def',
    };

    const input = {
      dealId,
      executionContext,
    };

    const result = await validateInvoiceOutputPrerequisites(input);

    // isValid=false を確認
    expect(result.isValid).toBe(false);

    // validationErrors に DealStageNotEligibleForInvoicing エラーが含まれていることを確認
    expect(result.validationErrors.length).toBeGreaterThan(0);
    const dealStageError = result.validationErrors.find(
      (error) => error.errorCode === 'DealStageNotEligibleForInvoicing'
    );
    expect(dealStageError).toBeDefined();
    expect(dealStageError?.errorMessage).toContain('初期段階');
    expect(dealStageError?.errorMessage).toContain('成約ステージ');

    // warningMessage に同様のメッセージが含まれていることを確認
    expect(result.warningMessage).not.toBeNull();
    expect(result.warningMessage).toContain('初期段階');
    expect(result.warningMessage).toContain('成約ステージ');

    // detailedValidationReport に dealStageEligibility.isEligible=false の詳細が記録されていることを確認
    expect(result.detailedValidationReport.dealStageEligibilityCheck.passed).toBe(false);
    expect(result.detailedValidationReport.dealStageEligibilityCheck.isEligibleForInvoicing).toBe(false);
    expect(result.detailedValidationReport.dealStageEligibilityCheck.currentStage).toBe('初期段階');
    expect(result.detailedValidationReport.dealStageEligibilityCheck.reason).toContain('請求書出力対象ステージではない');
  });
});
