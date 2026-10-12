import { saveActivity, SaveActivityInput, SaveActivityOutput, InvalidActivityType, InvalidActivityResult, InvalidActivityFrequency } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-732: 出力された営業活動IDが新規作成時のそれと一致し、createdByに現在のユーザーIDが設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new activity with a generated UUID and set createdBy to currentUserId', async () => {
    const mockActivityId = 'act-uuid-0001';
    const now = '2024-01-15T10:30:00Z';

    (dataStore.listRecords as jest.Mock).mockImplementation((table) => {
      if (table === '営業活動') return Promise.resolve([]);
      if (table === '取引先') return Promise.resolve([{
        id: 'cust-uuid-001',
        取引先ID: 'cust-uuid-001',
        取引先名: 'ABC株式会社',
        ステータス: '有効'
      }]);
      if (table === '営業担当者') return Promise.resolve([{
        id: 'rep-uuid-001',
        営業担当者ID: 'rep-uuid-001',
        名前: '営業太郎',
        ステータス: '有効'
      }]);
      if (table === '活動タイプ') return Promise.resolve([{
        id: 'acttype-uuid-001',
        活動タイプ名: '訪問',
        有効フラグ: true
      }]);
      if (table === '活動結果') return Promise.resolve([{
        id: 'actresult-uuid-001',
        活動結果名: '成功',
        有効フラグ: true
      }]);
      if (table === '活動頻度') return Promise.resolve([{
        id: 'actfreq-uuid-001',
        活動頻度名: '初回',
        有効フラグ: true
      }]);
      return Promise.resolve([]);
    });

    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      営業活動ID: mockActivityId,
      取引先ID: 'cust-uuid-001',
      営業担当者ID: 'rep-uuid-001',
      活動種別: '訪問',
      活動日時: '2024-01-15T10:30:00Z',
      活動内容: '顧客先での製品説明会',
      次回フォローアップ予定日: null,
      商談ID: null,
      見積金額: null,
      成約フラグ: false,
      活動時間: 60,
      活動件数: 1,
      活動頻度: '初回',
      活動結果: '成功',
      次のアクション: null,
      作成日時: now,
      作成者ID: 'user-uuid-001',
      更新日時: now,
      更新者ID: 'user-uuid-001'
    });

    const input: SaveActivityInput = {
      activityId: null,
      customerId: 'cust-uuid-001',
      salesRepresentativeId: 'rep-uuid-001',
      activityType: '訪問',
      activityDateTime: '2024-01-15T10:30:00Z',
      activityContent: '顧客先での製品説明会',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      nextAction: null,
      currentUserId: 'user-uuid-001',
      operationTimestamp: '2024-01-15T10:30:00Z'
    };

    const result = await saveActivity(input);

    expect(result).toBeDefined();
    expect(result.activityId).toBe(mockActivityId);
    expect(result.customerId).toBe('cust-uuid-001');
    expect(result.salesRepresentativeId).toBe('rep-uuid-001');
    expect(result.activityType).toBe('訪問');
    expect(result.activityDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.activityContent).toBe('顧客先での製品説明会');
    expect(result.nextFollowUpScheduledDate).toBeNull();
    expect(result.dealId).toBeNull();
    expect(result.estimatedAmount).toBeNull();
    expect(result.contractedFlag).toBe(false);
    expect(result.activityDurationMinutes).toBe(60);
    expect(result.activityCount).toBe(1);
    expect(result.activityFrequency).toBe('初回');
    expect(result.activityResult).toBe('成功');
    expect(result.nextAction).toBeNull();
    expect(result.createdAt).toBe(now);
    expect(result.updatedAt).toBe(now);
    expect(result.createdBy).toBe('user-uuid-001');

    expect(dataStore.createRecord).toHaveBeenCalled();
  });
});
