import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-487: 修正内容の再検証結果（承認可否・判定理由・判定者・判定日時）が差異検出結果テーブルに保存される', () => {
  it('reconciliation_reviewer ロールで isAuthorized=true を得る', async () => {
    const input = {
      userId: 'user-reconciliation-reviewer-001',
      userRole: 'reconciliation_reviewer',
      userIsActive: true
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-reconciliation-reviewer-001');
    expect(result.authorizedAt).toBeDefined();
    // authorizedAt は ISO 8601 形式の日時文字列であることを確認
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.authorizedAt)).toBe(true);
  });
});
