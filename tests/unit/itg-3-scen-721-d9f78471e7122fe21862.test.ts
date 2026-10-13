import { retrieveMonitoringLogsAndCorrectionHistory, InvalidDateRangeError, DataStoreError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-721: コンプライアンス保管期間ポリシーが未設定のとき、エラーが発生して処理が中断される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retentionDays が null のとき、エラーが発生する', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input = {
      startDateTime: '2024-01-01T00:00:00Z',
      endDateTime: '2024-01-31T23:59:59Z',
      retentionDays: null,
    };

    // retentionDays が null のため、エラーが発生することを期待
    await expect(
      retrieveMonitoringLogsAndCorrectionHistory(input)
    ).rejects.toThrow();
  });

  it('エラータイプが設計済みエラーのいずれかである', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input = {
      startDateTime: '2024-01-01T00:00:00Z',
      endDateTime: '2024-01-31T23:59:59Z',
      retentionDays: null,
    };

    try {
      await retrieveMonitoringLogsAndCorrectionHistory(input);
      fail('エラーが発生すべき');
    } catch (error) {
      const errorInstance = error as any;
      const errorName = errorInstance.constructor.name;
      const errorMessage = errorInstance.message;

      // 許可されたエラータイプかどうか確認
      const allowedErrors = [
        'InvalidDateRangeError',
        'DataStoreError',
      ];

      expect(allowedErrors).toContain(errorName);

      // エラーメッセージが期待値のいずれかであることを確認
      const allowedMessages = [
        '指定された期間が無効です。開始日時は終了日時以前である必要があります。',
        '監視ログと是正履歴の取得に失敗しました。',
      ];

      expect(allowedMessages.some(msg => errorMessage.includes(msg) || errorMessage === msg)).toBe(true);
    }
  });
});
