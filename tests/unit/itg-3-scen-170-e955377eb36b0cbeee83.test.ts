import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
  SaveDiscrepancyDetectionResultOutput,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-170: 保存後のレコードにはデータストア層が付与するid・createdAt・updatedAtが含まれ、許容範囲判定関連項目はnullのまま返される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("保存後のレコードがデータストア層由来のフィールド（id, createdAt, updatedAt）を含む", async () => {
    const mockStoredRecord = {
      id: "db-id-12345",
      discrepancyId: "550e8400-e29b-41d4-a716-446655440003",
      legacySystemInvoiceId: "SF-INV-20250101-001",
      newSystemInvoiceId: "NS-INV-20250101-001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求金額が旧システムでは105,000円、新システムでは100,000円で不一致",
      amountDifference: 5000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2025-01-15T14:30:00Z",
      severity: "高",
      causeClassification: null,
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
      createdAt: "2025-01-15T14:30:01Z",
      updatedAt: "2025-01-15T14:30:01Z",
    };

    (dataStore.listRecords as any).mockResolvedValue([]);
    (dataStore.createRecord as any).mockResolvedValue(mockStoredRecord);

    const input = {
      legacySystemInvoiceId: "SF-INV-20250101-001",
      newSystemInvoiceId: "NS-INV-20250101-001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求金額が旧システムでは105,000円、新システムでは100,000円で不一致",
      amountDifference: 5000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2025-01-15T14:30:00Z",
      severity: "高",
      causeClassification: null,
    };

    const result = await saveDiscrepancyDetectionResult(input);

    expect(result.discrepancyId).toBeDefined();
    expect(result.legacySystemInvoiceId).toBe("SF-INV-20250101-001");
    expect(result.newSystemInvoiceId).toBe("NS-INV-20250101-001");
    expect(result.discrepancyType).toBe("金額差異");
    expect(result.toleranceJudgment).toBeNull();
    expect(result.toleranceJudgmentDateTime).toBeNull();
    expect(result.judgedByUserId).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });
});
