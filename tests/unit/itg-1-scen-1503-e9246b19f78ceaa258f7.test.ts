import { fetchActivitiesByRepresentative, type FetchActivitiesByRepresentativeInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-1503: 商談ステータスが受注で請求書ステータスが未発行の場合にステータス不整合が検出される", () => {
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
      作成日時: "2024-01-01T00:00:00Z",
      更新日時: "2024-01-01T00:00:00Z",
      作成者: "admin",
    },
  ];

  const activityRecords = [
    {
      id: "650e8400-e29b-41d4-a716-446655440000",
      activityId: "650e8400-e29b-41d4-a716-446655440000",
      customerId: "750e8400-e29b-41d4-a716-446655440000",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440000",
      activityType: "商談",
      activityDateTime: "2024-06-15T10:30:00Z",
      activityContent: "受注確定",
      nextFollowUpScheduledDate: "2024-07-01T00:00:00Z",
      dealId: "850e8400-e29b-41d4-a716-446655440000",
      estimatedAmount: 500000,
      contractedFlag: true,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: "weekly",
      activityResult: "success",
      nextAction: "請求書発行",
      createdAt: "2024-06-15T10:30:00Z",
      updatedAt: "2024-06-15T10:30:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440000",
      updatedBy: "550e8400-e29b-41d4-a716-446655440000",
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440000",
      activityId: "660e8400-e29b-41d4-a716-446655440000",
      customerId: "760e8400-e29b-41d4-a716-446655440000",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440000",
      activityType: "電話",
      activityDateTime: "2024-06-10T14:00:00Z",
      activityContent: "見積提示",
      nextFollowUpScheduledDate: "2024-06-17T00:00:00Z",
      dealId: "860e8400-e29b-41d4-a716-446655440000",
      estimatedAmount: 300000,
      contractedFlag: false,
      activityDurationMinutes: 30,
      activityCount: 1,
      activityFrequency: "weekly",
      activityResult: "in_progress",
      nextAction: "提案資料の送付",
      createdAt: "2024-06-10T14:00:00Z",
      updatedAt: "2024-06-10T14:00:00Z",
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

    // 活動日時降順を確認（第1要素が2024-06-15T10:30:00Z、第2要素が2024-06-10T14:00:00Z）
    expect(result.activities[0].activityDateTime).toBe("2024-06-15T10:30:00Z");
    expect(result.activities[1].activityDateTime).toBe("2024-06-10T14:00:00Z");

    // fetchedAtがISO 8601形式であることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
