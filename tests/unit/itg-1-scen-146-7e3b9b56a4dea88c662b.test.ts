import { transitionDealStage, ValidationRuleEvaluationError } from '../../src/logic/deal-stage-transition';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';
import * as validationRuleEngine from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');
jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-146: エラー系：検証ルールの評価中にシステムエラーが発生した場合、ValidationRuleEvaluationError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ValidationRuleEvaluationError が発生し、エラーメッセージに「検証ルールの評価に失敗しました。システム管理者に連絡してください。」を含む', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-001';
    const executionTimestamp = 1699564800000;

    const mockDealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      currentStage: '提案',
      dealAmount: 1000000,
      accountName: 'テスト顧客A',
      closedDate: null,
      lossReason: null,
    };

    const mockDealStages = [
      { stage: '提案', order: 2, closedFlag: false, lossFlag: false, isActive: true, requiredFields: ['dealAmount', 'accountName'] },
      { stage: '成約', order: 4, closedFlag: true, lossFlag: false, isActive: true, requiredFields: ['dealAmount', 'accountName', 'closedDate'] },
    ];

    const mockStageTransitionRules = [
      { fromStage: '提案', allowedToStages: ['交渉', '失注'] },
      { fromStage: '交渉', allowedToStages: ['成約待ち', '失注'] },
    ];

    const mockValidationRules = [
      {
        id: 'rule-001',
        tableName: 'deal',
        fieldName: 'dealAmount',
        ruleType: 'REQUIRED',
        condition: 'field IS NOT NULL AND field > 0',
      },
      {
        id: 'rule-002',
        tableName: 'deal',
        fieldName: 'accountName',
        ruleType: 'REQUIRED',
        condition: 'field IS NOT NULL',
      },
    ];

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealRecord);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockDealStages);
    (dataPersistence.fetchDealStageTransitionRules as jest.Mock).mockResolvedValue(mockStageTransitionRules);
    (dataPersistence.fetchValidationRulesByTable as jest.Mock).mockResolvedValue(mockValidationRules);
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock).mockResolvedValue({ invoices: [], lineItems: [] });

    // validateDataAgainstRules が Error を throw する
    (validationRuleEngine.validateDataAgainstRules as jest.Mock).mockRejectedValue(
      new Error('Unexpected validation engine state')
    );

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(ValidationRuleEvaluationError);

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(/検証ルールの評価に失敗しました。システム管理者に連絡してください。/);
  });
});
