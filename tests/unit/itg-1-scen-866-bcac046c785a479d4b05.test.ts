import { fetchAllActivityFrequencies } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-866: fetchAllActivityFrequencies - 活動頻度マスタに有効フラグ=falseのレコードが混在するとき、有効フラグ=trueのレコードのみを返す", () => {
  const mockActivityFrequencies = [
    {
      id: "freq-001",
      activityFrequencyId: "550e8400-e29b-41d4-a716-446655440001",
      activityFrequencyName: "日次",
      description: "毎日実施する活動",
      validFlag: true,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "freq-002",
      activityFrequencyId: "550e8400-e29b-41d4-a716-446655440002",
      activityFrequencyName: "週次",
      description: "毎週実施する活動",
      validFlag: true,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "freq-003",
      activityFrequencyId: "550e8400-e29b-41d4-a716-446655440003",
      activityFrequencyName: "月次",
      description: "毎月実施する活動",
      validFlag: false,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-02-01T14:30:00Z",
      createdBy: "system",
      updatedBy: "admin",
    },
    {
      id: "freq-004",
      activityFrequencyId: "550e8400-e29b-41d4-a716-446655440004",
      activityFrequencyName: "四半期次",
      description: "四半期ごとに実施する活動",
      validFlag: true,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "freq-005",
      activityFrequencyId: "550e8400-e29b-41d4-a716-446655440005",
      activityFrequencyName: "年次",
      description: "年1回実施する活動",
      validFlag: false,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-20T09:15:00Z",
      createdBy: "system",
      updatedBy: "admin",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("有効フラグ=true のレコードのみが activityFrequencies 配列に含まれる", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityFrequencies);

    const result = await fetchAllActivityFrequencies({});

    expect(result.activityFrequencies).toHaveLength(3);
    expect(result.activityFrequencies.map((f) => f.activityFrequencyId)).toEqual([
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002",
      "550e8400-e29b-41d4-a716-446655440004",
    ]);
  });

  it("有効フラグ=true のレコードの詳細情報が正確に返される", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityFrequencies);

    const result = await fetchAllActivityFrequencies({});

    const dailyRecord = result.activityFrequencies.find((f) => f.activityFrequencyId === "550e8400-e29b-41d4-a716-446655440001");
    expect(dailyRecord).toBeDefined();
    expect(dailyRecord?.activityFrequencyName).toBe("日次");
    expect(dailyRecord?.validFlag).toBe(true);

    const weeklyRecord = result.activityFrequencies.find((f) => f.activityFrequencyId === "550e8400-e29b-41d4-a716-446655440002");
    expect(weeklyRecord).toBeDefined();
    expect(weeklyRecord?.activityFrequencyName).toBe("週次");
    expect(weeklyRecord?.validFlag).toBe(true);

    const quarterlyRecord = result.activityFrequencies.find((f) => f.activityFrequencyId === "550e8400-e29b-41d4-a716-446655440004");
    expect(quarterlyRecord).toBeDefined();
    expect(quarterlyRecord?.activityFrequencyName).toBe("四半期次");
    expect(quarterlyRecord?.validFlag).toBe(true);
  });

  it("有効フラグ=false のレコード（月次、年次）は除外される", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityFrequencies);

    const result = await fetchAllActivityFrequencies({});

    const resultIds = result.activityFrequencies.map((f) => f.activityFrequencyId);
    expect(resultIds).not.toContain("550e8400-e29b-41d4-a716-446655440003");
    expect(resultIds).not.toContain("550e8400-e29b-41d4-a716-446655440005");
  });

  it("totalCount は 3 を返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityFrequencies);

    const result = await fetchAllActivityFrequencies({});

    expect(result.totalCount).toBe(3);
  });

  it("fetchedAt は ISO 8601 形式の現在日時文字列を返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityFrequencies);

    const result = await fetchAllActivityFrequencies({});

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);
  });
});
