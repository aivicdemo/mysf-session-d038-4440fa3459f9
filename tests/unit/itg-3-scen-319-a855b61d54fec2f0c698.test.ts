import { validateUserAuthorizationForDiscrepancyConfirmation, UnauthorizedUserRoleError } from '../../src/logic/authorization-validation';

describe('SCEN-319: ユーザーのロールが差異確認操作の権限を持たないとき', () => {
  it('UnauthorizedUserRoleError が発生する', async () => {
    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        userRole: '営業部',
        userIsActive: true,
      }),
    ).rejects.toThrow(UnauthorizedUserRoleError);

    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        userRole: '営業部',
        userIsActive: true,
      }),
    ).rejects.toThrow('このユーザーのロールは差異確認操作を実行する権限がありません。');
  });
});
