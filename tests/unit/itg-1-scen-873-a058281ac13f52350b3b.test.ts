import { fetchAllValidationRules } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-873: 適用期間の開始日・終了日が現在日時の範囲外のルール定義は取得結果に含まれない", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("適用期間が現在日時の範囲内かつ有効フラグがtrueのルール定義のみを返す", async () => {
    // 現在日時は2026-10-12T00:00:00Z と仮定
    // preconditionsのルール定義：
    // rule-001: 適用開始日=2025-01-01, 適用終了日=2026-12-31, 有効フラグ=true -> 返却対象 ✓
    // rule-002: 適用開始日=2024-06-01, 適用終了日=2024-12-31, 有効フラグ=true -> 適用終了日が過去 ✗
    // rule-003: 適用開始日=2027-01-01, 適用終了日=2028-12-31, 有効フラグ=true -> 適用開始日が未来 ✗
    // rule-004: 適用開始日=2025-03-01, 適用終了日=2026-06-30, 有効フラグ=false -> 有効フラグがfalse ✗

    const mockRules = [
      {
        id: "rule-001",
        validationRuleId: "rule-001",
        ruleName: "金額必須チェック",
        ruleDescription: "請求金額は必須項目",
        targetTable: "請求明細",
        targetColumn: "金額",
        validationType: "required",
        validationCondition: "NOT NULL",
        errorMessage: "金額を入力してください",
        warningLevel: "error",
        validFlag: true,
        applicationStartDate: "2025-01-01T00:00:00Z",
        applicationEndDate: "2026-12-31T23:59:59Z",
        createdAt: "2024-12-01T10:00:00Z",
        createdBy: "user-001",
        updatedAt: "2024-12-01T10:00:00Z",
        updatedBy: "user-001",
      },
      {
        id: "rule-002",
        validationRuleId: "rule-002",
        ruleName: "商談ステータス検証",
        ruleDescription: "商談ステータスは定義された値のみ許可",
        targetTable: "商談",
        targetColumn: "ステータス",
        validationType: "enum",
        validationCondition: "IN ('提案', '交渉', '成約', '失注')",
        errorMessage: "無効なステータスが指定されています",
        warningLevel: "error",
        validFlag: true,
        applicationStartDate: "2024-06-01T00:00:00Z",
        applicationEndDate: "2024-12-31T23:59:59Z",
        createdAt: "2024-05-15T09:00:00Z",
        createdBy: "user-002",
        updatedAt: "2024-05-15T09:00:00Z",
        updatedBy: "user-002",
      },
      {
        id: "rule-003",
        validationRuleId: "rule-003",
        ruleName: "請求日付検証",
        ruleDescription: "請求日は営業日のみ許可",
        targetTable: "請求",
        targetColumn: "請求日",
        validationType: "businessDay",
        validationCondition: "IS_BUSINESS_DAY",
        errorMessage: "請求日は営業日を指定してください",
        warningLevel: "warning",
        validFlag: true,
        applicationStartDate: "2027-01-01T00:00:00Z",
        applicationEndDate: "2028-12-31T23:59:59Z",
        createdAt: "2024-11-01T14:00:00Z",
        createdBy: "user-003",
        updatedAt: "2024-11-01T14:00:00Z",
        updatedBy: "user-003",
      },
      {
        id: "rule-004",
        validationRuleId: "rule-004",
        ruleName: "割引率検証",
        ruleDescription: "割引率は0～50%の範囲内",
        targetTable: "商談商品",
        targetColumn: "割引率",
        validationType: "range",
        validationCondition: "BETWEEN 0 AND 50",
        errorMessage: "割引率は0～50%の範囲で指定してください",
        warningLevel: "error",
        validFlag: false,
        applicationStartDate: "2025-03-01T00:00:00Z",
        applicationEndDate: "2026-06-30T23:59:59Z",
        createdAt: "2024-10-20T11:00:00Z",
        createdBy: "user-004",
        updatedAt: "2024-10-20T11:00:00Z",
        updatedBy: "user-004",
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockRules);

    const result = await fetchAllValidationRules({});

    // 適用期間が現在日時（2026-10-12T00:00:00Z）の範囲内かつ有効フラグがtrueのルール定義のみが返される
    expect(result.validationRules).toHaveLength(1);
    expect(result.validationRules[0].validationRuleId).toBe("rule-001");

    // totalCountは1
    expect(result.totalCount).toBe(1);

    // fetchedAtはISO 8601形式の日時文字列
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
