import { saveDeal } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-676: 既存の商談レコードを更新するとき、dealIdに既存UUIDを指定し、入力変更項目が反映されて更新日時が新しくなる", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("既存商談の更新時に、入力値が反映され更新日時が新しくなる", async () => {
    const dealId = "550e8400-e29b-41d4-a716-446655440000";
    const customerId = "660e8400-e29b-41d4-a716-446655440001";
    const salesRepresentativeId = "770e8400-e29b-41d4-a716-446655440002";
    const dealName = "更新後の商談名";
    const dealAmount = 2500000;
    const stageId = "880e8400-e29b-41d4-a716-446655440003";
    const expectedContractDate = "2026-12-31T23:59:59Z";
    const description = "更新後の説明";
    const invoiceGenerationSLADeadline = "2027-01-15T23:59:59Z";
    const currentUserId = "990e8400-e29b-41d4-a716-446655440004";
    const operationTimestamp = "2026-11-01T10:30:00Z";
    const createdAtOriginal = "2026-10-01T09:00:00Z";
    const createdByOriginal = "550e8400-e29b-41d4-a716-446655440005";

    const mockListRecords = jest.spyOn(dataStore, "listRecords");
    const mockUpdateRecord = jest.spyOn(dataStore, "updateRecord");

    // Mock: 全検証は成功
    mockListRecords
      .mockResolvedValueOnce([
        {
          id: customerId,
          取引先ID: customerId,
          取引先名: "テスト取引先",
          ステータス: "有効",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: salesRepresentativeId,
          営業担当者ID: salesRepresentativeId,
          名前: "テスト営業担当者",
          ステータス: "有効",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: stageId,
          ステージID: stageId,
          ステージ名: "テストステージ",
          有効フラグ: true,
        },
      ] as any);

    mockUpdateRecord.mockResolvedValueOnce({
      id: dealId,
      customerId,
      salesRepresentativeId,
      dealName,
      dealAmount,
      stageId,
      expectedContractDate,
      contractedDate: null,
      description,
      lossReason: null,
      invoiceGenerationSLADeadline,
      invoiceSLAExceededFlag: false,
      createdAt: createdAtOriginal,
      updatedAt: operationTimestamp,
      createdBy: createdByOriginal,
    } as any);

    const result = await saveDeal({
      dealId,
      customerId,
      salesRepresentativeId,
      dealName,
      dealAmount,
      stageId,
      expectedContractDate,
      contractedDate: null,
      description,
      lossReason: null,
      invoiceGenerationSLADeadline,
      currentUserId,
      operationTimestamp,
    });

    expect(result).toBeDefined();
    expect(result.dealId).toBe(dealId);
    expect(result.dealName).toBe(dealName);
    expect(result.dealAmount).toBe(dealAmount);
    expect(result.description).toBe(description);
    expect(result.createdAt).toBe(createdAtOriginal);
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.createdBy).toBe(createdByOriginal);
  });
});
