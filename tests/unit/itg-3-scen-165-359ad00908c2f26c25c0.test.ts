import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
  InvalidDiscrepancyDataError,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-165: 必須項目が欠落しているとき、入力値の検証エラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("legacySystemInvoiceIdがnullのとき、InvalidDiscrepancyDataErrorが発生する", async () => {
    (dataStore.listRecords as any).mockResolvedValue([]);

    const input = {
      legacySystemInvoiceId: null as any,
      newSystemInvoiceId: "NEW-INV-20240115-001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求金額に1000円の差異を検出",
      amountDifference: 1000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2024-01-15T10:30:00Z",
      severity: "高",
      causeClassification: null,
    };

    await expect(saveDiscrepancyDetectionResult(input)).rejects.toThrow(InvalidDiscrepancyDataError);
    await expect(saveDiscrepancyDetectionResult(input)).rejects.toThrow(
      "差異情報の必須項目が不足しているか、型が不正です。"
    );
  });
});
