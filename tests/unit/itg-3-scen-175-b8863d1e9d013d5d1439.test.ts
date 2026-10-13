import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as dataStore from "../../src/platform/data-store";
import {
  saveDiscrepancyDetectionResult,
  SaveDiscrepancyDetectionResultInput,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-175: 記録項目の必須フィールド（タイムスタンプ、操作者、操作内容）が不完全なとき、業務ルール適用時にエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("監視ログの必須項目が不足しているとき、エラーメッセージ「監視ログの必須項目が不足しています。タイムスタンプ、操作者、操作内容を確認してください」を含むエラーが発生する", async () => {
    (dataStore.listRecords as any).mockResolvedValue([]);

    const input = {
      legacySystemInvoiceId: "SF-INV-202401001",
      newSystemInvoiceId: "NEW-INV-202401001",
      discrepancyType: "金額差異",
      discrepancyContent: "請求金額が旧システムと新システムで不一致",
      amountDifference: 5000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: "2024-01-15T10:30:00Z",
      severity: "高",
      causeClassification: null,
    };

    await expect(saveDiscrepancyDetectionResult(input)).rejects.toThrow(
      "監視ログの必須項目が不足しています。タイムスタンプ、操作者、操作内容を確認してください"
    );

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
