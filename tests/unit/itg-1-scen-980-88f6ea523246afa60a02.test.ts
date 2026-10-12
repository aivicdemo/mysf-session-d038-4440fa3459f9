import { validateDataAgainstRules } from '../../src/logic/validation-rule-engine';
import type { ValidateDataAgainstRulesInput } from '../../src/logic/validation-rule-engine';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-980: validateDataAgainstRules - ルール適用期間の判定で現在日時がルール有効期間外の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('適用期間がcurrentDateTimeより後のルールは評価対象から除外される', async () => {
    const mockListRecords = dataStore.listRecords as jest.Mock;

    // テスト前提データの準備
    const targetTable = 'sales_orders';
    const targetColumn = null;
    const inputData = {
      order_id: 'ORD-2024-001',
      amount: 150000,
      customer_id: 'CUST-123'
    };
    const currentDateTime = new Date('2024-06-15T10:30:00Z');

    // dataStoreのモック戻り値：ルール定義データ
    const activeValidationRules = [
      {
        validationRuleId: 'RULE-001',
        ruleName: 'Rule 001',
        ruleDescription: 'Amount range validation',
        targetTable: 'sales_orders',
        targetColumn: null,
        validationType: 'range',
        validationCondition: 'amount > 0 AND amount <= 1000000',
        errorMessage: 'Amount must be between 0 and 1000000',
        warningLevel: 'error',
        applicableStartDate: new Date('2024-01-01'),
        applicableEndDate: undefined,
      },
      {
        validationRuleId: 'RULE-002',
        ruleName: 'Rule 002',
        ruleDescription: 'Customer ID required',
        targetTable: 'sales_orders',
        targetColumn: null,
        validationType: 'required',
        validationCondition: 'customer_id IS NOT NULL',
        errorMessage: 'Customer ID is required',
        warningLevel: 'error',
        applicableStartDate: new Date('2024-01-01'),
        applicableEndDate: undefined,
      },
      {
        validationRuleId: 'RULE-003',
        ruleName: 'Rule 003',
        ruleDescription: 'Minimum amount warning',
        targetTable: 'sales_orders',
        targetColumn: null,
        validationType: 'range',
        validationCondition: 'amount >= 100000',
        errorMessage: 'Amount should be 100000 or more',
        warningLevel: 'warning',
        applicableStartDate: new Date('2024-07-01T00:00:00Z'),
        applicableEndDate: new Date('2024-12-31T23:59:59Z'),
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

    // 期待結果の検証: isValidはtrueを返す（適用期間内のルールが合格）
    expect(result.isValid).toBe(true);

    // validationResultsは2件のルール検証結果を含む（RULE-001, RULE-002）
    expect(result.validationResults).toHaveLength(2);
    expect(result.errorSummary).toBeNull();

    // RULE-001の結果が合格であることを確認
    const rule001Result = result.validationResults.find(r => r.validationType === 'range' && result.validationResults.indexOf(r) === 0);
    expect(rule001Result).toMatchObject({
      validationType: 'range',
      passed: true,
    });

    // RULE-002の結果が合格であることを確認
    const rule002Result = result.validationResults.find(r => r.validationType === 'required');
    expect(rule002Result).toMatchObject({
      validationType: 'required',
      passed: true,
    });

    // RULE-003は適用期間外なのでvalidationResultsに含まれないことを確認
    expect(result.validationResults.filter(r => r.details?.includes?.('RULE-003'))).toHaveLength(0);

    // dataStoreが呼ばれたことを確認
    expect(mockListRecords).toHaveBeenCalled();
  });
});
