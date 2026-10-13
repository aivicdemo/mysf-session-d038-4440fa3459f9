import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-485: 修正内容が承認基準をすべて満たす場合、承認状態で差異検出結果テーブルに保存される', () => {
  it('data_reviewer ロールで isAuthorized=true を得る', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'data_reviewer',
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
