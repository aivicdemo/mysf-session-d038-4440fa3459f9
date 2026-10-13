import { validateUserAuthorizationForToleranceJudgment, UnauthorizedRoleError } from '../../src/logic/authorization-validation';

describe('SCEN-481: 金額ズレが承認基準の許容範囲を超える場合、修正内容は却下される', () => {
  it('data_analyst ロールの場合、許容範囲判定の権限がなく UnauthorizedRoleError が発生', async () => {
    const input = {
      userId: 'user-002',
      userRole: 'data_analyst',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'UnauthorizedRoleError',
        message: expect.stringContaining('このユーザーのロールは差異の許容範囲判定を実行する権限がありません。'),
      }),
    );
  });
});
