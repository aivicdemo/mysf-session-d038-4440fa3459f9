import { renderCorrectionTrackingHistory } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveCorrectionTrackingByDifferenceId: jest.fn(),
}));

describe('SCEN-303: renderCorrectionTrackingHistory - 指定された差異IDが存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された差異IDが差異検出結果テーブルに存在しない場合、DiscrepancyNotFoundエラーを発生させる', async () => {
    const discrepancyId = 'non-existent-diff-12345';

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue(null);

    await expect(renderCorrectionTrackingHistory({
      discrepancyId,
    })).rejects.toThrow(discrepancyPersistence.DiscrepancyNotFound);

    const error = new discrepancyPersistence.DiscrepancyNotFound();
    // エラーメッセージを確認するため、実装がエラーを投げる際に適切なメッセージを設定することを期待
  });
});
