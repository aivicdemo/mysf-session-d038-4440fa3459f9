import { fetchActivitiesByRepresentative, type FetchActivitiesByRepresentativeInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-1502: 営業成績金額と請求金額が一致しない場合に差異額と差異理由がハイライト表示される", () => {
  const mockDataStore = require("../../src/platform/data-store");

  const salesRepresentativeId = "550e8400-e29b-41d4-a716-446655440000";

  const salesRepresentativeRecords = [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      営業担当者ID: "550e8400-e29b-41d4-a716-446655440000",
      名前: "田中太郎",
      メールアドレス: "tanaka@example.com",
      電話番号: "090-1234-5678",
      部門: "営業部",
      役職: "営業課長",
      上司ID: "550e8400-e29b-41d4-a716-446655440001",
      ステータス: "active",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      作成者: "admin",
    },
  ];

  const activityRecords = [
    {
      id: "660e8400-e29b-41d4-a716-446655440001",
      activityId: "660e8400-e29b-41d4-a716-446655440001",
      customerId: "770e8400-e29b-41d4-a716-446655440001",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440000",
      activityType: "商談",
      activityDateTime: "2024-06-15T10:30:00Z",
      activityContent: "製品デモ実施",
      nextFollowUpScheduledDate: "2024-06-22T00:00:00Z",
      dealId: "880e8400-e29b-41d4-a716-446655440001",
      estimatedAmount: 5000000,
      contractedFlag: true,
      activityDurationMinutes: 120,
      activityCount: 1,
      activityFrequency: "初回",
      activityResult: "成功",
      nextAction: "契約書作成",
      createdAt: "2024-06-15T10:30:00Z",
      updatedAt: "2024-06-15T10:30:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440000",
      updatedBy: "550e8400-e29b-41d4-a716-446655440000",
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440002",
      activityId: "660e8400-e29b-41d4-a716-446655440002",
      customerId: "770e8400-e29b-41d4-a716-446655440002",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440000",
      activityType: "商談",
      activityDateTime: "2024-06-20T14:00:00Z",
      activityContent: "契約内容確認",
      nextFollowUpScheduledDate: "2024-06-27T00:00:00Z",
      dealId: "880e8400-e29b-41d4-a716-446655440002",
      estimatedAmount: 3000000,
      contractedFlag: true,
      activityDurationMinutes: 90,
      activityCount: 1,
      activityFrequency: "フォローアップ",
      activityResult: "成功",
      nextAction: "請求書作成",
      createdAt: "2024-06-20T14:00:00Z",
      updatedAt: "2024-06-20T14:00:00Z",
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

  test("営業活動レコードが活動日時の降順で返される", async () => {
    const input: FetchActivitiesByRepresentativeInput = {
      salesRepresentativeId,
    };

    const result = await fetchActivitiesByRepresentative(input);

    expect(result).toBeDefined();
    expect(result.activities).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toBeDefined();

    // 活動日時降順を確認（第1要素が2024-06-20T14:00:00Z、第2要素が2024-06-15T10:30:00Z）
    expect(result.activities[0].activityId).toBe("660e8400-e29b-41d4-a716-446655440002");
    expect(result.activities[0].activityDateTime).toBe("2024-06-20T14:00:00Z");
    expect(result.activities[0].estimatedAmount).toBe(3000000);
    expect(result.activities[0].contractedFlag).toBe(true);

    expect(result.activities[1].activityId).toBe("660e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[1].activityDateTime).toBe("2024-06-15T10:30:00Z");
    expect(result.activities[1].estimatedAmount).toBe(5000000);
    expect(result.activities[1].contractedFlag).toBe(true);

    // fetchedAtがISO 8601形式であることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
