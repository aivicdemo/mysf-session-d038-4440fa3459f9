import { saveDeal } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-678: 請求生成SLA期限が指定されたとき、出力にinvoiceSLAExceededFlagが含まれる", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("operationTimestampがinvoiceGenerationSLADeadlineより前のとき、invoiceSLAExceededFlagはfalseになる", async () => {
    const dealId = "new-uuid";
    const customerId = "550e8400-e29b-41d4-a716-446655440000";
    const salesRepresentativeId = "550e8400-e29b-41d4-a716-446655440001";
    const dealName = "新規システム導入案件";
    const dealAmount = 5000000;
    const stageId = "550e8400-e29b-41d4-a716-446655440002";
    const expectedContractDate = "2025-03-31T23:59:59Z";
    const description = "クラウド移行プロジェクト";
    const invoiceGenerationSLADeadline = "2025-04-10T23:59:59Z";
    const currentUserId = "550e8400-e29b-41d4-a716-446655440003";
    const operationTimestamp = "2025-03-15T10:00:00Z"; // SLA期限より前

    const mockListRecords = jest.spyOn(dataStore, "listRecords");
    const mockCreateRecord = jest.spyOn(dataStore, "createRecord");

    // Mock: 全検証は成功
    mockListRecords
      .mockResolvedValueOnce([
        {
          id: customerId,
          取引先名: "株式会社テスト",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: salesRepresentativeId,
          名前: "営業太郎",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: stageId,
          ステージ名: "提案中",
          有効フラグ: true,
        },
      ] as any);

    mockCreateRecord.mockResolvedValueOnce({
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
      invoiceSLAExceededFlag: false, // operationTimestamp < invoiceGenerationSLADeadline
      createdAt: operationTimestamp,
      updatedAt: operationTimestamp,
      createdBy: currentUserId,
    } as any);

    const result = await saveDeal({
      dealId: null,
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
    expect(result.invoiceGenerationSLADeadline).toBe(invoiceGenerationSLADeadline);
    expect(result.invoiceSLAExceededFlag).toBe(false);
    expect(result.customerId).toBe(customerId);
    expect(result.salesRepresentativeId).toBe(salesRepresentativeId);
    expect(result.dealName).toBe(dealName);
    expect(result.dealAmount).toBe(dealAmount);
    expect(result.stageId).toBe(stageId);
    expect(result.expectedContractDate).toBe(expectedContractDate);
    expect(result.createdAt).toBe(operationTimestamp);
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.createdBy).toBe(currentUserId);
  });
});
