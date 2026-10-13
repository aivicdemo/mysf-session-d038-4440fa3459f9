import { confirmDiscrepancyDetail, UnauthorizedUserError } from '../../src/logic/discrepancy-confirmation-usecase';
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

describe('SCEN-118: エラー系 - 確認ユーザーが権限を保有していない', () => {
  const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';
  const confirmingUserId = '660e8400-e29b-41d4-a716-446655440001';
  const confirmationContent = '金額差異は為替レート変動による許容範囲内の誤差と判定';
  const currentDateTime = new Date('2026-01-15T10:30:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    (authValidation.validateDiscrepancyConfirmationInputs as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedAt: '2026-01-15T10:30:00Z',
    });

    (authValidation.validateUserAuthorizationForDiscrepancyConfirmation as jest.Mock).mockResolvedValue({
      isAuthorized: false,
      userId: confirmingUserId,
      authorizedAt: '2026-01-15T10:30:00Z',
    });
  });

  it('should throw UnauthorizedUserError when user lacks authorization', async () => {
    const input: ConfirmDiscrepancyDetailInput = {
      discrepancyId,
      confirmingUserId,
      confirmationContent,
      currentDateTime,
    };

    await expect(confirmDiscrepancyDetail(input)).rejects.toThrow(UnauthorizedUserError);

    await expect(confirmDiscrepancyDetail(input)).rejects.toThrow(
      'ユーザーは差異確認操作を実行する権限がありません。'
    );
  });
});
