import { transitionDealStage, DealNotFoundError, RequiredFieldsNotSatisfiedError, InvoiceConsistencyViolationError, StageDefinitionNotFoundError, ValidationRuleEvaluationError } from '../../src/logic/deal-stage-transition';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';
import * as validationRuleEngine from '../../src/logic/validation-rule-engine';
import * as auditLogging from '../../src/logic/audit-logging';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');
jest.mock('../../src/logic/validation-rule-engine');
jest.mock('../../src/logic/audit-logging');

describe('SCEN-140: 正常系：許可された遷移パターンで必須フィールドがすべて満たされ、請求データも整合している場合、ステージ遷移が成功する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('success=true となり、ステージ遷移結果が返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-001';
    const executionTimestamp = 1700000000000;

    const mockDealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'ABC企業との大型案件',
      currentStage: '交渉',
      dealAmount: 5000000,
      accountName: 'ABC企業',
      productName: 'システム導入サービス',
      quoteDate: '2024-10-15',
      closedDate: null,
      lostReason: null,
      createdAt: 1698000000000,
      updatedAt: 1699000000000,
    };

    const mockDealStages = [
      { stageName: '初期接触', stageOrder: 1, isClosedWon: false, isClosedLost: false, isActive: true },
      { stageName: '提案', stageOrder: 2, isClosedWon: false, isClosedLost: false, isActive: true },
      { stageName: '交渉', stageOrder: 3, isClosedWon: false, isClosedLost: false, isActive: true },
      { stageName: '成約', stageOrder: 4, isClosedWon: true, isClosedLost: false, isActive: true },
    ];

    const mockStageTransitionRules = [
      { fromStage: '初期接触', allowedToStages: ['提案'] },
      { fromStage: '提案', allowedToStages: ['交渉', '失注'] },
      { fromStage: '交渉', allowedToStages: ['成約', '失注'] },
      { fromStage: '成約', allowedToStages: [] },
    ];

    const mockValidationRules = [
      {
        tableName: 'Deal',
        stageName: '成約',
        requiredFields: ['accountName', 'productName', 'dealAmount', 'quoteDate'],
        fieldValidations: [{ fieldName: 'dealAmount', validationType: 'numeric', minValue: 1, maxValue: null }],
      },
    ];

    const mockInvoices = [
      {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        totalAmount: 5000000,
        invoiceStatus: '確定済',
        lineItems: [
          { lineItemId: 'li-001', description: 'システム導入', amount: 3000000, quantity: 1 },
          { lineItemId: 'li-002', description: 'カスタマイズ費用', amount: 2000000, quantity: 1 },
        ],
        paymentStatus: '未入金',
        createdAt: 1699500000000,
      },
    ];

    const mockInvoiceIntegrityResult = {
      isConsistent: true,
      amountMatch: true,
      statusMatch: true,
      inconsistencies: [],
    };

    const mockValidationResult = {
      isValid: true,
      validationDetails: [
        { fieldName: 'accountName', isValid: true, message: null },
        { fieldName: 'productName', isValid: true, message: null },
        { fieldName: 'dealAmount', isValid: true, message: null },
        { fieldName: 'quoteDate', isValid: true, message: null },
      ],
    };

    const mockAuditResult = {
      operationId: 'audit-log-001',
      userId: 'user-001',
      action: 'STAGE_TRANSITION',
      resourceId: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: 1700000000000,
      status: 'SUCCESS',
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealRecord);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockDealStages);
    (dataPersistence.fetchDealStageTransitionRules as jest.Mock).mockResolvedValue(mockStageTransitionRules);
    (dataPersistence.fetchValidationRulesByTable as jest.Mock).mockResolvedValue(mockValidationRules);
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock).mockResolvedValue(mockInvoices);
    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue(mockInvoiceIntegrityResult);
    (validationRuleEngine.validateDataAgainstRules as jest.Mock).mockResolvedValue(mockValidationResult);
    (auditLogging.recordUserOperation as jest.Mock).mockResolvedValue(mockAuditResult);

    const result = await transitionDealStage({
      dealId,
      targetStage,
      userId,
      executionTimestamp,
    });

    expect(result.success).toBe(true);
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.previousStage).toBe('交渉');
    expect(result.newStage).toBe('成約');
    expect(result.validationResults).toHaveLength(3);
    expect(result.invoiceConsistencyStatus.totalDealsChecked).toBeGreaterThanOrEqual(1);
    expect(result.invoiceConsistencyStatus.amountDiscrepancies).toEqual([]);
    expect(result.invoiceConsistencyStatus.unbilledDeals).toEqual([]);
    expect(result.invoiceConsistencyStatus.statusMismatches).toEqual([]);
    expect(result.transitionTimestamp).toBeGreaterThanOrEqual(1700000000000);
    expect(result.errorDetails).toBeNull();

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith(dealId);
    expect(dataPersistence.fetchAllDealStages).toHaveBeenCalled();
    expect(dataPersistence.fetchDealStageTransitionRules).toHaveBeenCalled();
    expect(dataPersistence.fetchValidationRulesByTable).toHaveBeenCalledWith('Deal', '成約');
    expect(dataPersistence.fetchInvoiceWithLineItems).toHaveBeenCalledWith(dealId);
    expect(dealInvoiceReconciliation.validateInvoiceReferenceIntegrity).toHaveBeenCalled();
    expect(validationRuleEngine.validateDataAgainstRules).toHaveBeenCalled();
    expect(auditLogging.recordUserOperation).toHaveBeenCalled();
  });
});
