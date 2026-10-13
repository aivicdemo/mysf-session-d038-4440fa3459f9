import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-507: AIエージェント：修正内容を自動で再検証し、整合性確認結果が集計される', () => {
  it('ユーザーが data-reconciliation-approver ロールでアクティブな場合、修正内容の再検証ステップで整合性確認結果を集計する権限を持つ', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-reconciliation-001',
      userRole: 'data-reconciliation-approver',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-reconciliation-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
