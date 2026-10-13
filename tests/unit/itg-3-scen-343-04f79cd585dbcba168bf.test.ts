import { validateDiscrepancyConfirmationInputs } from '../../src/logic/authorization-validation';

describe('SCEN-343: 判定結果が「却下」の場合', () => {
  it('isValid=true が返される', async () => {
    const input = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      confirmationContent: '差異内容を確認し、システムAのデータが正確であることを検証しました。',
      judgmentResult: '却下',
    };

    const result = await validateDiscrepancyConfirmationInputs(input);

    expect(result.isValid).toBe(true);
    expect(typeof result.validatedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result.validatedAt)).toBe(true);
  });
});
