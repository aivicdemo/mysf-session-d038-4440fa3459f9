import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
  SaveDiscrepancyDetectionResultOutput,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-171: 差異検出結果を保存するとき、複数の検出差異情報を記録項目ごとに分類し、コンプライアンス保管期間に基づいて保管対象を判定して分類結果を返す", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("差異検出結果が保存され、適切な出力型が返される", async () => {
    const mockStoredRecord = {
      discrepancyId: "550e8400-e29b-41d4-a716-446655440004",
      legacySystemInvoiceId: "INV-SF-20240115-001",
      newSystemInvoiceId: "INV-NEW-20240115-001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求金額が旧システムでは150000円、新システムでは150500円",
      amountDifference: 500,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2024-01-15T10:30:00Z",
      severity: "高",
      causeClassification: null,
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
    };

    (dataStore.listRecords as any).mockResolvedValue([]);
    (dataStore.createRecord as any).mockResolvedValue(mockStoredRecord);

    const input = {
      legacySystemInvoiceId: "INV-SF-20240115-001",
      newSystemInvoiceId: "INV-NEW-20240115-001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求金額が旧システムでは150000円、新システムでは150500円",
      amountDifference: 500,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2024-01-15T10:30:00Z",
      severity: "高",
      causeClassification: null,
    };

    const result = await saveDiscrepancyDetectionResult(input);

    expect(result.discrepancyId).toBeDefined();
    expect(result.discrepancyId).not.toBeNull();
    expect(result.legacySystemInvoiceId).toBe("INV-SF-20240115-001");
    expect(result.newSystemInvoiceId).toBe("INV-NEW-20240115-001");
    expect(result.discrepancyType).toBe("金額差異");
    expect(result.discrepancyContent).toBe("請求金額が旧システムでは150000円、新システムでは150500円");
    expect(result.amountDifference).toBe(500);
    expect(result.countDifference).toBeNull();
    expect(result.statusDifference).toBeNull();
    expect(result.detectionDateTime).toBe("2024-01-15T10:30:00Z");
    expect(result.severity).toBe("高");
    expect(result.causeClassification).toBeNull();
    expect(result.toleranceJudgment).toBeNull();
    expect(result.toleranceJudgmentDateTime).toBeNull();
    expect(result.judgedByUserId).toBeNull();
  });
});
