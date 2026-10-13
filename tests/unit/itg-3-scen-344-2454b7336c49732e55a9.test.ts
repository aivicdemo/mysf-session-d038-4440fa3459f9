import { validateDiscrepancyConfirmationInputs } from '../../src/logic/authorization-validation';

describe('SCEN-344: 判定結果が「保留」の場合', () => {
  it('isValid=true が返される', async () => {
    const input = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      confirmationContent: '差異内容を確認しました。さらなる情報が必要なため、現在調査中です。',
      judgmentResult: '保留',
    };

    const result = await validateDiscrepancyConfirmationInputs(input);

    expect(result.isValid).toBe(true);
    expect(typeof result.validatedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result.validatedAt)).toBe(true);
  });
});
