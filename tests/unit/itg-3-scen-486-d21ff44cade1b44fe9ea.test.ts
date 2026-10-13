import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-486: 修正内容が承認基準をすべて満たすが軽微な警告がある場合、警告状態で差異検出結果テーブルに保存される', () => {
  it('data_reconciliation_approver ロールで isAuthorized=true を得る', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'data_reconciliation_approver',
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
