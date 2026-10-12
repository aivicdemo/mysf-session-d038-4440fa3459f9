import { transitionDealStage } from '../../src/logic/deal-stage-transition';
import {
  fetchAllDealStages,
  fetchDealStageTransitionRules,
  fetchDealById,
  fetchValidationRulesByTable,
  fetchInvoiceWithLineItems,
} from '../../src/logic/data-persistence';
import type { TransitionDealStageInput, TransitionDealStageOutput } from '../../src/logic/deal-stage-transition';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-150: 商談金額が0以下の場合、警告メッセージが validationResults に追加される', () => {
  const mockFetchAllDealStages = fetchAllDealStages as jest.Mock;
  const mockFetchDealStageTransitionRules = fetchDealStageTransitionRules as jest.Mock;
  const mockFetchDealById = fetchDealById as jest.Mock;
  const mockFetchValidationRulesByTable = fetchValidationRulesByTable as jest.Mock;
  const mockFetchInvoiceWithLineItems = fetchInvoiceWithLineItems as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dealAmount=0 のとき、遷移は成功し、validationResults に警告メッセージが含まれる', async () => {
    const input: TransitionDealStageInput = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      targetStage: '成約',
      userId: 'user-001',
      executionTimestamp: 1700000000000,
    };

    mockFetchDealById.mockResolvedValue({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'テスト商談',
      currentStage: '提案',
      dealAmount: 0,
      customerId: 'cust-001',
      salesRepresentativeId: 'user-001',
      stageId: 'stage-002',
      expectedContractDate: '2024-12-31',
      contractedDate: null,
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-001',
    });

    mockFetchAllDealStages.mockResolvedValue({
      stages: [
        {
          stageId: 'stage-001',
          stageName: '初期接触',
          stageOrder: 1,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          stageId: 'stage-002',
          stageName: '提案',
          stageOrder: 2,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          stageId: 'stage-003',
          stageName: '成約',
          stageOrder: 3,
          description: null,
          contractedStageFlag: true,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 3,
      fetchedAt: '2024-01-01T00:00:00Z',
    });

    mockFetchDealStageTransitionRules.mockResolvedValue({
      stages: [
        {
          stageId: 'stage-002',
          stageName: '提案',
          stageOrder: 2,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-01T00:00:00Z',
    });

    mockFetchValidationRulesByTable.mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'vr-001',
          ruleName: 'dealAmount range check',
          ruleDescription: 'Deal amount must be >= 0.01',
          targetTable: 'Deal',
          targetColumn: 'dealAmount',
          validationType: 'range',
          validationCondition: 'min:0.01,max:null',
          errorMessage: '商談金額が0以下です。確認してください',
          warningLevel: 'warning',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-01T00:00:00Z',
    });

    mockFetchInvoiceWithLineItems.mockResolvedValue({
      invoice: {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        customerId: 'cust-001',
        salesRepresentativeId: 'user-001',
        invoiceNumber: 'INV-001',
        invoiceDate: '2024-01-01',
        dueDate: '2024-02-01',
        invoiceAmount: 0,
        taxAmount: 0,
        untaxedAmount: 0,
        invoiceStatus: '生成済',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'system',
      },
      lineItems: [
        {
          lineItemId: 'li-001',
          invoiceId: 'inv-001',
          dealId: '550e8400-e29b-41d4-a716-446655440000',
          activityId: null,
          lineNumber: 1,
          productName: 'テスト製品',
          productDescription: null,
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          taxRate: 0,
          taxAmount: 0,
          taxIncludedAmount: 0,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'system',
        },
      ],
    });

    const result = await transitionDealStage(input);

    expect(result.success).toBe(true);
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.previousStage).toBe('提案');
    expect(result.newStage).toBe('成約');
    expect(result.validationResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          validationType: expect.any(String),
          passed: expect.any(Boolean),
          details: expect.stringContaining('商談金額が0以下です。確認してください'),
        }),
      ])
    );
    expect(result.invoiceConsistencyStatus).toBeDefined();
    expect(result.errorDetails).toBeNull();
  });
});
