import { fetchActivitiesByRepresentative, type FetchActivitiesByRepresentativeInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-1507: 商談ステージ別進捗の件数・金額・達成度が計算されて目標値との差分がハイライト表示される", () => {
  const mockDataStore = require("../../src/platform/data-store");

  const salesRepresentativeId = "550e8400-e29b-41d4-a716-446655440001";

  const salesRepresentativeRecords = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      営業担当者ID: "550e8400-e29b-41d4-a716-446655440001",
      名前: "山田太郎",
      メールアドレス: "yamada@example.com",
      電話番号: "09012345678",
      部門: "営業部",
      役職: "営業課長",
      上司ID: "550e8400-e29b-41d4-a716-446655440002",
      ステータス: "active",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      作成者: "admin",
    },
  ];

  const activityRecords = [
    {
      id: "650e8400-e29b-41d4-a716-446655440001",
      activityId: "650e8400-e29b-41d4-a716-446655440001",
      customerId: "750e8400-e29b-41d4-a716-446655440001",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440001",
      activityType: "電話",
      activityDateTime: "2024-03-15T10:00:00Z",
      activityContent: "商品説明",
      nextFollowUpScheduledDate: "2024-03-22T00:00:00Z",
      dealId: "850e8400-e29b-41d4-a716-446655440001",
      estimatedAmount: 500000,
      contractedFlag: false,
      activityDurationMinutes: 30,
      activityCount: 1,
      activityFrequency: "週1回",
      activityResult: "好感触",
      nextAction: "提案資料送付",
      createdAt: "2024-03-15T10:00:00Z",
      updatedAt: "2024-03-15T10:00:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440001",
      updatedBy: "550e8400-e29b-41d4-a716-446655440001",
    },
    {
      id: "650e8400-e29b-41d4-a716-446655440002",
      activityId: "650e8400-e29b-41d4-a716-446655440002",
      customerId: "750e8400-e29b-41d4-a716-446655440002",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440001",
      activityType: "訪問",
      activityDateTime: "2024-03-20T14:30:00Z",
      activityContent: "要件ヒアリング",
      nextFollowUpScheduledDate: "2024-03-27T00:00:00Z",
      dealId: "850e8400-e29b-41d4-a716-446655440002",
      estimatedAmount: 1200000,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: "週2回",
      activityResult: "詳細要件確認",
      nextAction: "提案準備",
      createdAt: "2024-03-20T14:30:00Z",
      updatedAt: "2024-03-20T14:30:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440001",
      updatedBy: "550e8400-e29b-41d4-a716-446655440001",
    },
    {
      id: "650e8400-e29b-41d4-a716-446655440003",
      activityId: "650e8400-e29b-41d4-a716-446655440003",
      customerId: "750e8400-e29b-41d4-a716-446655440003",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440001",
      activityType: "メール",
      activityDateTime: "2024-03-10T09:00:00Z",
      activityContent: "提案資料送付",
      nextFollowUpScheduledDate: "2024-03-17T00:00:00Z",
      dealId: "850e8400-e29b-41d4-a716-446655440003",
      estimatedAmount: 300000,
      contractedFlag: false,
      activityDurationMinutes: 15,
      activityCount: 1,
      activityFrequency: "月1回",
      activityResult: "送付完了",
      nextAction: "反応待機",
      createdAt: "2024-03-10T09:00:00Z",
      updatedAt: "2024-03-10T09:00:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440001",
      updatedBy: "550e8400-e29b-41d4-a716-446655440001",
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

  test("営業活動レコード3件が活動日時の降順で返される", async () => {
    const input: FetchActivitiesByRepresentativeInput = {
      salesRepresentativeId,
    };

    const result = await fetchActivitiesByRepresentative(input);

    expect(result).toBeDefined();
    expect(result.activities).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();

    // 活動日時の降順を確認（2024-03-20T14:30:00Z → 2024-03-15T10:00:00Z → 2024-03-10T09:00:00Z）
    expect(result.activities[0].activityId).toBe("650e8400-e29b-41d4-a716-446655440002");
    expect(result.activities[0].activityDateTime).toBe("2024-03-20T14:30:00Z");
    expect(result.activities[0].customerId).toBe("750e8400-e29b-41d4-a716-446655440002");
    expect(result.activities[0].dealId).toBe("850e8400-e29b-41d4-a716-446655440002");
    expect(result.activities[0].estimatedAmount).toBe(1200000);
    expect(result.activities[0].activityType).toBe("訪問");

    expect(result.activities[1].activityId).toBe("650e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[1].activityDateTime).toBe("2024-03-15T10:00:00Z");
    expect(result.activities[1].customerId).toBe("750e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[1].dealId).toBe("850e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[1].estimatedAmount).toBe(500000);
    expect(result.activities[1].activityType).toBe("電話");

    expect(result.activities[2].activityId).toBe("650e8400-e29b-41d4-a716-446655440003");
    expect(result.activities[2].activityDateTime).toBe("2024-03-10T09:00:00Z");
    expect(result.activities[2].customerId).toBe("750e8400-e29b-41d4-a716-446655440003");
    expect(result.activities[2].dealId).toBe("850e8400-e29b-41d4-a716-446655440003");
    expect(result.activities[2].estimatedAmount).toBe(300000);
    expect(result.activities[2].activityType).toBe("メール");

    // fetchedAtがISO 8601形式であることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
