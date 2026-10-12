import { fetchActivitiesByRepresentative, type FetchActivitiesByRepresentativeInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-1506: 営業担当者の活動実績と目標値の差分が自動計算されて達成度がパーセンテージと色分けで表示される", () => {
  const mockDataStore = require("../../src/platform/data-store");

  const salesRepresentativeId = "550e8400-e29b-41d4-a716-446655440001";

  const salesRepresentativeRecords = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      営業担当者ID: "550e8400-e29b-41d4-a716-446655440001",
      名前: "田中太郎",
      メールアドレス: "tanaka@example.com",
      電話番号: "09012345678",
      部門: "営業部",
      役職: "営業課長",
      上司ID: "550e8400-e29b-41d4-a716-446655440002",
      ステータス: "active",
      作成日時: "2025-01-01T10:00:00Z",
      更新日時: "2025-01-15T14:30:00Z",
      作成者: "admin",
    },
  ];

  const activityRecords = [
    {
      id: "660e8400-e29b-41d4-a716-446655440001",
      activityId: "660e8400-e29b-41d4-a716-446655440001",
      customerId: "770e8400-e29b-41d4-a716-446655440001",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440001",
      activityType: "訪問",
      activityDateTime: "2025-01-20T09:00:00Z",
      activityContent: "契約内容確認",
      nextFollowUpScheduledDate: "2025-01-27T09:00:00Z",
      dealId: "880e8400-e29b-41d4-a716-446655440001",
      estimatedAmount: 1500000,
      contractedFlag: false,
      activityDurationMinutes: 120,
      activityCount: 1,
      activityFrequency: "weekly",
      activityResult: "positive",
      nextAction: "提案書送付",
      createdAt: "2025-01-20T09:30:00Z",
      updatedAt: "2025-01-20T09:30:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440001",
      updatedBy: "550e8400-e29b-41d4-a716-446655440001",
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440002",
      activityId: "660e8400-e29b-41d4-a716-446655440002",
      customerId: "770e8400-e29b-41d4-a716-446655440002",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440001",
      activityType: "電話",
      activityDateTime: "2025-01-19T14:00:00Z",
      activityContent: "進捗確認",
      nextFollowUpScheduledDate: "2025-01-26T14:00:00Z",
      dealId: "880e8400-e29b-41d4-a716-446655440002",
      estimatedAmount: 2500000,
      contractedFlag: false,
      activityDurationMinutes: 30,
      activityCount: 1,
      activityFrequency: "biweekly",
      activityResult: "neutral",
      nextAction: "資料修正",
      createdAt: "2025-01-19T14:15:00Z",
      updatedAt: "2025-01-19T14:15:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440001",
      updatedBy: "550e8400-e29b-41d4-a716-446655440001",
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440003",
      activityId: "660e8400-e29b-41d4-a716-446655440003",
      customerId: "770e8400-e29b-41d4-a716-446655440003",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440001",
      activityType: "メール",
      activityDateTime: "2025-01-18T10:00:00Z",
      activityContent: "初期相談",
      nextFollowUpScheduledDate: "2025-01-25T10:00:00Z",
      dealId: "880e8400-e29b-41d4-a716-446655440003",
      estimatedAmount: 800000,
      contractedFlag: false,
      activityDurationMinutes: 15,
      activityCount: 1,
      activityFrequency: "weekly",
      activityResult: "positive",
      nextAction: "提案依頼",
      createdAt: "2025-01-18T10:30:00Z",
      updatedAt: "2025-01-18T10:30:00Z",
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

  test("営業担当者の活動実績が活動日時の降順で3件返される", async () => {
    const input: FetchActivitiesByRepresentativeInput = {
      salesRepresentativeId,
    };

    const result = await fetchActivitiesByRepresentative(input);

    expect(result).toBeDefined();
    expect(result.activities).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();

    // 活動日時の降順を確認（2025-01-20T09:00:00Z、2025-01-19T14:00:00Z、2025-01-18T10:00:00Z）
    expect(result.activities[0].activityDateTime).toBe("2025-01-20T09:00:00Z");
    expect(result.activities[1].activityDateTime).toBe("2025-01-19T14:00:00Z");
    expect(result.activities[2].activityDateTime).toBe("2025-01-18T10:00:00Z");

    // 各レコードのすべてのフィールドを確認
    expect(result.activities[0].activityId).toBe("660e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[0].customerId).toBe("770e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[0].activityType).toBe("訪問");
    expect(result.activities[0].activityContent).toBe("契約内容確認");
    expect(result.activities[0].dealId).toBe("880e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[0].estimatedAmount).toBe(1500000);
    expect(result.activities[0].contractedFlag).toBe(false);

    expect(result.activities[1].activityId).toBe("660e8400-e29b-41d4-a716-446655440002");
    expect(result.activities[1].customerId).toBe("770e8400-e29b-41d4-a716-446655440002");
    expect(result.activities[1].activityType).toBe("電話");
    expect(result.activities[1].activityContent).toBe("進捗確認");
    expect(result.activities[1].dealId).toBe("880e8400-e29b-41d4-a716-446655440002");
    expect(result.activities[1].estimatedAmount).toBe(2500000);
    expect(result.activities[1].contractedFlag).toBe(false);

    expect(result.activities[2].activityId).toBe("660e8400-e29b-41d4-a716-446655440003");
    expect(result.activities[2].customerId).toBe("770e8400-e29b-41d4-a716-446655440003");
    expect(result.activities[2].activityType).toBe("メール");
    expect(result.activities[2].activityContent).toBe("初期相談");
    expect(result.activities[2].dealId).toBe("880e8400-e29b-41d4-a716-446655440003");
    expect(result.activities[2].estimatedAmount).toBe(800000);
    expect(result.activities[2].contractedFlag).toBe(false);

    // fetchedAtがISO 8601形式であることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
