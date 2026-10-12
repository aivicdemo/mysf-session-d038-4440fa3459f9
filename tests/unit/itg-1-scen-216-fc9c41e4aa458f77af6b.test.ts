import { validateInvoiceOutputPrerequisites } from '../../src/logic/invoice-output-validation';

jest.mock('../../src/logic/data-persistence.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
}));

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-216: 複数の検証エラーが存在する場合、warningMessage に全エラーの詳細が含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('複数の検証エラーが存在する場合、isValid は false を返し、validationErrors に4つのエラーが含まれる', async () => {
    const input = {
      dealId: 'DEAL-20250101-001',
      executionContext: {
        userId: 'USER-001',
        executionTimestamp: '2025-01-15T10:30:00Z',
        sessionId: 'SESSION-12345',
      },
    };

    const result = await validateInvoiceOutputPrerequisites(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(4);

    const errorCodes = result.validationErrors.map((e) => e.errorCode);
    expect(errorCodes).toContain('RequiredFieldMissing');
    expect(errorCodes).toContain('InvalidFieldValue');
    expect(errorCodes).toContain('DealStageNotEligibleForInvoicing');
    expect(errorCodes).toContain('InvoiceModificationInProgress');
  });

  test('warningMessage は null ではなく、string 型である', async () => {
    const input = {
      dealId: 'DEAL-20250101-001',
      executionContext: {
        userId: 'USER-001',
        executionTimestamp: '2025-01-15T10:30:00Z',
        sessionId: 'SESSION-12345',
      },
    };

    const result = await validateInvoiceOutputPrerequisites(input);

    expect(result.warningMessage).not.toBeNull();
    expect(typeof result.warningMessage).toBe('string');
  });

  test('warningMessage に全エラーの詳細が含まれる（RequiredFieldMissing と InvalidFieldValue）', async () => {
    const input = {
      dealId: 'DEAL-20250101-001',
      executionContext: {
        userId: 'USER-001',
        executionTimestamp: '2025-01-15T10:30:00Z',
        sessionId: 'SESSION-12345',
      },
    };

    const result = await validateInvoiceOutputPrerequisites(input);

    expect(result.warningMessage).toContain('請求書出力に必須のフィールドが不足しています');
    expect(result.warningMessage).toContain('accountResponsiblePersonId');
    expect(result.warningMessage).toContain('productInfo');
    expect(result.warningMessage).toContain('請求書出力に必要なフィールドの値が不正です');
    expect(result.warningMessage).toContain('dealAmount');
    expect(result.warningMessage).toContain('dealDate');
  });

  test('warningMessage に DealStageNotEligibleForInvoicing エラーの詳細が含まれる', async () => {
    const input = {
      dealId: 'DEAL-20250101-001',
      executionContext: {
        userId: 'USER-001',
        executionTimestamp: '2025-01-15T10:30:00Z',
        sessionId: 'SESSION-12345',
      },
    };

    const result = await validateInvoiceOutputPrerequisites(input);

    expect(result.warningMessage).toContain('商談ステージ');
    expect(result.warningMessage).toContain('初期段階');
    expect(result.warningMessage).toContain('成約ステージまで進めてください');
  });

  test('warningMessage に InvoiceModificationInProgress エラーの詳細が含まれる', async () => {
    const input = {
      dealId: 'DEAL-20250101-001',
      executionContext: {
        userId: 'USER-001',
        executionTimestamp: '2025-01-15T10:30:00Z',
        sessionId: 'SESSION-12345',
      },
    };

    const result = await validateInvoiceOutputPrerequisites(input);

    expect(result.warningMessage).toContain('関連請求書が修正中');
    expect(result.warningMessage).toContain('修正完了後に出力してください');
  });

  test('detailedValidationReport は各検証項目の詳細結果を含む', async () => {
    const input = {
      dealId: 'DEAL-20250101-001',
      executionContext: {
        userId: 'USER-001',
        executionTimestamp: '2025-01-15T10:30:00Z',
        sessionId: 'SESSION-12345',
      },
    };

    const result = await validateInvoiceOutputPrerequisites(input);

    expect(result.detailedValidationReport).toBeDefined();
    expect(result.detailedValidationReport.fieldCompletenessCheck).toBeDefined();
    expect(result.detailedValidationReport.fieldValidityCheck).toBeDefined();
    expect(result.detailedValidationReport.dealStageEligibilityCheck).toBeDefined();
    expect(result.detailedValidationReport.relatedInvoiceStateCheck).toBeDefined();
    expect(result.detailedValidationReport.validationExecutedAt).toBeDefined();
  });
});
