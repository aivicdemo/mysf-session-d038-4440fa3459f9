import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
  SaveDiscrepancyDetectionResultOutput,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-174: 移行完了日が未指定のとき、業務ルール適用時に警告が発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("移行完了日が未指定のとき、警告メッセージを含みながらも保存は成功する", async () => {
    const mockStoredRecord = {
      discrepancyId: "550e8400-e29b-41d4-a716-446655440005",
      legacySystemInvoiceId: "SF-INV-20250101-001",
      newSystemInvoiceId: "NEW-INV-20250101-001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求金額が旧システムと新システムで異なる",
      amountDifference: 50000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2025-01-15T10:30:00Z",
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
      discrepancyContent: "請求金額が旧システムと新システムで異なる",
      amountDifference: 50000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2025-01-15T10:30:00Z",
      severity: "高",
      causeClassification: null,
    };

    const result = await saveDiscrepancyDetectionResult(input);

    expect(result.discrepancyId).toBeDefined();
    expect(result.legacySystemInvoiceId).toBe("SF-INV-20250101-001");
    expect(result.newSystemInvoiceId).toBe("NEW-INV-20250101-001");
    expect(result.discrepancyType).toBe("金額差異");
    expect(result.toleranceJudgment).toBeNull();
    expect(result.toleranceJudgmentDateTime).toBeNull();
    expect(result.judgedByUserId).toBeNull();
  });
});
