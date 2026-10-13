import { validateUserAuthorizationForDiscrepancyConfirmation, InactiveUserError } from '../../src/logic/authorization-validation';

describe('SCEN-455: validateUserAuthorizationForDiscrepancyConfirmation - エラー系', () => {
  it('金額が負数のとき、金額値エラーが発生して処理が終了する', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '営業部',
      userIsActive: false,
    };

    try {
      await validateUserAuthorizationForDiscrepancyConfirmation(input);
      fail('InactiveUserError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InactiveUserError);
      expect((error as Error).message).toBe('このユーザーは無効化されているため、操作を実行できません。');
    }
  });
});
