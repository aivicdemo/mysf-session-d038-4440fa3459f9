import { validateDiscrepancyConfirmationInputs } from '../../src/logic/authorization-validation';

describe('SCEN-341: 確認内容が4000文字の場合', () => {
  it('isValid=true が返される', async () => {
    const confirmationContent4000 = 'x'.repeat(4000);

    const input = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      confirmationContent: confirmationContent4000,
      judgmentResult: '承認',
    };

    const result = await validateDiscrepancyConfirmationInputs(input);

    expect(result.isValid).toBe(true);
    expect(typeof result.validatedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result.validatedAt)).toBe(true);
  });
});
