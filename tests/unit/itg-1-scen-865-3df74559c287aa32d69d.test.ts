import { fetchAllActivityFrequencies } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-865: fetchAllActivityFrequencies - 活動頻度マスタが複数件存在し、すべてが有効フラグ=trueのとき、有効なレコード全件と総件数とISO 8601形式の取得時刻を返す", () => {
  const mockActivityFrequencies = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      activityFrequencyId: "550e8400-e29b-41d4-a716-446655440001",
      activityFrequencyName: "日次",
      description: "毎日実施される活動",
      validFlag: true,
      createdAt: "2024-01-01T08:00:00Z",
      updatedAt: "2024-01-01T08:00:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      activityFrequencyId: "550e8400-e29b-41d4-a716-446655440002",
      activityFrequencyName: "週次",
      description: "毎週実施される活動",
      validFlag: true,
      createdAt: "2024-01-05T10:30:00Z",
      updatedAt: "2024-01-05T10:30:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      activityFrequencyId: "550e8400-e29b-41d4-a716-446655440003",
      activityFrequencyName: "月次",
      description: "毎月実施される活動",
      validFlag: true,
      createdAt: "2024-01-10T14:15:00Z",
      updatedAt: "2024-01-10T14:15:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440004",
      activityFrequencyId: "550e8400-e29b-41d4-a716-446655440004",
      activityFrequencyName: "四半期",
      description: "四半期ごとに実施される活動",
      validFlag: true,
      createdAt: "2024-01-15T09:45:00Z",
      updatedAt: "2024-01-15T09:45:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("すべての有効フラグ=true のレコード 4 件を返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityFrequencies);

    const result = await fetchAllActivityFrequencies({});

    expect(result.activityFrequencies).toHaveLength(4);
    expect(result.activityFrequencies.map((f) => f.activityFrequencyId)).toEqual([
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002",
      "550e8400-e29b-41d4-a716-446655440003",
      "550e8400-e29b-41d4-a716-446655440004",
    ]);
  });

  it("totalCount は 4 を返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityFrequencies);

    const result = await fetchAllActivityFrequencies({});

    expect(result.totalCount).toBe(4);
  });

  it("fetchedAt は ISO 8601 形式 YYYY-MM-DDTHH:mm:ss.sssZ の文字列である", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityFrequencies);

    const result = await fetchAllActivityFrequencies({});

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);
  });

  it("すべてのレコードの validFlag は true である", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityFrequencies);

    const result = await fetchAllActivityFrequencies({});

    expect(result.activityFrequencies.every((f) => f.validFlag === true)).toBe(true);
  });
});
