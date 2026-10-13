import { validateDiscrepancyConfirmationInputs } from '../../src/logic/authorization-validation';

describe('SCEN-335: validateDiscrepancyConfirmationInputs - Normal case with valid inputs', () => {
  it('should return isValid=true when all inputs are valid', async () => {
    const result = await validateDiscrepancyConfirmationInputs({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      confirmationContent:
        'このシステムの差異は、Salesforce移行データと新システムの取引先マスタ間で発生した。確認結果、取引先責任者の部門情報が新システムで未同期であることが原因。是正方法：バッチ処理で部門マッピングを再実行し、全取引先責任者データを再同期する予定。',
      judgmentResult: '承認',
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
