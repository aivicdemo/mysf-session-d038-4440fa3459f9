import { transitionDealStage, InvoiceConsistencyViolationError } from '../../src/logic/deal-stage-transition';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';
import * as validationRuleEngine from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');
jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-143: エラー系：遷移後の商談ステージと関連する請求データのステータスが整合しない、または金額ズレが検出される場合、InvoiceConsistencyViolationError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('InvoiceConsistencyViolationError が発生し、エラー文言に「請求データとの整合性が取れません。金額ズレまたはステータス不整合が検出されました。」を含む', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-sales-001';
    const executionTimestamp = 1700000000000;

    const mockDealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'A社新規プロジェクト',
      currentStage: '提案',
      dealAmount: 1000000,
      customerId: 'cust-001',
      createdAt: 1699000000000,
      updatedAt: 1699500000000,
    };

    const mockDealStages = [
      { stage: '提案', stageOrder: 3, isActive: true },
      { stage: '成約', stageOrder: 5, isActive: true },
    ];

    const mockStageTransitionRules = [
      { fromStage: '提案', toStage: '成約', isAllowed: true, conditions: [] },
    ];

    const mockValidationRules = [
      {
        tableName: 'Deal',
        stageName: '成約',
        requiredFields: ['customerId', 'dealAmount'],
        validationLogic: 'ALL_REQUIRED',
      },
    ];

    const mockInvoices = [
      {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        invoiceStatus: '確定済',
        invoiceAmount: 1050000,
        invoiceDate: '2024-11-20',
        lineItems: [
          { lineItemId: 'line-001', description: 'A社向けシステム構築', quantity: 1, unitPrice: 1050000, totalAmount: 1050000 },
        ],
        paymentStatus: '未入金',
      },
    ];

    const mockValidationResult = {
      isValid: true,
      validationResults: [
        { fieldName: 'customerId', isValid: true, value: 'cust-001' },
        { fieldName: 'dealAmount', isValid: true, value: 1000000 },
      ],
      errors: [],
    };

    const mockInvoiceIntegrityFail = {
      isValid: false,
      invoiceExists: true,
      amountMatch: false,
      amountDifference: 50000,
      amountDifferencePercentage: 5,
      statusConsistency: true,
      inconsistencies: ['商談金額（1000000）と請求書金額（1050000）の差が5.0%で、閾値5%以上を超過'],
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealRecord);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockDealStages);
    (dataPersistence.fetchDealStageTransitionRules as jest.Mock).mockResolvedValue(mockStageTransitionRules);
    (dataPersistence.fetchValidationRulesByTable as jest.Mock).mockResolvedValue(mockValidationRules);
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock).mockResolvedValue(mockInvoices);
    (validationRuleEngine.validateDataAgainstRules as jest.Mock).mockResolvedValue(mockValidationResult);
    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue(mockInvoiceIntegrityFail);

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(InvoiceConsistencyViolationError);

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(/請求データとの整合性が取れません。金額ズレまたはステータス不整合が検出されました。/);
  });
});
