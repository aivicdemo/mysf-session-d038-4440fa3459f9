import {
  validateDataAgainstRules,
  ValidationConditionEvaluationError,
} from '../../src/logic/validation-rule-engine';

describe('SCEN-976: ルール定義の検証条件の評価に失敗した場合', () => {
  it('ValidationConditionEvaluationErrorエラーが発生する', async () => {
    const targetTable = 'sales_orders';
    const targetColumn = null;
    const inputData = {
      order_id: 'ORD-2024-001',
      customer_id: 'CUST-001',
      amount: 150000,
      order_date: '2024-01-15',
    };
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    await expect(
      validateDataAgainstRules({
        targetTable,
        targetColumn,
        inputData,
        currentDateTime,
      })
    ).rejects.toThrow(ValidationConditionEvaluationError);

    await expect(
      validateDataAgainstRules({
        targetTable,
        targetColumn,
        inputData,
        currentDateTime,
      })
    ).rejects.toThrow('ルール定義の検証条件を評価できません。ルール定義を確認してください。');
  });
});
