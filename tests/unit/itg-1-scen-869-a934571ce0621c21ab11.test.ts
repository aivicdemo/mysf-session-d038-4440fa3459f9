import { fetchAllValidationRules } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-869: fetchAllValidationRules - データ検証ルール定義テーブルにアクセス可能な状況で、すべての有効なルール定義を取得できる", () => {
  const mockValidationRules = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      validationRuleId: "550e8400-e29b-41d4-a716-446655440001",
      ruleName: "営業金額の正数チェック",
      ruleDescription: "営業金額は0より大きい値のみを許可",
      targetTable: "商談",
      targetColumn: "金額",
      validationType: "range",
      validationCondition: '{"min": 0, "exclusive": true}',
      errorMessage: "営業金額は0より大きい値を入力してください",
      warningLevel: "error",
      validFlag: true,
      applicationStartDate: "2026-01-01T00:00:00Z",
      applicationEndDate: null,
      createdAt: "2026-01-01T10:00:00Z",
      updatedAt: "2026-01-01T10:00:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440099",
      updatedBy: "550e8400-e29b-41d4-a716-446655440099",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      validationRuleId: "550e8400-e29b-41d4-a716-446655440002",
      ruleName: "請求金額の必須チェック",
      ruleDescription: "請求明細の金額は必ず入力すること",
      targetTable: "請求明細",
      targetColumn: "金額",
      validationType: "required",
      validationCondition: "{}",
      errorMessage: "請求金額は必須項目です",
      warningLevel: "error",
      validFlag: true,
      applicationStartDate: "2026-01-01T00:00:00Z",
      applicationEndDate: null,
      createdAt: "2026-01-01T10:00:00Z",
      updatedAt: "2026-01-01T10:00:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440099",
      updatedBy: "550e8400-e29b-41d4-a716-446655440099",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      validationRuleId: "550e8400-e29b-41d4-a716-446655440003",
      ruleName: "取引先責任者メールアドレスフォーマット",
      ruleDescription: "取引先責任者のメールアドレスは正しいフォーマットであること",
      targetTable: "取引先責任者",
      targetColumn: "メールアドレス",
      validationType: "regex",
      validationCondition: '{"pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$"}',
      errorMessage: "有効なメールアドレスを入力してください",
      warningLevel: "error",
      validFlag: true,
      applicationStartDate: "2026-01-01T00:00:00Z",
      applicationEndDate: null,
      createdAt: "2026-01-01T10:00:00Z",
      updatedAt: "2026-01-01T10:00:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440099",
      updatedBy: "550e8400-e29b-41d4-a716-446655440099",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440004",
      validationRuleId: "550e8400-e29b-41d4-a716-446655440004",
      ruleName: "廃止ルール：旧金額フォーマット",
      ruleDescription: "2025年以前に廃止されたルール",
      targetTable: "請求書",
      targetColumn: "金額",
      validationType: "format",
      validationCondition: '{"type": "currency_old"}',
      errorMessage: "このルールは廃止されています",
      warningLevel: "warning",
      validFlag: false,
      applicationStartDate: "2025-01-01T00:00:00Z",
      applicationEndDate: "2025-12-31T23:59:59Z",
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-12-31T10:00:00Z",
      createdBy: "550e8400-e29b-41d4-a716-446655440099",
      updatedBy: "550e8400-e29b-41d4-a716-446655440099",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("有効フラグが true のルール定義のみが 3 件返される", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockValidationRules);

    const result = await fetchAllValidationRules({});

    expect(result.validationRules).toHaveLength(3);
    expect(result.validationRules.map((r) => r.validationRuleId)).toEqual([
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002",
      "550e8400-e29b-41d4-a716-446655440003",
    ]);
  });

  it("有効フラグが true のルール定義の詳細情報が正確に返される", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockValidationRules);

    const result = await fetchAllValidationRules({});

    const rule1 = result.validationRules.find((r) => r.ruleName === "営業金額の正数チェック");
    expect(rule1).toBeDefined();
    expect(rule1?.validFlag).toBe(true);
    expect(rule1?.targetTable).toBe("商談");

    const rule2 = result.validationRules.find((r) => r.ruleName === "請求金額の必須チェック");
    expect(rule2).toBeDefined();
    expect(rule2?.validFlag).toBe(true);
    expect(rule2?.targetTable).toBe("請求明細");

    const rule3 = result.validationRules.find((r) => r.ruleName === "取引先責任者メールアドレスフォーマット");
    expect(rule3).toBeDefined();
    expect(rule3?.validFlag).toBe(true);
    expect(rule3?.targetTable).toBe("取引先責任者");
  });

  it("有効フラグが false の「廃止ルール：旧金額フォーマット」は validationRules に含まれない", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockValidationRules);

    const result = await fetchAllValidationRules({});

    const resultIds = result.validationRules.map((r) => r.validationRuleId);
    expect(resultIds).not.toContain("550e8400-e29b-41d4-a716-446655440004");
  });

  it("totalCount は 3 となる", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockValidationRules);

    const result = await fetchAllValidationRules({});

    expect(result.totalCount).toBe(3);
  });

  it("fetchedAt は ISO 8601 形式の文字列を返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockValidationRules);

    const result = await fetchAllValidationRules({});

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);
  });
});
