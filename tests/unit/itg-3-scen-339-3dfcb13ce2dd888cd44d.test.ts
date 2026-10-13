import { validateDiscrepancyConfirmationInputs, InvalidJudgmentResult } from '../../src/logic/authorization-validation';

describe('SCEN-339: validateDiscrepancyConfirmationInputs - Error case for invalid judgmentResult', () => {
  it('should throw InvalidJudgmentResult when judgmentResult is invalid', async () => {
    try {
      await validateDiscrepancyConfirmationInputs({
        discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
        confirmationContent: '差異内容を確認しました。データベース側のレコードに誤りがあります。',
        judgmentResult: '不承認',
      });
      fail('Should have thrown InvalidJudgmentResult');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidJudgmentResult);
      expect((error as Error).message).toBe('判定結果は「承認」「却下」「保留」のいずれかで指定してください。');
    }
  });
});
