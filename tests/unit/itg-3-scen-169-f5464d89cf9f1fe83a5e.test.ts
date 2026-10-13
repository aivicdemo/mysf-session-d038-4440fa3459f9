import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
  SaveDiscrepancyDetectionResultOutput,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-169: 原因分類がnull（判定前）の場合、これをnullのまま保存して返す", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("causeClassificationがnullのとき、nullのまま保存される", async () => {
    const mockStoredRecord = {
      discrepancyId: "550e8400-e29b-41d4-a716-446655440002",
      legacySystemInvoiceId: "SF-INV-20240115-001",
      newSystemInvoiceId: "NS-INV-20240115-001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求金額が旧システムでは1000円、新システムでは950円",
      amountDifference: -50,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2024-01-15T10:30:45.000Z",
      severity: "中",
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
      discrepancyType: "金額差異",
      discrepancyContent: "請求金額が旧システムでは1000円、新システムでは950円",
      amountDifference: -50,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2024-01-15T10:30:45.000Z",
      severity: "中",
      causeClassification: null,
    };

    const result = await saveDiscrepancyDetectionResult(input);

    expect(result.causeClassification).toBeNull();
    expect(result.toleranceJudgment).toBeNull();
    expect(result.toleranceJudgmentDateTime).toBeNull();
    expect(result.judgedByUserId).toBeNull();
    expect(result.discrepancyId).toBeDefined();
    expect(result.amountDifference).toBe(-50);
  });
});
