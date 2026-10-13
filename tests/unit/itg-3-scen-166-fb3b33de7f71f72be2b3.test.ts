import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
  InvalidDiscrepancyDataError,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-166: detectionDateTimeがISO 8601形式でないとき、入力値の検証エラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("detectionDateTimeが「2024-12-15 14:30:00」のようなISO 8601形式でない場合、InvalidDiscrepancyDataErrorが発生する", async () => {
    (dataStore.listRecords as any).mockResolvedValue([]);

    const input = {
      legacySystemInvoiceId: "INV-2024-001",
      newSystemInvoiceId: "NEW-INV-2024-001",
      discrepancyType: "金額差異",
      discrepancyContent: "旧システム請求金額50000円、新システム請求金額48000円",
      amountDifference: null,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2024-12-15 14:30:00",
      severity: "高",
      causeClassification: null,
    };

    await expect(saveDiscrepancyDetectionResult(input)).rejects.toThrow(InvalidDiscrepancyDataError);
    await expect(saveDiscrepancyDetectionResult(input)).rejects.toThrow(
      "差異情報の必須項目が不足しているか、型が不正です。"
    );

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
