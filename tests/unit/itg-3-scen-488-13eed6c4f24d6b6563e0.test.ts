import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-488: 修正前後のデータ差分と検証結果が是正追跡管理テーブルに記録され、是正履歴が永続化される', () => {
  it('DATA_VERIFIER ロールで isAuthorized=true を得る', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'DATA_VERIFIER',
      userIsActive: true
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toBeDefined();
    // authorizedAt は ISO 8601 形式の日時文字列であることを確認
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.authorizedAt)).toBe(true);
  });
});
