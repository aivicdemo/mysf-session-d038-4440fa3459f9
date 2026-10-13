import { validateUserAuthorizationForDiscrepancyConfirmation, InactiveUserError } from '../../src/logic/authorization-validation';

describe('SCEN-320: ユーザーの有効フラグが false のとき', () => {
  it('InactiveUserError が発生する', async () => {
    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        userRole: '営業部システム担当',
        userIsActive: false,
      }),
    ).rejects.toThrow(InactiveUserError);

    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        userRole: '営業部システム担当',
        userIsActive: false,
      }),
    ).rejects.toThrow('このユーザーは無効化されているため、操作を実行できません。');
  });
});
