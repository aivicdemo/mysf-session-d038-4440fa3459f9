import {
  validateDiscrepancyConfirmationInputs,
  InvalidDiscrepancyIdFormat,
  MissingDiscrepancyId,
} from '../../src/logic/authorization-validation';

describe('SCEN-336: validateDiscrepancyConfirmationInputs - Error cases for discrepancyId validation', () => {
  it('should throw MissingDiscrepancyId when discrepancyId is null', async () => {
    try {
      await validateDiscrepancyConfirmationInputs({
        discrepancyId: null as any,
        confirmationContent: '差異を確認しました',
        judgmentResult: '承認',
      });
      fail('Should have thrown MissingDiscrepancyId');
    } catch (error) {
      expect(error).toBeInstanceOf(MissingDiscrepancyId);
      expect((error as Error).message).toBe('差異IDは必須項目です。');
    }
  });

  it('should throw InvalidDiscrepancyIdFormat when discrepancyId is empty string', async () => {
    try {
      await validateDiscrepancyConfirmationInputs({
        discrepancyId: '',
        confirmationContent: '差異を確認しました',
        judgmentResult: '承認',
      });
      fail('Should have thrown InvalidDiscrepancyIdFormat');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDiscrepancyIdFormat);
      expect((error as Error).message).toBe('差異IDの形式が不正です。有効なUUID形式で指定してください。');
    }
  });

  it('should throw InvalidDiscrepancyIdFormat when discrepancyId is invalid format', async () => {
    try {
      await validateDiscrepancyConfirmationInputs({
        discrepancyId: 'invalid-uuid-format',
        confirmationContent: '差異を確認しました',
        judgmentResult: '承認',
      });
      fail('Should have thrown InvalidDiscrepancyIdFormat');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDiscrepancyIdFormat);
      expect((error as Error).message).toBe('差異IDの形式が不正です。有効なUUID形式で指定してください。');
    }
  });

  it('should throw MissingDiscrepancyId when discrepancyId is undefined', async () => {
    try {
      await validateDiscrepancyConfirmationInputs({
        discrepancyId: undefined as any,
        confirmationContent: '差異を確認しました',
        judgmentResult: '承認',
      });
      fail('Should have thrown MissingDiscrepancyId');
    } catch (error) {
      expect(error).toBeInstanceOf(MissingDiscrepancyId);
      expect((error as Error).message).toBe('差異IDは必須項目です。');
    }
  });
});
