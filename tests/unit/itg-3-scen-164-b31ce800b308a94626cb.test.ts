import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
  SaveDiscrepancyDetectionResultOutput,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-164: 差異検出結果テーブルへの保存に成功し、採番されたIDと入力内容を含むレコードが返される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("差異検出結果テーブルに新規レコードが保存され、採番されたIDを含むレコードが返される", async () => {
    const mockStoredRecord = {
      discrepancyId: "550e8400-e29b-41d4-a716-446655440000",
      legacySystemInvoiceId: "SF-INV-20250101-001",
      newSystemInvoiceId: "NEW-INV-20250101-001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求書合計金額が旧システムと新システムで不一致。旧システム：150000円、新システム：150500円",
      amountDifference: 500,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2025-01-15T10:30:45.000Z",
      severity: "高",
      causeClassification: null,
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
    };

    (dataStore.listRecords as any).mockResolvedValue([]);
    (dataStore.createRecord as any).mockResolvedValue(mockStoredRecord);

    const input = {
      legacySystemInvoiceId: "SF-INV-20250101-001",
      newSystemInvoiceId: "NEW-INV-20250101-001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求書合計金額が旧システムと新システムで不一致。旧システム：150000円、新システム：150500円",
      amountDifference: 500,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2025-01-15T10:30:45.000Z",
      severity: "高",
      causeClassification: null,
    };

    const result = await saveDiscrepancyDetectionResult(input);

    expect(result.discrepancyId).toBeDefined();
    expect(result.legacySystemInvoiceId).toBe("SF-INV-20250101-001");
    expect(result.newSystemInvoiceId).toBe("NEW-INV-20250101-001");
    expect(result.discrepancyType).toBe("金額差異");
    expect(result.discrepancyContent).toBe("請求書合計金額が旧システムと新システムで不一致。旧システム：150000円、新システム：150500円");
    expect(result.amountDifference).toBe(500);
    expect(result.countDifference).toBeNull();
    expect(result.statusDifference).toBeNull();
    expect(result.detectionDateTime).toBe("2025-01-15T10:30:45.000Z");
    expect(result.severity).toBe("高");
    expect(result.causeClassification).toBeNull();
    expect(result.toleranceJudgment).toBeNull();
    expect(result.toleranceJudgmentDateTime).toBeNull();
    expect(result.judgedByUserId).toBeNull();

    expect(dataStore.createRecord).toHaveBeenCalled();
  });
});
