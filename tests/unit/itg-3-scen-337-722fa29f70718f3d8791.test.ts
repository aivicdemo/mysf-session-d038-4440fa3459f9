import {
  validateDiscrepancyConfirmationInputs,
  MissingDiscrepancyId,
  MissingConfirmationContent,
} from '../../src/logic/authorization-validation';

describe('SCEN-337: validateDiscrepancyConfirmationInputs - Error cases for null confirmationContent', () => {
  it('should throw MissingDiscrepancyId and MissingConfirmationContent when both are null', async () => {
    try {
      await validateDiscrepancyConfirmationInputs({
        discrepancyId: null as any,
        confirmationContent: null as any,
        judgmentResult: '承認',
      });
      fail('Should have thrown error');
    } catch (error) {
      expect(error).toBeInstanceOf(MissingDiscrepancyId);
      expect((error as Error).message).toBe('差異IDは必須項目です。');
    }
  });
});
