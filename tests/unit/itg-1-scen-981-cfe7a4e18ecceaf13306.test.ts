import { validateDataAgainstRules } from '../../src/logic/validation-rule-engine';
import type { ValidateDataAgainstRulesInput } from '../../src/logic/validation-rule-engine';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-981: validateDataAgainstRules - 入力データが合格した場合、errorSummaryがnullで返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('全ルール定義の検証条件が満たされた場合、errorSummaryはnullが返される', async () => {
    const mockListRecords = dataStore.listRecords as jest.Mock;

    // テスト前提データの準備
    const targetTable = 'sales_orders';
    const targetColumn = null;
    const inputData = {
      order_id: 'ORD-20240115-001',
      customer_id: 'CUST-00123',
      order_amount: 150000,
      order_date: '2024-01-15',
      status: 'confirmed'
    };
    const currentDateTime = new Date('2024-01-15T10:00:00Z');

    // dataStoreのモック戻り値：ルール定義データ
    const activeValidationRules = [
      {
        validationRuleId: 'RULE-001',
        ruleName: 'Rule 001',
        ruleDescription: 'Order amount must be positive',
        targetTable: 'sales_orders',
        targetColumn: null,
        validationType: 'business_logic',
        validationCondition: 'order_amount > 0',
        errorMessage: '受注金額は0より大きい値を指定してください',
        warningLevel: 'error',
        applicableStartDate: new Date('2024-01-01'),
        applicableEndDate: null,
      },
      {
        validationRuleId: 'RULE-002',
        ruleName: 'Rule 002',
        ruleDescription: 'Status must be valid',
        targetTable: 'sales_orders',
        targetColumn: null,
        validationType: 'format',
        validationCondition: "status IN ('pending', 'confirmed', 'cancelled')",
        errorMessage: 'ステータスは pending, confirmed, cancelled のいずれかである必要があります',
        warningLevel: 'error',
        applicableStartDate: new Date('2024-01-01'),
        applicableEndDate: null,
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
    expect(result.validationResults).toHaveLength(2);

    // 各検証結果が合格状態であることを確認
    result.validationResults.forEach(validationResult => {
      expect(validationResult).toMatchObject({
        passed: true,
      });
    });

    // errorSummaryがnullであることを確認
    expect(result.errorSummary).toBeNull();

    // dataStoreが呼ばれたことを確認
    expect(mockListRecords).toHaveBeenCalled();
  });
});
