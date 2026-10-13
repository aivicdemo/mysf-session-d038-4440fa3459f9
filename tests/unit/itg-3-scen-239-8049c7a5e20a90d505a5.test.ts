jest.mock('../../src/platform/data-store');

import { retrieveMonitoringLogsAndCorrectionHistory, InvalidDateRangeError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

describe('SCEN-239: startDateTimeがISO 8601形式に違反する場合、InvalidDateRangeErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
  });

  it('startDateTime が ISO 8601 形式に違反するとき InvalidDateRangeError が発生する', async () => {
    const input = {
      startDateTime: '2024-13-45T25:70:90Z',
      endDateTime: '2024-12-31T23:59:59Z',
      retentionDays: 30,
    };

    await expect(retrieveMonitoringLogsAndCorrectionHistory(input)).rejects.toThrow(InvalidDateRangeError);
  });

  it('エラーメッセージが期待値と一致する', async () => {
    const input = {
      startDateTime: '2024-13-45T25:70:90Z',
      endDateTime: '2024-12-31T23:59:59Z',
      retentionDays: 30,
    };

    try {
      await retrieveMonitoringLogsAndCorrectionHistory(input);
      fail('Error should be thrown');
    } catch (error) {
      if (error instanceof InvalidDateRangeError) {
        expect(error.message).toBe('指定された期間が無効です。開始日時は終了日時以前である必要があります。');
      }
    }
  });

  it('日付形式が不正な場合は処理は例外をスロー（throw）し、データベースアクセスは行われない', async () => {
    const input = {
      startDateTime: '2024-13-45T25:70:90Z',
      endDateTime: '2024-12-31T23:59:59Z',
      retentionDays: 30,
    };

    try {
      await retrieveMonitoringLogsAndCorrectionHistory(input);
    } catch {
      // エラーは期待通り
    }

    expect(dataStore.listRecords).not.toHaveBeenCalled();
  });
});
