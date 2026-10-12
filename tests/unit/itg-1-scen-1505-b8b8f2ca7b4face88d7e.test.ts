import { fetchActivitiesByRepresentative, type FetchActivitiesByRepresentativeInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-1505: 営業担当者別・顧客別の請求金額合計・未請求案件・金額ズレが自動集計・検証されて異常値がハイライト表示される", () => {
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
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
      作成者: "admin",
    },
  ];

  const activityRecords = [
    {
      id: "660e8400-e29b-41d4-a716-446655440001",
      activityId: "660e8400-e29b-41d4-a716-446655440001",
      customerId: "770e8400-e29b-41d4-a716-446655440001",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440001",
      activityType: "電話",
      activityDateTime: "2026-01-15T14:30:00.000Z",
      activityContent: "顧客A への提案説明",
      nextFollowUpScheduledDate: "2026-01-22T10:00:00.000Z",
      dealId: "880e8400-e29b-41d4-a716-446655440001",
      estimatedAmount: 500000,
      contractedFlag: false,
      activityDurationMinutes: 30,
      activityCount: 1,
      activityFrequency: "週1回",
      activityResult: "提案内容に興味あり",
      nextAction: "見積書を送付予定",
      createdAt: "2026-01-15T14:30:00.000Z",
      updatedAt: "2026-01-15T14:30:00.000Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440001",
      updatedBy: "550e8400-e29b-41d4-a716-446655440001",
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440002",
      activityId: "660e8400-e29b-41d4-a716-446655440002",
      customerId: "770e8400-e29b-41d4-a716-446655440002",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440001",
      activityType: "訪問",
      activityDateTime: "2026-01-10T10:00:00.000Z",
      activityContent: "顧客B との初回ヒアリング",
      nextFollowUpScheduledDate: "2026-01-17T15:00:00.000Z",
      dealId: "880e8400-e29b-41d4-a716-446655440002",
      estimatedAmount: 300000,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: "初回",
      activityResult: "ニーズ確認完了",
      nextAction: "提案資料作成",
      createdAt: "2026-01-10T10:00:00.000Z",
      updatedAt: "2026-01-10T10:00:00.000Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440001",
      updatedBy: "550e8400-e29b-41d4-a716-446655440001",
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440003",
      activityId: "660e8400-e29b-41d4-a716-446655440003",
      customerId: "770e8400-e29b-41d4-a716-446655440003",
      salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440003",
      activityType: "メール",
      activityDateTime: "2026-01-12T09:00:00.000Z",
      activityContent: "顧客C への資料送付",
      nextFollowUpScheduledDate: "2026-01-19T14:00:00.000Z",
      dealId: "880e8400-e29b-41d4-a716-446655440003",
      estimatedAmount: 200000,
      contractedFlag: false,
      activityDurationMinutes: 15,
      activityCount: 1,
      activityFrequency: "不定期",
      activityResult: "資料受領確認",
      nextAction: "1週間後にフォローアップ",
      createdAt: "2026-01-12T09:00:00.000Z",
      updatedAt: "2026-01-12T09:00:00.000Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440003",
      updatedBy: "550e8400-e29b-41d4-a716-446655440003",
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

  test("営業担当者ID「550e8400-e29b-41d4-a716-446655440001」に属する営業活動レコード2件が活動日時の降順で返される", async () => {
    const input: FetchActivitiesByRepresentativeInput = {
      salesRepresentativeId,
    };

    const result = await fetchActivitiesByRepresentative(input);

    expect(result).toBeDefined();
    expect(result.activities).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toBeDefined();

    // 活動日時降順を確認（第1要素が2026-01-15T14:30:00.000Z、第2要素が2026-01-10T10:00:00.000Z）
    expect(result.activities[0].activityDateTime).toBe("2026-01-15T14:30:00.000Z");
    expect(result.activities[1].activityDateTime).toBe("2026-01-10T10:00:00.000Z");

    // 各レコードのフィールドを確認
    expect(result.activities[0].activityId).toBe("660e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[0].customerId).toBe("770e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[0].activityType).toBe("電話");
    expect(result.activities[0].activityContent).toBe("顧客A への提案説明");
    expect(result.activities[0].dealId).toBe("880e8400-e29b-41d4-a716-446655440001");
    expect(result.activities[0].estimatedAmount).toBe(500000);
    expect(result.activities[0].contractedFlag).toBe(false);

    expect(result.activities[1].activityId).toBe("660e8400-e29b-41d4-a716-446655440002");
    expect(result.activities[1].customerId).toBe("770e8400-e29b-41d4-a716-446655440002");
    expect(result.activities[1].activityType).toBe("訪問");
    expect(result.activities[1].activityContent).toBe("顧客B との初回ヒアリング");
    expect(result.activities[1].dealId).toBe("880e8400-e29b-41d4-a716-446655440002");
    expect(result.activities[1].estimatedAmount).toBe(300000);
    expect(result.activities[1].contractedFlag).toBe(false);

    // fetchedAtがISO 8601形式であることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
