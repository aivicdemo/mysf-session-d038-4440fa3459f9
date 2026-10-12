import { transitionDealStage, DealNotFoundError } from '../../src/logic/deal-stage-transition';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-144: エラー系：指定された商談IDが存在しない場合、DealNotFoundError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DealNotFoundError が発生し、エラー文言に「商談が見つかりません: 550e8400-e29b-41d4-a716-446655440000。」を含む', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-001';
    const executionTimestamp = 1700000000000;

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(null);

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(DealNotFoundError);

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(/商談が見つかりません: 550e8400-e29b-41d4-a716-446655440000/);
  });
});
