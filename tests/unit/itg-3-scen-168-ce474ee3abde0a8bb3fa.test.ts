import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
  SaveDiscrepancyDetectionResultOutput,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-168: 金額差異・件数差異・ステータス差異が全てnullの場合、これらをnullのまま保存して返す", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("全ての差異種別がnullのとき、nullのまま保存される", async () => {
    const mockStoredRecord = {
      discrepancyId: "550e8400-e29b-41d4-a716-446655440001",
      legacySystemInvoiceId: "SF-INV-20240115-001",
      newSystemInvoiceId: "NS-INV-20240115-001",
      discrepancyType: "複合差異",
      discrepancyContent: "金額・件数・ステータスに差異なし、検証完了",
      amountDifference: null,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2024-01-15T10:30:45.000Z",
      severity: "低",
      causeClassification: null,
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
    };

    (dataStore.listRecords as any).mockResolvedValue([]);
    (dataStore.createRecord as any).mockResolvedValue(mockStoredRecord);

    const input = {
      legacySystemInvoiceId: "SF-INV-20240115-001",
      newSystemInvoiceId: "NS-INV-20240115-001",
      discrepancyType: "複合差異",
      discrepancyContent: "金額・件数・ステータスに差異なし、検証完了",
      amountDifference: null,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2024-01-15T10:30:45.000Z",
      severity: "低",
      causeClassification: null,
    };

    const result = await saveDiscrepancyDetectionResult(input);

    expect(result.amountDifference).toBeNull();
    expect(result.countDifference).toBeNull();
    expect(result.statusDifference).toBeNull();
    expect(result.discrepancyId).toBeDefined();
    expect(result.legacySystemInvoiceId).toBe("SF-INV-20240115-001");
    expect(result.newSystemInvoiceId).toBe("NS-INV-20240115-001");
    expect(result.discrepancyType).toBe("複合差異");
  });
});
