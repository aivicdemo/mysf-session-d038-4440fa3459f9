import { validateDiscrepancyConfirmationInputs, ConfirmationContentTooLong } from '../../src/logic/authorization-validation';

describe('SCEN-338: ConfirmationContentTooLong error', () => {
  it('should throw ConfirmationContentTooLong error when confirmationContent exceeds 4000 characters', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';
    const confirmationContent = 'a'.repeat(4001);
    const judgmentResult = '承認';

    await expect(
      validateDiscrepancyConfirmationInputs({
        discrepancyId,
        confirmationContent,
        judgmentResult,
      })
    ).rejects.toThrow(ConfirmationContentTooLong);

    try {
      await validateDiscrepancyConfirmationInputs({
        discrepancyId,
        confirmationContent,
        judgmentResult,
      });
      fail('Should have thrown ConfirmationContentTooLong error');
    } catch (error) {
      if (error instanceof ConfirmationContentTooLong) {
        expect(error.message).toBe('確認内容は4000文字以内で指定してください。');
      } else {
        throw error;
      }
    }
  });
});
