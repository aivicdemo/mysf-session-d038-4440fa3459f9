import { validateDealInvoiceLinkAndTransition, NoRelatedInvoices } from '../../src/logic/deal-invoice-link-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-303: NoRelatedInvoices エラーの返却', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談に紐付く請求書が1件も存在しない場合、NoRelatedInvoices エラーが返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '契約段階';
    const userId = 'user-12345';
    const operationTimestamp = new Date('2026-10-07T10:00:00Z');

    const dealRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'テスト商談A',
      dealAmount: 1000000,
      status: '提案中',
      closedDate: '2026-10-31',
      createdAt: new Date('2026-09-01T00:00:00Z'),
    };

    const relatedInvoices: any[] = [];

    const dealStageDefinition = [
      { stageName: '初期接触', stageOrder: 1, isClosedWon: false, isClosedLost: false },
      { stageName: '提案中', stageOrder: 2, isClosedWon: false, isClosedLost: false },
      { stageName: '契約段階', stageOrder: 3, isClosedWon: false, isClosedLost: false },
      { stageName: '成約', stageOrder: 4, isClosedWon: true, isClosedLost: false },
    ];

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(dealRecord);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(relatedInvoices);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(dealStageDefinition);

    await expect(
      validateDealInvoiceLinkAndTransition({
        dealId,
        targetStage,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(NoRelatedInvoices);

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith(dealId);
    expect(dataPersistence.fetchInvoicesForPeriod).toHaveBeenCalled();
  });

  it('NoRelatedInvoices エラーのメッセージが正しい', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '契約段階';
    const userId = 'user-12345';
    const operationTimestamp = new Date('2026-10-07T10:00:00Z');

    const dealRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'テスト商談A',
      dealAmount: 1000000,
      status: '提案中',
      closedDate: '2026-10-31',
      createdAt: new Date('2026-09-01T00:00:00Z'),
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(dealRecord);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageName: '初期接触', stageOrder: 1, isClosedWon: false, isClosedLost: false },
      { stageName: '提案中', stageOrder: 2, isClosedWon: false, isClosedLost: false },
      { stageName: '契約段階', stageOrder: 3, isClosedWon: false, isClosedLost: false },
      { stageName: '成約', stageOrder: 4, isClosedWon: true, isClosedLost: false },
    ]);

    try {
      await validateDealInvoiceLinkAndTransition({
        dealId,
        targetStage,
        userId,
        operationTimestamp,
      });
      fail('NoRelatedInvoices エラーがスローされるはず');
    } catch (error) {
      if (error instanceof NoRelatedInvoices) {
        expect(error.message).toBe('この商談に紐付く請求書がありません。請求書を生成してから遷移してください。');
      } else {
        throw error;
      }
    }
  });

});
