import { retrieveDiscrepanciesForCSVExport } from "../../src/logic/discrepancy-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-222: 複数の差異IDを指定して、対応する差異検出結果・請求書データ・是正追跡履歴・確認履歴をすべて取得し、CSV出力用に整形して返す", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("2件の差異IDを指定して、すべての関連データをCSV出力用に取得できる", async () => {
    const discrepancyIds = ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"];

    const discrepancyDetectionRecords = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        差異ID: "550e8400-e29b-41d4-a716-446655440001",
        旧システム請求書ID: "OLD-INV-2024-001",
        新システム請求書ID: "NEW-INV-2024-001",
        差異種類: "金額",
        差異内容: "請求金額の差異を検出",
        金額差異: 5000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: "2024-10-01T10:30:00Z",
        重大度: "高",
        原因分類: "入力エラー",
        許容範囲判定: "範囲外",
        判定日時: "2024-10-01T11:00:00Z",
        判定者: "550e8400-e29b-41d4-a716-446655440099",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        差異ID: "550e8400-e29b-41d4-a716-446655440002",
        旧システム請求書ID: "OLD-INV-2024-002",
        新システム請求書ID: "NEW-INV-2024-002",
        差異種類: "件数",
        差異内容: "請求明細件数の差異を検出",
        金額差異: 0,
        件数差異: 2,
        ステータス差異: null,
        検出日時: "2024-10-02T09:15:00Z",
        重大度: "中",
        原因分類: "データ同期遅延",
        許容範囲判定: "範囲外",
        判定日時: "2024-10-02T10:00:00Z",
        判定者: "550e8400-e29b-41d4-a716-446655440099",
      },
    ];

    const legacyInvoiceRecords = [
      {
        id: "OLD-INV-2024-001",
        請求書ID: "OLD-INV-2024-001",
        ユーザーID: "USER-001",
        請求書番号: "OLD-2024-001",
        請求日: "2024-09-30T00:00:00Z",
        請求金額: 100000,
        税金額: 10000,
        ステータス: "確定",
        支払期限日: "2024-10-31T00:00:00Z",
        摘要: "2024年9月分請求",
        作成日時: "2024-09-30T08:00:00Z",
        更新日時: "2024-09-30T08:00:00Z",
        検証ステータス: "未検証",
        検証日時: null,
      },
      {
        id: "OLD-INV-2024-002",
        請求書ID: "OLD-INV-2024-002",
        ユーザーID: "USER-002",
        請求書番号: "OLD-2024-002",
        請求日: "2024-10-01T00:00:00Z",
        請求金額: 250000,
        税金額: 25000,
        ステータス: "確定",
        支払期限日: "2024-11-01T00:00:00Z",
        摘要: "2024年10月分請求",
        作成日時: "2024-10-01T07:30:00Z",
        更新日時: "2024-10-01T07:30:00Z",
        検証ステータス: "検証済",
        検証日時: "2024-10-01T12:00:00Z",
      },
    ];

    const newInvoiceRecords = [
      {
        id: "NEW-INV-2024-001",
        請求書ID: "NEW-INV-2024-001",
        請求書番号: "NEW-2024-001",
        請求日: "2024-09-30T00:00:00Z",
        請求金額: 105000,
        税金額: 10500,
        ステータス: "確定",
        支払期限日: "2024-10-31T00:00:00Z",
        摘要: "2024年9月分請求",
      },
      {
        id: "NEW-INV-2024-002",
        請求書ID: "NEW-INV-2024-002",
        請求書番号: "NEW-2024-002",
        請求日: "2024-10-01T00:00:00Z",
        請求金額: 250000,
        税金額: 25000,
        ステータス: "確定",
        支払期限日: "2024-11-01T00:00:00Z",
        摘要: "2024年10月分請求",
      },
    ];

    const correctionTrackingRecords = [
      {
        id: "550e8400-e29b-41d4-a716-446655440011",
        是正ID: "550e8400-e29b-41d4-a716-446655440011",
        差異ID: "550e8400-e29b-41d4-a716-446655440001",
        是正方法: "手動修正",
        是正ステータス: "完了",
        是正実行者: "550e8400-e29b-41d4-a716-446655440088",
        是正実行日時: "2024-10-01T14:00:00Z",
        是正前データ: '{"請求金額": 100000}',
        是正後データ: '{"請求金額": 105000}',
        検証結果: "完了",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440012",
        是正ID: "550e8400-e29b-41d4-a716-446655440012",
        差異ID: "550e8400-e29b-41d4-a716-446655440002",
        是正方法: "自動同期",
        是正ステータス: "進行中",
        是正実行者: "550e8400-e29b-41d4-a716-446655440087",
        是正実行日時: "2024-10-02T11:30:00Z",
        是正前データ: '{"件数": 5}',
        是正後データ: '{"件数": 7}',
        検証結果: "未確認",
      },
    ];

    const confirmationHistoryRecords = [
      {
        id: "550e8400-e29b-41d4-a716-446655440021",
        確認ID: "550e8400-e29b-41d4-a716-446655440021",
        差異ID: "550e8400-e29b-41d4-a716-446655440001",
        確認ユーザーID: "550e8400-e29b-41d4-a716-446655440077",
        確認日時: "2024-10-01T15:30:00Z",
        確認内容: "金額差異を確認。旧システムの入力エラーが原因と判明。",
        判定結果: "承認",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440022",
        確認ID: "550e8400-e29b-41d4-a716-446655440022",
        差異ID: "550e8400-e29b-41d4-a716-446655440002",
        確認ユーザーID: "550e8400-e29b-41d4-a716-446655440076",
        確認日時: "2024-10-02T13:00:00Z",
        確認内容: "件数差異を確認中。同期遅延の影響を調査予定。",
        判定結果: "保留",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440023",
        確認ID: "550e8400-e29b-41d4-a716-446655440023",
        差異ID: "550e8400-e29b-41d4-a716-446655440002",
        確認ユーザーID: "550e8400-e29b-41d4-a716-446655440075",
        確認日時: "2024-10-02T14:15:00Z",
        確認内容: "同期遅延は解決。新システムデータを最新版に更新。",
        判定結果: "承認",
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation(async (tableName: string) => {
      if (tableName === "差異検出結果") {
        return discrepancyDetectionRecords;
      }
      if (tableName === "旧システム請求書") {
        return legacyInvoiceRecords;
      }
      if (tableName === "新システム請求書") {
        return newInvoiceRecords;
      }
      if (tableName === "是正追跡管理") {
        return correctionTrackingRecords;
      }
      if (tableName === "差異確認履歴") {
        return confirmationHistoryRecords;
      }
      return [];
    });

    const result = await retrieveDiscrepanciesForCSVExport({ discrepancyIds });

    expect(result).toBeDefined();
    expect(result.totalCount).toBe(2);
    expect(result.discrepancies).toHaveLength(2);

    // 1件目の差異検証
    const csvRecord1 = result.discrepancies[0];
    expect(csvRecord1.discrepancyId).toBe("550e8400-e29b-41d4-a716-446655440001");
    expect(csvRecord1.discrepancyType).toBe("金額");
    expect(csvRecord1.legacySystemInvoice?.invoiceNumber).toBe("OLD-2024-001");
    expect(csvRecord1.legacySystemInvoice?.invoiceAmount).toBe(100000);
    expect(csvRecord1.newSystemInvoice?.invoiceNumber).toBe("NEW-2024-001");
    expect(csvRecord1.newSystemInvoice?.invoiceAmount).toBe(105000);
    expect(csvRecord1.amountDifference).toBe(5000);
    expect(csvRecord1.correctionTrackingHistory).toHaveLength(1);
    expect(csvRecord1.correctionTrackingHistory[0].correctionStatus).toBe("完了");
    expect(csvRecord1.correctionTrackingHistory[0].correctionMethod).toBe("手動修正");
    expect(csvRecord1.correctionTrackingHistory[0].correctionExecutionDateTime).toBe("2024-10-01T14:00:00Z");
    expect(csvRecord1.confirmationHistory).toHaveLength(1);
    expect(csvRecord1.confirmationHistory[0].judgmentResult).toBe("承認");

    // 2件目の差異検証（仕様の期待結果から確認できる値）
    const csvRecord2 = result.discrepancies[1];
    expect(csvRecord2.discrepancyId).toBe("550e8400-e29b-41d4-a716-446655440002");
    expect(csvRecord2.discrepancyType).toBe("件数");
    expect(csvRecord2.legacySystemInvoice?.invoiceNumber).toBe("OLD-2024-002");
    expect(csvRecord2.legacySystemInvoice?.invoiceAmount).toBe(250000);
    expect(csvRecord2.newSystemInvoice?.invoiceNumber).toBe("NEW-2024-002");
    expect(csvRecord2.newSystemInvoice?.invoiceAmount).toBe(250000);
    expect(csvRecord2.countDifference).toBe(2);
    expect(csvRecord2.correctionTrackingHistory).toHaveLength(1);
    expect(csvRecord2.correctionTrackingHistory[0].correctionStatus).toBe("進行中");
    expect(csvRecord2.correctionTrackingHistory[0].correctionMethod).toBe("自動同期");
    expect(csvRecord2.correctionTrackingHistory[0].correctionExecutionDateTime).toBe("2024-10-02T11:30:00Z");
    // 2件目は確認履歴が2件で、最新の確認結果が「承認」
    expect(csvRecord2.confirmationHistory).toHaveLength(2);
    expect(csvRecord2.confirmationHistory[1].judgmentResult).toBe("承認");
  });
});
