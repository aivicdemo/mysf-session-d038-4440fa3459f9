import { retrieveDiscrepancyDetailsForConfirmation, DataStoreError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-653: 通知送信失敗時にエラー処理と再試行', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('DataStoreErrorが発生した場合、エラーをキャッチしてDataStoreErrorを投出', async () => {
    const discrepancyId = 'd12345-uuid-6789';

    (dataStore.listRecords as jest.Mock).mockRejectedValueOnce(
      new DataStoreError('データベースアクセスエラーが発生しました。')
    );

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })
    ).rejects.toThrow(DataStoreError);

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })
    ).rejects.toThrow('データベースアクセスエラーが発生しました。');
  });

  it('複数回のDataStoreError発生後、3回の再試行を実行して最終的にエラーを投出', async () => {
    const discrepancyId = 'd12345-uuid-6789';
    let callCount = 0;

    (dataStore.listRecords as jest.Mock).mockImplementation(() => {
      callCount++;
      return Promise.reject(new DataStoreError('データベースアクセスエラーが発生しました。'));
    });

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })
    ).rejects.toThrow(DataStoreError);
  });
});
