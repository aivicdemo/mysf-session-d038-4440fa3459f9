import { fetchAllValidationRules } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-872: 有効フラグがfalseのルール定義は取得結果に含まれない", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("有効フラグがfalseのルール定義は除外され、有効フラグがtrueのルール定義のみを返す", async () => {
    const mockRules = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        validationRuleId: "550e8400-e29b-41d4-a716-446655440001",
        ruleName: "金額正数チェック",
        ruleDescription: "請求金額は正の数値であること",
        targetTable: "請求明細",
        targetColumn: "金額",
        validationType: "range",
        validationCondition: '{"min": 0, "max": 9999999999}',
        errorMessage: "金額は0以上の数値で入力してください",
        warningLevel: "error",
        validFlag: true,
        applicationStartDate: "2024-01-01T00:00:00Z",
        applicationEndDate: null,
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        validationRuleId: "550e8400-e29b-41d4-a716-446655440002",
        ruleName: "旧ルール_廃止済み",
        ruleDescription: "廃止されたルール定義",
        targetTable: "商談",
        targetColumn: "ステータス",
        validationType: "enum",
        validationCondition: '{"values": ["検討", "提案", "成約"]}',
        errorMessage: "無効なステータスです",
        warningLevel: "warning",
        validFlag: false,
        applicationStartDate: "2023-01-01T00:00:00Z",
        applicationEndDate: "2024-12-31T23:59:59Z",
        createdAt: "2023-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        validationRuleId: "550e8400-e29b-41d4-a716-446655440003",
        ruleName: "取引先ID必須チェック",
        ruleDescription: "取引先IDは必ず入力すること",
        targetTable: "商談",
        targetColumn: "取引先ID",
        validationType: "required",
        validationCondition: "{}",
        errorMessage: "取引先IDは必須項目です",
        warningLevel: "error",
        validFlag: true,
        applicationStartDate: "2024-01-01T00:00:00Z",
        applicationEndDate: null,
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        validationRuleId: "550e8400-e29b-41d4-a716-446655440004",
        ruleName: "請求日付形式チェック",
        ruleDescription: "請求日付はISO 8601形式であること",
        targetTable: "請求書",
        targetColumn: "請求日",
        validationType: "format",
        validationCondition: '{"pattern": "^\\\\d{4}-\\\\d{2}-\\\\d{2}T"}',
        errorMessage: "請求日はISO 8601形式で入力してください",
        warningLevel: "error",
        validFlag: false,
        applicationStartDate: "2024-01-01T00:00:00Z",
        applicationEndDate: null,
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockRules);

    const result = await fetchAllValidationRules({});

    // 有効フラグがtrueのルール定義のみが返される
    expect(result.validationRules).toHaveLength(2);
    expect(result.validationRules[0].validationRuleId).toBe(
      "550e8400-e29b-41d4-a716-446655440001"
    );
    expect(result.validationRules[1].validationRuleId).toBe(
      "550e8400-e29b-41d4-a716-446655440003"
    );

    // すべてのルール定義の有効フラグがtrue
    result.validationRules.forEach((rule) => {
      expect(rule.validFlag).toBe(true);
    });

    // totalCountは返されたレコード数と一致
    expect(result.totalCount).toBe(2);

    // fetchedAtはISO 8601形式の日時文字列
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
