import { validateUserAuthorizationForDiscrepancyConfirmation, InvalidUserIdFormatError } from '../../src/logic/authorization-validation';

describe('SCEN-321: 入力されたユーザーID が UUID 形式でないとき', () => {
  it('InvalidUserIdFormatError が発生する', async () => {
    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation({
        userId: 'invalid-uuid-format',
        userRole: '営業部システム担当',
        userIsActive: true,
      }),
    ).rejects.toThrow(InvalidUserIdFormatError);

    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation({
        userId: 'invalid-uuid-format',
        userRole: '営業部システム担当',
        userIsActive: true,
      }),
    ).rejects.toThrow('ユーザーIDの形式が不正です。');
  });
});
