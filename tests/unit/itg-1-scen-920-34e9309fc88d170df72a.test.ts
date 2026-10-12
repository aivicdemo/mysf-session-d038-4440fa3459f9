import { fetchAnomalyDetectionLogsByType, DataStoreError } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-920: 異常検知ログテーブルへのアクセスに失敗した場合、DataStoreErrorエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DataStoreError エラーが発生し、エラー文言が「異常検知ログの取得に失敗しました。」である', async () => {
    const mockListRecords = listRecords as jest.Mock;
    mockListRecords.mockRejectedValue(new Error('DataStore connection failed'));

    const input = {
      anomalyType: '金額ズレ',
    };

    await expect(dataPersistence.fetchAnomalyDetectionLogsByType(input)).rejects.toThrow(DataStoreError);
    await expect(dataPersistence.fetchAnomalyDetectionLogsByType(input)).rejects.toThrow(
      '異常検知ログの取得に失敗しました。'
    );
  });
});
