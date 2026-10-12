import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import type {
  FetchActivitiesByRepresentativeOutput,
  SaveActivityOutput,
} from '../../src/logic/data-persistence';
import * as platformDataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1492: ダッシュボード表示データの鮮度が営業部長の意思決定に必要か判定され、鮮度不足の場合に警告が発行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者ID で営業活動を取得し、活動日時の降順で返却され、fetchedAt が ISO 8601 形式で含まれる', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    // 前提データ: 営業活動テーブルの全レコード
    const activities: SaveActivityOutput[] = [
      {
        activityId: '650e8400-e29b-41d4-a716-446655440001',
        customerId: '750e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '訪問',
        activityDateTime: '2024-01-10T14:00:00Z',
        activityContent: '新商品提案',
        nextFollowUpScheduledDate: '2024-01-17T10:00:00Z',
        dealId: '850e8400-e29b-41d4-a716-446655440001',
        estimatedAmount: 500000,
        contractedFlag: false,
        activityDurationMinutes: 60,
        activityCount: 1,
        activityFrequency: '月1回',
        activityResult: '商品提案完了',
        nextAction: '見積金額の確認',
        createdAt: '2024-01-10T14:30:00Z',
        updatedAt: '2024-01-10T14:30:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
      {
        activityId: '650e8400-e29b-41d4-a716-446655440002',
        customerId: '750e8400-e29b-41d4-a716-446655440002',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '電話',
        activityDateTime: '2024-01-08T10:00:00Z',
        activityContent: '進捗確認',
        nextFollowUpScheduledDate: '2024-01-15T15:00:00Z',
        dealId: '850e8400-e29b-41d4-a716-446655440002',
        estimatedAmount: 300000,
        contractedFlag: false,
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: '週1回',
        activityResult: '進捗確認完了',
        nextAction: '契約書確認',
        createdAt: '2024-01-08T10:15:00Z',
        updatedAt: '2024-01-08T10:15:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
    ];

    (platformDataStore.listRecords as jest.Mock).mockResolvedValue(activities);

    const result: FetchActivitiesByRepresentativeOutput =
      await fetchActivitiesByRepresentative({
        salesRepresentativeId,
      });

    // 検証 1: activities に営業担当者ID='550e8400-e29b-41d4-a716-446655440000' の営業活動レコード 2 件が活動日時の降順で含まれる
    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityDateTime).toBe('2024-01-10T14:00:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-01-08T10:00:00Z');
    expect(result.activities[0].salesRepresentativeId).toBe(salesRepresentativeId);
    expect(result.activities[1].salesRepresentativeId).toBe(salesRepresentativeId);

    // 検証 2: totalCount=2
    expect(result.totalCount).toBe(2);

    // 検証 3: fetchedAt が ISO 8601 形式の文字列として返却される
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
    // ISO 8601 形式の検証（例: 2024-01-15T16:45:30.123Z）
    const iso8601Regex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(iso8601Regex.test(result.fetchedAt)).toBe(true);
  });
});
