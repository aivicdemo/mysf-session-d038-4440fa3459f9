import {
  validateDataAgainstRules,
  loadActiveValidationRules,
} from '../../src/logic/validation-rule-engine';

describe('SCEN-974: 有効なルール定義が存在し入力データが全ルールに合格する場合', () => {
  it('isValidがtrueで全ルールの検証結果が合格として返される', async () => {
    const targetTable = 'sales_orders';
    const targetColumn = null;
    const inputData = {
      order_id: 'SO-2024-001',
      customer_id: 'CUST-123',
      order_amount: 50000,
      order_date: '2024-01-15',
      payment_terms: 'NET30',
    };
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    const result = await validateDataAgainstRules({
      targetTable,
      targetColumn,
      inputData,
      currentDateTime,
    });

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toHaveLength(3);
    expect(result.errorSummary).toBeNull();

    result.validationResults.forEach((vr) => {
      expect(vr.passed).toBe(true);
    });
  });
});
