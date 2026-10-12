import { validateDataAgainstRules } from '../../src/logic/validation-rule-engine';
import type { ValidateDataAgainstRulesInput } from '../../src/logic/validation-rule-engine';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-978: validateDataAgainstRules - targetColumnがnullでテーブル全体を検証する場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('テーブル全体を検証する場合、そのテーブルに適用される全ルール定義が評価される', async () => {
    const mockListRecords = dataStore.listRecords as jest.Mock;

    // テスト前提データの準備
    const targetTable = 'sales_orders';
    const targetColumn = null;
    const inputData = {
      order_id: 'ORD-2024-001',
      customer_id: 'CUST-123',
      order_date: '2024-01-15',
      total_amount: 150000,
      status: 'confirmed'
    };
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    // dataStoreのモック戻り値：ルール定義データ
    const activeValidationRules = [
      {
        validationRuleId: 'RULE-001',
        ruleName: 'Rule 001',
        ruleDescription: 'Total amount must be positive',
        targetTable: 'sales_orders',
        targetColumn: null,
        validationType: 'business_rule',
        validationCondition: 'total_amount > 0',
        errorMessage: 'Total amount must be greater than 0',
        warningLevel: 'error',
        applicableStartDate: new Date('2024-01-01'),
        applicableEndDate: new Date('2024-12-31'),
      },
      {
        validationRuleId: 'RULE-002',
        ruleName: 'Rule 002',
        ruleDescription: 'Status must be valid',
        targetTable: 'sales_orders',
        targetColumn: null,
        validationType: 'business_rule',
        validationCondition: "status IN ('confirmed', 'pending', 'cancelled')",
        errorMessage: 'Status must be confirmed, pending, or cancelled',
        warningLevel: 'error',
        applicableStartDate: new Date('2024-01-01'),
        applicableEndDate: new Date('2024-12-31'),
      },
      {
        validationRuleId: 'RULE-003',
        ruleName: 'Rule 003',
        ruleDescription: 'Order ID must not be empty',
        targetTable: 'sales_orders',
        targetColumn: null,
        validationType: 'business_rule',
        validationCondition: "order_id IS NOT NULL AND order_id != ''",
        errorMessage: 'Order ID must not be empty',
        warningLevel: 'error',
        applicableStartDate: new Date('2024-01-01'),
        applicableEndDate: new Date('2024-12-31'),
      }
    ];

    mockListRecords.mockResolvedValue(activeValidationRules);

    // 実際の関数を呼び出す
    const input: ValidateDataAgainstRulesInput = {
      targetTable,
      targetColumn: targetColumn as null,
      inputData,
      currentDateTime
    };

    const result = await validateDataAgainstRules(input);

    // 期待結果の検証
    expect(result.isValid).toBe(true);
    expect(result.validationResults).toHaveLength(3);
    expect(result.errorSummary).toBeNull();

    // 各ルール検証結果の確認
    expect(result.validationResults[0]).toMatchObject({
      validationType: 'business_rule',
      passed: true,
    });
    expect(result.validationResults[1]).toMatchObject({
      validationType: 'business_rule',
      passed: true,
    });
    expect(result.validationResults[2]).toMatchObject({
      validationType: 'business_rule',
      passed: true,
    });

    // dataStoreが呼ばれたことを確認
    expect(mockListRecords).toHaveBeenCalled();
  });
});
