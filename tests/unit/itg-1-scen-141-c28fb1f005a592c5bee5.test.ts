import { transitionDealStage, InvalidStageTransitionError } from '../../src/logic/deal-stage-transition';
import * as dataPeristence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchDealStageTransitionRules: jest.fn(),
  fetchInvoiceWithLineItems: jest.fn(),
  fetchValidationRulesByTable: jest.fn(),
}));

describe('SCEN-141: 遷移ルール違反時に InvalidStageTransitionError が発生する', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetStage = '失注';
  const userId = 'user-001';
  const executionTimestamp = 1699564800000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('成約ステージから失注ステージへの遷移が許可されていない場合、InvalidStageTransitionError を throw する', async () => {
    const currentDealStageDefinition = {
      stage: '成約',
      order: 4,
      isClosedWon: true,
      isClosedLost: false,
      isActive: true,
    };

    const targetDealStageDefinition = {
      stage: '失注',
      order: 5,
      isClosedWon: false,
      isClosedLost: true,
      isActive: true,
    };

    const stageTransitionRules = [
      { stage: '初期接触', allowedNextStages: ['提案', '失注'] },
      { stage: '提案', allowedNextStages: ['交渉', '失注'] },
      { stage: '交渉', allowedNextStages: ['成約待ち', '失注'] },
      { stage: '成約待ち', allowedNextStages: ['成約', '失注'] },
      { stage: '成約', allowedNextStages: ['成約'] }, // 失注は許可されていない
    ];

    const dealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'Test Deal',
      currentStage: '成約',
      amount: 100000,
      contractDate: 1699478400000,
      closedLostReason: null,
    };

    const relatedInvoices = [
      {
        invoiceId: 'inv-001',
        invoiceStatus: '確定済',
        invoiceAmount: 100000,
        lineItems: [
          {
            lineItemId: 'line-001',
            amount: 100000,
            quantity: 1,
          },
        ],
      },
    ];

    const validationRules = [
      {
        tableName: '商談',
        stageName: '失注',
        requiredFields: ['失注理由'],
        fieldValidations: [
          {
            fieldName: '失注理由',
            isRequired: true,
            validation: 'notEmpty',
          },
        ],
      },
    ];

    (dataPeristence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: dealRecord.dealId,
      dealName: dealRecord.dealName,
      currentStage: dealRecord.currentStage,
      dealAmount: dealRecord.amount,
    });

    (dataPeristence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageName: '成約', stageOrder: 4, contractedStageFlag: true, lossStageFlag: false, validFlag: true },
        { stageName: '失注', stageOrder: 5, contractedStageFlag: false, lossStageFlag: true, validFlag: true },
      ],
    });

    (dataPeristence.fetchDealStageTransitionRules as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: '1', stageName: '初期接触', stageOrder: 1, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' },
        { stageId: '2', stageName: '提案', stageOrder: 2, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' },
        { stageId: '3', stageName: '交渉', stageOrder: 3, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' },
        { stageId: '4', stageName: '成約待ち', stageOrder: 4, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' },
        { stageId: '5', stageName: '成約', stageOrder: 5, contractedStageFlag: true, lossStageFlag: false, validFlag: true, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' },
        { stageId: '6', stageName: '失注', stageOrder: 6, contractedStageFlag: false, lossStageFlag: true, validFlag: true, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' },
      ],
      totalCount: 6,
      fetchedAt: new Date().toISOString(),
    });

    (dataPeristence.fetchInvoiceWithLineItems as jest.Mock).mockResolvedValue({
      invoice: { invoiceId: 'inv-001', invoiceStatus: '確定済', invoiceAmount: 100000 },
      lineItems: relatedInvoices[0].lineItems,
    });

    (dataPeristence.fetchValidationRulesByTable as jest.Mock).mockResolvedValue({
      validationRules,
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(
      'このステージへの遷移は営業プロセスで許可されていません。現在のステージ: 成約、遷移先: 失注。'
    );
  });
});
