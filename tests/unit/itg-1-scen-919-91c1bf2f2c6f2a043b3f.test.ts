import { fetchAnomalyDetectionLogsByType, AnomalyTypeNotFound, DataStoreError } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-919: 指定された異常タイプに該当するレコードが1件も存在しない場合、AnomalyTypeNotFoundエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AnomalyTypeNotFound エラーが発生し、エラー文言が正確である', async () => {
    const mockListRecords = listRecords as jest.Mock;
    mockListRecords.mockResolvedValue([]);

    const input = {
      anomalyType: '金額ズレ',
    };

    await expect(dataPersistence.fetchAnomalyDetectionLogsByType(input)).rejects.toThrow(AnomalyTypeNotFound);
    await expect(dataPersistence.fetchAnomalyDetectionLogsByType(input)).rejects.toThrow(
      "指定された異常タイプ '金額ズレ' に該当する異常検知ログが見つかりません。"
    );
  });
});
