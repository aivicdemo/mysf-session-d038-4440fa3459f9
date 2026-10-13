import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  UnauthorizedUserRoleError,
} from '../../src/logic/authorization-validation';

describe('SCEN-448: 月次締め実行ユーザーが整合性検証実行権限を持たないとき、権限検証に失敗して処理が中断される', () => {
  it('営業部ロールの無権限ユーザーが差異確認操作を実行しようとすると、UnauthorizedUserRoleErrorが発生する', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '営業部',
      userIsActive: true,
    };

    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation(input),
    ).rejects.toThrow(UnauthorizedUserRoleError);

    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation(input),
    ).rejects.toThrow(
      'このユーザーのロールは差異確認操作を実行する権限がありません。',
    );
  });
});
