import { fetchActivitiesByRepresentative, type FetchActivitiesByRepresentativeInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-1501: 営業担当者がアクセスした日付から当月の集計対象期間と集計基準日が自動確定される", () => {
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
      役職: "営業担当者",
      上司ID: "550e8400-e29b-41d4-a716-446655440001",
      ステータス: "active",
      作成日時: "2024-01-01T00:00:00Z",
      更新日時: "2024-01-15T00:00:00Z",
      作成者: "admin",
    },
  ];

  const activityRecords = [
    {
      id: "660e8400-e29b-41d4-a716-446655440001",
      activityId: "660e8400-e29b-41d4-a716-446655440001",
      customerId: "770e8400-e29b-41d4-a716-446655440001",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440000",
      activityType: "訪問",
      activityDateTime: "2024-01-20T10:30:00Z",
      activityContent: "定期訪問、商品説明実施",
      nextFollowUpScheduledDate: "2024-02-03T00:00:00Z",
      dealId: "880e8400-e29b-41d4-a716-446655440001",
      estimatedAmount: 500000,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: "月1回",
      activityResult: "継続検討",
      nextAction: "見積書送付",
      createdAt: "2024-01-20T11:00:00Z",
      updatedAt: "2024-01-20T11:00:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440000",
      updatedBy: "550e8400-e29b-41d4-a716-446655440000",
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440002",
      activityId: "660e8400-e29b-41d4-a716-446655440002",
      customerId: "770e8400-e29b-41d4-a716-446655440002",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440000",
      activityType: "電話",
      activityDateTime: "2024-01-15T14:00:00Z",
      activityContent: "進捗確認",
      nextFollowUpScheduledDate: "2024-01-25T00:00:00Z",
      dealId: "880e8400-e29b-41d4-a716-446655440002",
      estimatedAmount: 300000,
      contractedFlag: false,
      activityDurationMinutes: 15,
      activityCount: 1,
      activityFrequency: "随時",
      activityResult: "情報収集",
      nextAction: "提案書作成",
      createdAt: "2024-01-15T14:30:00Z",
      updatedAt: "2024-01-15T14:30:00Z",
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

  test("営業担当者IDを指定して呼び出すと、活動日時降順で営業活動レコードが返される", async () => {
    const input: FetchActivitiesByRepresentativeInput = {
      salesRepresentativeId,
    };

    const result = await fetchActivitiesByRepresentative(input);

    expect(result).toBeDefined();
    expect(result.activities).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toBeDefined();

    // 活動日時降順を確認
    expect(result.activities[0].activityDateTime).toBe("2024-01-20T10:30:00Z");
    expect(result.activities[1].activityDateTime).toBe("2024-01-15T14:00:00Z");

    // 各フィールドを確認
    expect(result.activities[0].activityId).toBe("660e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[0].customerId).toBe("770e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[0].salesRepresentativeId).toBe(salesRepresentativeId);
    expect(result.activities[0].activityType).toBe("訪問");
    expect(result.activities[0].activityContent).toBe("定期訪問、商品説明実施");
    expect(result.activities[0].nextFollowUpScheduledDate).toBe("2024-02-03T00:00:00Z");
    expect(result.activities[0].dealId).toBe("880e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[0].estimatedAmount).toBe(500000);
    expect(result.activities[0].contractedFlag).toBe(false);
    expect(result.activities[0].activityDurationMinutes).toBe(60);
    expect(result.activities[0].activityResult).toBe("継続検討");
    expect(result.activities[0].nextAction).toBe("見積書送付");

    // fetchedAtがISO 8601形式であることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
