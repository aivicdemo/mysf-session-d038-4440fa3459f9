import { transitionDealStage, RequiredFieldsNotSatisfiedError } from '../../src/logic/deal-stage-transition';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as validationRuleEngine from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-142: エラー系：遷移先ステージで必須とされるフィールドが満たされていない場合、RequiredFieldsNotSatisfiedError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('RequiredFieldsNotSatisfiedError が発生し、エラー文言に「遷移先ステージに必要な項目が未入力です: requiredField1。」を含む', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-001';
    const executionTimestamp = 1704067200000;

    const mockDealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'A社新規導入案件',
      currentStage: '提案',
      dealAmount: 5000000,
      customerId: 'cust-001',
      createdAt: 1703980800000,
      updatedAt: 1704067200000,
    };

    const mockDealStages = [
      { stage: '提案', order: 2, isCloseStage: false, isLostStage: false, isActive: true },
      { stage: '成約', order: 4, isCloseStage: true, isLostStage: false, isActive: true },
    ];

    const mockStageTransitionRules = [
      {
        fromStage: '提案',
        allowedToStages: ['交渉', '成約', '失注'],
        requiredFieldsToAdvance: ['requiredField1', 'requiredField2', 'requiredField3', 'requiredField4'],
      },
      {
        fromStage: '交渉',
        allowedToStages: ['成約', '失注'],
        requiredFieldsToAdvance: ['requiredField1', 'requiredField2', 'requiredField3', 'requiredField4'],
      },
    ];

    const mockValidationRules = [
      {
        table: 'Deal',
        stage: '成約',
        requiredFields: ['requiredField1', 'requiredField2', 'requiredField3', 'requiredField4'],
        fieldValidations: { dealAmount: { min: 1, max: 999999999 } },
      },
    ];

    const mockValidationError = {
      isValid: false,
      validationDetails: [
        { fieldName: 'requiredField1', isValid: false, message: 'This field is required but missing' },
      ],
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealRecord);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockDealStages);
    (dataPersistence.fetchDealStageTransitionRules as jest.Mock).mockResolvedValue(mockStageTransitionRules);
    (dataPersistence.fetchValidationRulesByTable as jest.Mock).mockResolvedValue(mockValidationRules);
    (validationRuleEngine.validateDataAgainstRules as jest.Mock).mockResolvedValue(mockValidationError);

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(RequiredFieldsNotSatisfiedError);

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(/遷移先ステージに必要な項目が未入力です: requiredField1/);
  });
});
