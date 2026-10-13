import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-244: 指定期間内に該当レコードが存在しないとき', () => {
  it('3つの履歴タイプすべてが空配列で総レコード数ゼロ・保管期間超過件数ゼロで返す', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

    mockListRecords.mockResolvedValue([]);

    const result = await retrieveMonitoringLogsAndCorrectionHistory({
      startDateTime: '2025-01-15T10:00:00Z',
      endDateTime: '2025-01-15T18:00:00Z',
      retentionDays: 90,
    });

    expect(result.confirmationHistory).toEqual([]);
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.csvExportAuditHistory).toEqual([]);
    expect(result.totalRecordCount).toBe(0);
    expect(result.retentionExceededCount).toBe(0);

    expect(mockListRecords).toHaveBeenCalledWith('差異確認履歴');
    expect(mockListRecords).toHaveBeenCalledWith('是正追跡管理');
    expect(mockListRecords).toHaveBeenCalledWith('CSV出力実行履歴');
  });
});
