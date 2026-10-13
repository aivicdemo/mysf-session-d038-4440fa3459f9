import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-173: コンプライアンス保管期間ポリシーが未設定のとき、業務ルール適用時にエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("コンプライアンス保管期間ポリシーが未設定のとき、エラーメッセージ「企業のコンプライアンス保管期間ポリシーを設定してください」を含むエラーが発生する", async () => {
    (dataStore.listRecords as any).mockResolvedValue([]);

    const input = {
      legacySystemInvoiceId: "INV-2025-00001",
      newSystemInvoiceId: "NEW-INV-2025-00001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求金額に1000円の差異を検出",
      amountDifference: 1000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2025-01-15T10:30:00Z",
      severity: "高",
      causeClassification: null,
    };

    await expect(saveDiscrepancyDetectionResult(input)).rejects.toThrow(
      "企業のコンプライアンス保管期間ポリシーを設定してください"
    );

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
