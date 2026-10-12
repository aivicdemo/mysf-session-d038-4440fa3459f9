import { transitionDealStage, DealNotFoundError } from '../../src/logic/deal-stage-transition';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
}));

describe('SCEN-148: 空文字の dealId で DealNotFoundError が返される', () => {
  const dealId = '';
  const targetStage = '成約';
  const userId = 'user-001';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dealId が空文字列の場合、DealNotFoundError が throw される', async () => {
    (dataPersistence.fetchDealById as jest.Mock).mockRejectedValue(
      new DealNotFoundError('商談が見つかりません: 。')
    );

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(DealNotFoundError);
  });
});
