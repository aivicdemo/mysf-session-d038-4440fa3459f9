import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-172: 監視ログエントリが空のとき、業務ルール適用時にエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("監視ログが存在しないとき、エラーメッセージ「監視ログが存在しません。是正履歴を確認してください」を含むエラーが発生する", async () => {
    (dataStore.listRecords as any).mockResolvedValue([]);

    const input = {
      legacySystemInvoiceId: "INV-2026-001",
      newSystemInvoiceId: "NEW-INV-2026-001",
      discrepancyType: "金額差異",
      discrepancyContent: "旧システム請求額150000円、新システム請求額145000円",
      amountDifference: 5000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2026-03-15T10:30:00Z",
      severity: "高",
      causeClassification: null,
    };

    await expect(saveDiscrepancyDetectionResult(input)).rejects.toThrow(
      "監視ログが存在しません。是正履歴を確認してください"
    );

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
