import { saveActivity } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-731: 新規作成時、次のアクションが指定されない場合、当該フィールドはnullで保存され結果に反映される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("nextActionがnullの場合、保存結果に null が反映される", async () => {
    const activityId = null;
    const customerId = "cust-001";
    const salesRepresentativeId = "sr-001";
    const activityType = "訪問";
    const activityDateTime = "2026-10-07T10:00:00Z";
    const activityContent = "顧客訪問：ニーズヒアリング";
    const nextFollowUpScheduledDate = null;
    const dealId = null;
    const estimatedAmount = null;
    const contractedFlag = false;
    const activityDurationMinutes = 60;
    const activityCount = 1;
    const activityFrequency = "初回";
    const activityResult = "成功";
    const nextAction = null;
    const currentUserId = "user-001";
    const operationTimestamp = "2026-10-07T10:00:00Z";

    const mockListRecords = jest.spyOn(dataStore, "listRecords");
    const mockCreateRecord = jest.spyOn(dataStore, "createRecord");

    // Mock: 取引先、営業担当者、活動タイプ、活動結果、活動頻度のマスタが存在
    mockListRecords
      .mockResolvedValueOnce([
        {
          id: customerId,
          取引先名: "ABC株式会社",
          ステータス: "有効",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: salesRepresentativeId,
          名前: "山田太郎",
          ステータス: "有効",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: "at-001",
          活動タイプ名: activityType,
          有効フラグ: true,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: "ar-001",
          活動結果名: activityResult,
          有効フラグ: true,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: "af-001",
          活動頻度名: activityFrequency,
          有効フラグ: true,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ] as any);

    // Mock: createRecord で新規 UUID を生成して返す
    const generatedActivityId = "00000000-0000-0000-0000-000000000002";
    mockCreateRecord.mockResolvedValueOnce({
      id: generatedActivityId,
      activityId: generatedActivityId,
      customerId,
      salesRepresentativeId,
      activityType,
      activityDateTime,
      activityContent,
      nextFollowUpScheduledDate,
      dealId,
      estimatedAmount,
      contractedFlag,
      activityDurationMinutes,
      activityCount,
      activityFrequency,
      activityResult,
      nextAction,
      createdAt: operationTimestamp,
      updatedAt: operationTimestamp,
      createdBy: currentUserId,
    } as any);

    const result = await saveActivity({
      activityId,
      customerId,
      salesRepresentativeId,
      activityType,
      activityDateTime,
      activityContent,
      nextFollowUpScheduledDate,
      dealId,
      estimatedAmount,
      contractedFlag,
      activityDurationMinutes,
      activityCount,
      activityFrequency,
      activityResult,
      nextAction,
      currentUserId,
      operationTimestamp,
    });

    expect(result.nextAction).toBeNull();
    expect(result.activityId).toBeDefined();
    expect(result.customerId).toBe(customerId);
    expect(result.salesRepresentativeId).toBe(salesRepresentativeId);
    expect(result.activityType).toBe(activityType);
    expect(result.activityDateTime).toBe(activityDateTime);
    expect(result.activityContent).toBe(activityContent);
    expect(result.nextFollowUpScheduledDate).toBeNull();
    expect(result.dealId).toBeNull();
    expect(result.estimatedAmount).toBeNull();
    expect(result.contractedFlag).toBe(contractedFlag);
    expect(result.activityDurationMinutes).toBe(activityDurationMinutes);
    expect(result.activityCount).toBe(activityCount);
    expect(result.activityFrequency).toBe(activityFrequency);
    expect(result.activityResult).toBe(activityResult);
    expect(result.createdAt).toBe(operationTimestamp);
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.createdBy).toBe(currentUserId);
  });
});
