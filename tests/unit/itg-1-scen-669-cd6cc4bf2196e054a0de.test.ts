import { saveDeal } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";
import {
  CustomerNotFound,
  SalesRepresentativeNotFound,
  InvalidDealStage,
} from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-669: 新規商談を作成し、入力したすべての項目が保存後のレコードに反映される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("新規商談の作成時に、入力したすべての項目が保存後のレコードに反映される", async () => {
    const dealId = "550e8400-e29b-41d4-a716-446655440000";
    const customerId = "550e8400-e29b-41d4-a716-446655440000";
    const salesRepresentativeId = "550e8400-e29b-41d4-a716-446655440001";
    const dealName = "ABC株式会社 システム導入案件";
    const dealAmount = 5000000;
    const stageId = "550e8400-e29b-41d4-a716-446655440002";
    const expectedContractDate = "2026-12-31T23:59:59Z";
    const contractedDate = null;
    const description = "クラウドERPシステムの導入案件。3年間のサポート付き。";
    const lossReason = null;
    const invoiceGenerationSLADeadline = "2027-01-15T23:59:59Z";
    const currentUserId = "550e8400-e29b-41d4-a716-446655440003";
    const operationTimestamp = "2026-11-01T10:30:00Z";

    // Mock data-store responses
    const mockListRecords = jest.spyOn(dataStore, "listRecords");
    const mockCreateRecord = jest.spyOn(dataStore, "createRecord");

    mockListRecords
      .mockResolvedValueOnce([
        {
          id: customerId,
          取引先名: "ABC株式会社",
          ステータス: "active",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: salesRepresentativeId,
          名前: "営業太郎",
          ステータス: "active",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: stageId,
          ステージ名: "提案段階",
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
      contractedDate,
      description,
      lossReason,
      invoiceGenerationSLADeadline,
      invoiceSLAExceededFlag: false,
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
      contractedDate,
      description,
      lossReason,
      invoiceGenerationSLADeadline,
      currentUserId,
      operationTimestamp,
    });

    expect(result).toBeDefined();
    expect(result.dealId).toBe(dealId);
    expect(result.customerId).toBe(customerId);
    expect(result.salesRepresentativeId).toBe(salesRepresentativeId);
    expect(result.dealName).toBe(dealName);
    expect(result.dealAmount).toBe(dealAmount);
    expect(result.stageId).toBe(stageId);
    expect(result.expectedContractDate).toBe(expectedContractDate);
    expect(result.contractedDate).toBeNull();
    expect(result.description).toBe(description);
    expect(result.lossReason).toBeNull();
    expect(result.invoiceGenerationSLADeadline).toBe(invoiceGenerationSLADeadline);
    expect(result.invoiceSLAExceededFlag).toBe(false);
    expect(result.createdAt).toBe(operationTimestamp);
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.createdBy).toBe(currentUserId);
  });
});
