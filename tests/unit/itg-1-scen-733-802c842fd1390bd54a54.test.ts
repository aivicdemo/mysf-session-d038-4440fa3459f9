import { saveActivity, SaveActivityInput, SaveActivityOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-733: 更新時、出力されたupdatedAtが操作実行日時以降の日時に更新されている', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update activity and set updatedAt to operationTimestamp or later', async () => {
    const activityId = '550e8400-e29b-41d4-a716-446655440000';
    const operationTimestamp = '2026-01-15T14:00:00Z';
    const updatedAtValue = '2026-01-15T14:00:00Z';

    (dataStore.listRecords as jest.Mock).mockImplementation((table) => {
      if (table === '営業活動') return Promise.resolve([{
        営業活動ID: activityId,
        取引先ID: '660e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '770e8400-e29b-41d4-a716-446655440002',
        活動種別: '訪問',
        活動日時: '2026-01-15T10:30:00Z',
        活動内容: '初回訪問時の古い内容',
        次回フォローアップ予定日: '2026-01-20',
        商談ID: '880e8400-e29b-41d4-a716-446655440003',
        見積金額: 300000,
        成約フラグ: false,
        活動時間: 30,
        活動件数: 1,
        活動頻度: '初回',
        活動結果: '保留',
        次のアクション: null,
        作成日時: '2026-01-10T09:00:00Z',
        作成者ID: 'aa0e8400-e29b-41d4-a716-446655440005',
        更新日時: '2026-01-10T09:00:00Z',
        更新者ID: 'aa0e8400-e29b-41d4-a716-446655440005'
      }]);
      if (table === '取引先') return Promise.resolve([{
        取引先ID: '660e8400-e29b-41d4-a716-446655440001',
        取引先名: '株式会社テスト',
        ステータス: '有効'
      }]);
      if (table === '営業担当者') return Promise.resolve([{
        営業担当者ID: '770e8400-e29b-41d4-a716-446655440002',
        名前: '山田太郎',
        ステータス: '有効'
      }]);
      if (table === '商談') return Promise.resolve([{
        商談ID: '880e8400-e29b-41d4-a716-446655440003',
        取引先ID: '660e8400-e29b-41d4-a716-446655440001'
      }]);
      if (table === '活動タイプ') return Promise.resolve([{
        活動タイプ名: '訪問',
        有効フラグ: true
      }]);
      if (table === '活動結果') return Promise.resolve([{
        活動結果名: '成功',
        有効フラグ: true
      }]);
      if (table === '活動頻度') return Promise.resolve([{
        活動頻度名: '継続',
        有効フラグ: true
      }]);
      return Promise.resolve([]);
    });

    (dataStore.updateRecord as jest.Mock).mockResolvedValue({
      営業活動ID: activityId,
      取引先ID: '660e8400-e29b-41d4-a716-446655440001',
      営業担当者ID: '770e8400-e29b-41d4-a716-446655440002',
      活動種別: '訪問',
      活動日時: '2026-01-15T10:30:00Z',
      活動内容: '顧客先を訪問し、新製品について説明した。',
      次回フォローアップ予定日: '2026-01-22',
      商談ID: '880e8400-e29b-41d4-a716-446655440003',
      見積金額: 500000,
      成約フラグ: false,
      活動時間: 60,
      活動件数: 1,
      活動頻度: '継続',
      活動結果: '成功',
      次のアクション: '提案資料を作成して送付する',
      作成日時: '2026-01-10T09:00:00Z',
      作成者ID: 'aa0e8400-e29b-41d4-a716-446655440005',
      更新日時: updatedAtValue,
      更新者ID: '990e8400-e29b-41d4-a716-446655440004'
    });

    const input: SaveActivityInput = {
      activityId: activityId,
      customerId: '660e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
      activityType: '訪問',
      activityDateTime: '2026-01-15T10:30:00Z',
      activityContent: '顧客先を訪問し、新製品について説明した。',
      nextFollowUpScheduledDate: '2026-01-22',
      dealId: '880e8400-e29b-41d4-a716-446655440003',
      estimatedAmount: 500000,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '継続',
      activityResult: '成功',
      nextAction: '提案資料を作成して送付する',
      currentUserId: '990e8400-e29b-41d4-a716-446655440004',
      operationTimestamp: operationTimestamp
    };

    const result = await saveActivity(input);

    expect(result.updatedAt).toBeDefined();
    const updatedAtDate = new Date(result.updatedAt);
    const operationTimestampDate = new Date(operationTimestamp);
    expect(updatedAtDate.getTime()).toBeGreaterThanOrEqual(operationTimestampDate.getTime());

    expect(dataStore.updateRecord).toHaveBeenCalled();
  });
});
