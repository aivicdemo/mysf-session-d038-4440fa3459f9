jest.mock('../../src/platform/data-store');

import { retrieveMonitoringLogsAndCorrectionHistory, InvalidDateRangeError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

describe('SCEN-238: 開始日時が終了日時より後の場合、InvalidDateRangeErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
  });

  it('開始日時が終了日時より後のとき InvalidDateRangeError が発生する', async () => {
    const input = {
      startDateTime: '2024-01-15T10:30:00Z',
      endDateTime: '2024-01-10T14:20:00Z',
      retentionDays: 90,
    };

    await expect(retrieveMonitoringLogsAndCorrectionHistory(input)).rejects.toThrow(InvalidDateRangeError);
  });

  it('エラーメッセージが期待値と一致する', async () => {
    const input = {
      startDateTime: '2024-01-15T10:30:00Z',
      endDateTime: '2024-01-10T14:20:00Z',
      retentionDays: 90,
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

  it('エラーが発生する前にデータベースへのアクセスは行われない', async () => {
    const input = {
      startDateTime: '2024-01-15T10:30:00Z',
      endDateTime: '2024-01-10T14:20:00Z',
      retentionDays: 90,
    };

    try {
      await retrieveMonitoringLogsAndCorrectionHistory(input);
    } catch {
      // エラーは期待通り
    }

    expect(dataStore.listRecords).not.toHaveBeenCalled();
  });
});
