import { confirmDiscrepancyDetail, DiscrepancyNotFoundError } from '../../src/logic/discrepancy-confirmation-usecase';
import type { ConfirmDiscrepancyDetailInput } from '../../src/logic/discrepancy-confirmation-usecase';
import * as authValidation from '../../src/logic/authorization-validation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/authorization-validation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authorization-validation')>('../../src/logic/authorization-validation'),
  validateUserAuthorizationForDiscrepancyConfirmation: jest.fn(),
  validateDiscrepancyConfirmationInputs: jest.fn(),
}));

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
}));

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
}));

describe('SCEN-120: エラー系 - 差異レコードが存在しない', () => {
  const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';
  const confirmingUserId = '660e8400-e29b-41d4-a716-446655440001';
  const confirmationContent = '請求金額の差異を確認しました。旧システムの計算誤りが原因と判断します。';
  const currentDateTime = new Date('2026-10-07T10:30:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    (authValidation.validateDiscrepancyConfirmationInputs as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedAt: '2026-10-07T10:30:00Z',
    });

    (authValidation.validateUserAuthorizationForDiscrepancyConfirmation as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: confirmingUserId,
      authorizedAt: '2026-10-07T10:30:00Z',
    });

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue(null);
  });

  it('should throw DiscrepancyNotFoundError when discrepancy record does not exist', async () => {
    const input: ConfirmDiscrepancyDetailInput = {
      discrepancyId,
      confirmingUserId,
      confirmationContent,
      currentDateTime,
    };

    await expect(confirmDiscrepancyDetail(input)).rejects.toThrow(DiscrepancyNotFoundError);

    await expect(confirmDiscrepancyDetail(input)).rejects.toThrow('指定された差異レコードが見つかりません。');
  });
});
