import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
  DataStoreError,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-167: データストア層での保存操作が失敗したとき、保存エラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createRecordがDataStoreErrorをスローしたとき、エラーが伝播される", async () => {
    (dataStore.listRecords as any).mockResolvedValue([]);
    (dataStore.createRecord as any).mockRejectedValue(
      new DataStoreError("差異検出結果の保存に失敗しました。")
    );

    const input = {
      legacySystemInvoiceId: "INV-SF-20240115-001",
      newSystemInvoiceId: "INV-NEW-20240115-001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求金額が1,500円異なる",
      amountDifference: 1500,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2024-01-15T10:30:00Z",
      severity: "高",
      causeClassification: null,
    };

    await expect(saveDiscrepancyDetectionResult(input)).rejects.toThrow(DataStoreError);
    await expect(saveDiscrepancyDetectionResult(input)).rejects.toThrow(
      "差異検出結果の保存に失敗しました。"
    );
  });
});
