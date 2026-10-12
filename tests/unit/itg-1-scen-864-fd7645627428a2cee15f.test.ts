import { fetchAllActivityResults } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";
import { DataStoreError } from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-864: fetchAllActivityResults - 有効フラグが false のレコードは結果に含まれない", () => {
  const mockActivityResults = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      activityResultId: "550e8400-e29b-41d4-a716-446655440001",
      activityResultName: "案件化",
      description: "見込み客が案件として認識された",
      validFlag: true,
      createdAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-01-01T10:00:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      activityResultId: "550e8400-e29b-41d4-a716-446655440002",
      activityResultName: "次回接触予定",
      description: "次回の接触を予定している",
      validFlag: true,
      createdAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-01-01T10:00:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      activityResultId: "550e8400-e29b-41d4-a716-446655440003",
      activityResultName: "廃止済み結果",
      description: "使用されなくなった活動結果",
      validFlag: false,
      createdAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-06-01T15:30:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440004",
      activityResultId: "550e8400-e29b-41d4-a716-446655440004",
      activityResultName: "保留中",
      description: "検討中で保留している",
      validFlag: true,
      createdAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-01-01T10:00:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440005",
      activityResultId: "550e8400-e29b-41d4-a716-446655440005",
      activityResultName: "旧形式：検討中止",
      description: "旧業務ルールで使用していた結果",
      validFlag: false,
      createdAt: "2023-06-01T10:00:00Z",
      updatedAt: "2024-03-15T09:45:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("活動結果マスタから有効フラグが true のレコードのみを返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityResults);

    const result = await fetchAllActivityResults({});

    expect(result.activityResults).toHaveLength(3);
    expect(result.activityResults.map((r) => r.activityResultId)).toEqual([
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002",
      "550e8400-e29b-41d4-a716-446655440004",
    ]);
    expect(result.activityResults.every((r) => r.validFlag === true)).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("有効フラグが false のレコードは含まれない", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityResults);

    const result = await fetchAllActivityResults({});

    const resultIds = result.activityResults.map((r) => r.activityResultId);
    expect(resultIds).not.toContain("550e8400-e29b-41d4-a716-446655440003");
    expect(resultIds).not.toContain("550e8400-e29b-41d4-a716-446655440005");
  });

  it("fetchedAt は ISO 8601 形式である", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockActivityResults);

    const result = await fetchAllActivityResults({});

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);
  });
});
