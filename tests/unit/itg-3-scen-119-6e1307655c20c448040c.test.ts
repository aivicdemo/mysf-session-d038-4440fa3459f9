import { confirmDiscrepancyDetail, InvalidInputError } from '../../src/logic/discrepancy-confirmation-usecase';
import type { ConfirmDiscrepancyDetailInput } from '../../src/logic/discrepancy-confirmation-usecase';
import * as authValidation from '../../src/logic/authorization-validation';

jest.mock('../../src/logic/authorization-validation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authorization-validation')>('../../src/logic/authorization-validation'),
  validateUserAuthorizationForDiscrepancyConfirmation: jest.fn(),
  validateDiscrepancyConfirmationInputs: jest.fn(),
}));

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
}));

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
}));

describe('SCEN-119: エラー系 - 入力値の妥当性検証に失敗', () => {
  const discrepancyId = 'invalid-uuid-format';
  const confirmingUserId = '550e8400-e29b-41d4-a716-446655440000';
  const confirmationContent = '確認メモ';
  const currentDateTime = new Date('2026-10-07T10:30:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    (authValidation.validateDiscrepancyConfirmationInputs as jest.Mock).mockResolvedValue({
      isValid: false,
      validatedAt: '2026-10-07T10:30:00Z',
    });
  });

  it('should throw InvalidInputError when input validation fails', async () => {
    const input: ConfirmDiscrepancyDetailInput = {
      discrepancyId,
      confirmingUserId,
      confirmationContent,
      currentDateTime,
    };

    await expect(confirmDiscrepancyDetail(input)).rejects.toThrow(InvalidInputError);

    await expect(confirmDiscrepancyDetail(input)).rejects.toThrow(
      '入力値が不正です。差異ID、ユーザーID、確認内容を確認してください。'
    );
  });
});
