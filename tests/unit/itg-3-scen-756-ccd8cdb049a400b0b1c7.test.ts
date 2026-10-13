import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import { DataStoreError } from '../../src/platform/data-store';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-756: 差異の数値が負の値の場合、エラーメッセージが返され判定が中止される', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when discrepancy amount is negative', async () => {
    const discrepancyId = 'diff-001';

    const discrepancyDetectionRecord = {
      差異ID: discrepancyId,
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '請求金額が一致しない',
      金額差異: -5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2026-01-15T10:30:00Z',
      重大度: 'high',
      原因分類: 'システム連携エラー',
      許容範囲判定: 'out_of_range',
      判定日時: '2026-01-15T11:00:00Z',
      判定者: 'user-001',
      id: discrepancyId,
    };

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve([discrepancyDetectionRecord]);
      throw new DataStoreError('データベースアクセスエラーが発生しました。');
    });

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({
        discrepancyId,
      })
    ).rejects.toThrow(DataStoreError);

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({
        discrepancyId,
      })
    ).rejects.toThrow('データベースアクセスエラーが発生しました。');
  });
});
