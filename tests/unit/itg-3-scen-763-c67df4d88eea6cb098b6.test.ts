import { jest } from "@jest/globals";
import { retrieveDiscrepancyDetailsForConfirmation, RetrieveDiscrepancyDetailsForConfirmationOutput } from "../../src/logic/discrepancy-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-763: フィールドマッピング定義が不完全な場合、警告メッセージが記録され、分析精度低下が通知される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("フィールドマッピング不完全な差異について、全データが返され、是正追跡と確認履歴が含まれる", async () => {
    const discrepancyId = "diff-uuid-001";

    const discrepancyRecord = {
      id: "diff-uuid-001",
      差異ID: "diff-uuid-001",
      旧システム請求書ID: "legacy-inv-001",
      新システム請求書ID: "new-inv-001",
      差異種類: "フィールドマッピング不完全",
      差異内容: "摘要フィールドのマッピング定義が不完全。旧システムの摘要内容が新システムに完全には転記されていない",
      金額差異: 0,
      件数差異: 0,
      ステータス差異: null,
      検出日時: "2026-03-15T10:30:00Z",
      重大度: "警告",
      原因分類: "マッピング定義不完全",
      許容範囲判定: "範囲外",
      判定日時: "2026-03-15T10:35:00Z",
      判定者: "user-uuid-001",
      createdAt: "2026-03-15T10:30:00Z",
      updatedAt: "2026-03-15T10:35:00Z",
    };

    const legacyInvoice = {
      id: "legacy-inv-uuid-001",
      請求書ID: "legacy-inv-001",
      ユーザーID: "user-001",
      請求書番号: "LEG-2026-003-001",
      請求日: "2026-03-10T00:00:00Z",
      請求金額: 150000,
      税金額: 15000,
      ステータス: "確定",
      支払期限日: "2026-04-10T00:00:00Z",
      摘要: "2026年3月分 システム利用料（基本料金50,000円＋従量課金100,000円）。消費税別途。",
      作成日時: "2026-03-10T09:00:00Z",
      更新日時: "2026-03-10T09:00:00Z",
      検証ステータス: "完了",
      検証日時: "2026-03-10T10:00:00Z",
    };

    const newInvoice = {
      id: "new-inv-uuid-001",
      請求書ID: "new-inv-001",
      請求書番号: "NEW-2026-003-001",
      請求日: "2026-03-10T00:00:00Z",
      請求金額: 150000,
      税金額: 15000,
      ステータス: "確定",
      支払期限日: "2026-04-10T00:00:00Z",
      摘要: "2026年3月分 システム利用料",
    };

    const correctionRecord = {
      id: "corr-uuid-001",
      是正ID: "corr-uuid-001",
      差異ID: "diff-uuid-001",
      是正方法: "マッピング定義修正",
      是正ステータス: "計画中",
      是正実行者: "user-uuid-admin-001",
      是正実行日時: null,
      是正前データ: '{"摘要フィールド":"不完全なマッピング"}',
      是正後データ: null,
      検証結果: null,
    };

    const confirmationRecord = {
      id: "confirm-uuid-001",
      確認ID: "confirm-uuid-001",
      差異ID: "diff-uuid-001",
      確認ユーザーID: "user-uuid-checker-001",
      確認日時: "2026-03-15T11:00:00Z",
      確認内容: "フィールドマッピング定義の不完全性を確認。摘要フィールドに詳細情報の欠落あり。分析精度への影響大。",
      判定結果: "要是正",
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === "差異検出結果") {
        return Promise.resolve([discrepancyRecord]);
      }
      if (tableName === "旧システム請求書") {
        return Promise.resolve([legacyInvoice]);
      }
      if (tableName === "新システム請求書") {
        return Promise.resolve([newInvoice]);
      }
      if (tableName === "是正追跡管理") {
        return Promise.resolve([correctionRecord]);
      }
      if (tableName === "差異確認履歴") {
        return Promise.resolve([confirmationRecord]);
      }
      return Promise.resolve([]);
    });

    const result = (await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })) as RetrieveDiscrepancyDetailsForConfirmationOutput;

    expect(result.discrepancyId).toBe("diff-uuid-001");
    expect(result.discrepancyDetection.差異種類).toBe("フィールドマッピング不完全");
    expect(result.discrepancyDetection.差異内容).toContain("摘要フィールドのマッピング定義が不完全");
    expect(result.discrepancyDetection.重大度).toBe("警告");
    expect(result.discrepancyDetection.原因分類).toBe("マッピング定義不完全");
    expect(result.discrepancyDetection.許容範囲判定).toBe("範囲外");
    expect(result.discrepancyDetection.金額差異).toBe(0);
    expect(result.discrepancyDetection.件数差異).toBe(0);

    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.請求書番号).toBe("LEG-2026-003-001");
    expect(result.legacySystemInvoice?.摘要).toContain("基本料金50,000円");
    expect(result.legacySystemInvoice?.摘要).toContain("従量課金100,000円");
    expect(result.legacySystemInvoice?.摘要).toContain("消費税別途");

    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.請求書番号).toBe("NEW-2026-003-001");
    expect(result.newSystemInvoice?.摘要).toBe("2026年3月分 システム利用料");

    expect(result.correctionTrackingHistory.length).toBeGreaterThan(0);
    const correction = result.correctionTrackingHistory[0];
    expect(correction.是正方法).toBe("マッピング定義修正");
    expect(correction.是正ステータス).toBe("計画中");

    expect(result.confirmationHistory.length).toBeGreaterThan(0);
    const confirmation = result.confirmationHistory[0];
    expect(confirmation.確認内容).toContain("フィールドマッピング定義の不完全性を確認");
    expect(confirmation.確認内容).toContain("詳細情報の欠落あり");
    expect(confirmation.確認内容).toContain("分析精度への影響大");
    expect(confirmation.判定結果).toBe("要是正");
  });
});
