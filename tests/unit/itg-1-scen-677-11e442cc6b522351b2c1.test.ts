import { saveDeal } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-677: 成約日がnullで未成約状態の商談を作成するとき、出力のcontractedDateもnullとなる", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("成約日がnullのとき、出力のcontractedDateもnullになる", async () => {
    const dealId = "new-uuid";
    const customerId = "550e8400-e29b-41d4-a716-446655440000";
    const salesRepresentativeId = "550e8400-e29b-41d4-a716-446655440001";
    const dealName = "テスト商談";
    const dealAmount = 1000000;
    const stageId = "550e8400-e29b-41d4-a716-446655440002";
    const expectedContractDate = "2025-12-31T23:59:59Z";
    const currentUserId = "550e8400-e29b-41d4-a716-446655440003";
    const operationTimestamp = "2025-01-15T10:30:00Z";

    const mockListRecords = jest.spyOn(dataStore, "listRecords");
    const mockCreateRecord = jest.spyOn(dataStore, "createRecord");

    // Mock: 全検証は成功
    mockListRecords
      .mockResolvedValueOnce([
        {
          id: customerId,
          取引先名: "テスト取引先",
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
          ステージ名: "初期接触",
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
      contractedDate: null, // null のまま
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
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
      contractedDate: null,
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      currentUserId,
      operationTimestamp,
    });

    expect(result).toBeDefined();
    expect(result.dealId).toBe(dealId);
    expect(result.contractedDate).toBeNull();
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
