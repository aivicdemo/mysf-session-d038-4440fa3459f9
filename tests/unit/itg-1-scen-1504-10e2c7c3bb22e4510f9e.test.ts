import { fetchActivitiesByRepresentative, type FetchActivitiesByRepresentativeInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-1504: 請求漏れ・遅延が判定されて優先度が分類されて営業担当者に通知される", () => {
  const mockDataStore = require("../../src/platform/data-store");

  const salesRepresentativeId = "550e8400-e29b-41d4-a716-446655440000";

  const salesRepresentativeRecords = [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      営業担当者ID: "550e8400-e29b-41d4-a716-446655440000",
      名前: "山田太郎",
      メールアドレス: "yamada@example.com",
      電話番号: "090-1234-5678",
      部門: "営業部",
      役職: "営業課長",
      上司ID: "550e8400-e29b-41d4-a716-446655440001",
      ステータス: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      作成者: "admin",
    },
  ];

  const activityRecords = [
    {
      id: "660e8400-e29b-41d4-a716-446655440001",
      activityId: "660e8400-e29b-41d4-a716-446655440001",
      customerId: "770e8400-e29b-41d4-a716-446655440001",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440000",
      activityType: "電話",
      activityDateTime: "2026-01-15T10:30:00Z",
      activityContent: "新規案件の打診",
      nextFollowUpScheduledDate: "2026-01-22T00:00:00Z",
      dealId: "880e8400-e29b-41d4-a716-446655440001",
      estimatedAmount: 500000,
      contractedFlag: false,
      activityDurationMinutes: 30,
      activityCount: 1,
      activityFrequency: "初回",
      activityResult: "受注予定",
      nextAction: "提案資料を送付",
      createdAt: "2026-01-15T10:30:00Z",
      updatedAt: "2026-01-15T10:30:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440000",
      updatedBy: "550e8400-e29b-41d4-a716-446655440000",
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440002",
      activityId: "660e8400-e29b-41d4-a716-446655440002",
      customerId: "770e8400-e29b-41d4-a716-446655440002",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440000",
      activityType: "訪問",
      activityDateTime: "2026-01-10T14:00:00Z",
      activityContent: "既存取引先のフォローアップ",
      nextFollowUpScheduledDate: "2026-01-31T00:00:00Z",
      dealId: "880e8400-e29b-41d4-a716-446655440002",
      estimatedAmount: 1200000,
      contractedFlag: true,
      activityDurationMinutes: 60,
      activityCount: 3,
      activityFrequency: "定期",
      activityResult: "成約",
      nextAction: "請求書発行待ち",
      createdAt: "2026-01-10T14:00:00Z",
      updatedAt: "2026-01-10T14:00:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440000",
      updatedBy: "550e8400-e29b-41d4-a716-446655440000",
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440003",
      activityId: "660e8400-e29b-41d4-a716-446655440003",
      customerId: "770e8400-e29b-41d4-a716-446655440003",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440000",
      activityType: "メール",
      activityDateTime: "2026-01-05T09:15:00Z",
      activityContent: "見積書の送付",
      nextFollowUpScheduledDate: "2026-01-12T00:00:00Z",
      dealId: "880e8400-e29b-41d4-a716-446655440003",
      estimatedAmount: 800000,
      contractedFlag: false,
      activityDurationMinutes: 15,
      activityCount: 1,
      activityFrequency: "初回",
      activityResult: "検討中",
      nextAction: "進捗確認コール",
      createdAt: "2026-01-05T09:15:00Z",
      updatedAt: "2026-01-05T09:15:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440000",
      updatedBy: "550e8400-e29b-41d4-a716-446655440000",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataStore.listRecords = jest.fn((tableName) => {
      if (tableName === "営業担当者") {
        return Promise.resolve(salesRepresentativeRecords);
      }
      if (tableName === "営業活動") {
        return Promise.resolve(activityRecords);
      }
      return Promise.resolve([]);
    });
  });

  test("営業担当者の営業活動レコード3件が活動日時の降順で返される", async () => {
    const input: FetchActivitiesByRepresentativeInput = {
      salesRepresentativeId,
    };

    const result = await fetchActivitiesByRepresentative(input);

    expect(result).toBeDefined();
    expect(result.activities).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();

    // 活動日時降順を確認（2026-01-15T10:30:00Z → 2026-01-10T14:00:00Z → 2026-01-05T09:15:00Z）
    expect(result.activities[0].activityDateTime).toBe("2026-01-15T10:30:00Z");
    expect(result.activities[1].activityDateTime).toBe("2026-01-10T14:00:00Z");
    expect(result.activities[2].activityDateTime).toBe("2026-01-05T09:15:00Z");

    // fetchedAtがISO 8601形式であることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
