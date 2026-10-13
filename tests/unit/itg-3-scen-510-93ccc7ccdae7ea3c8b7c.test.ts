import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-510: AIエージェント：営業担当者からの修正内容に対する異議がある場合、エスカレーションされる', () => {
  it('SALES_MANAGER ロールを持つアクティブユーザーが修正内容の異議判定について権限を持つ', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'USR-20250107-001',
      userRole: 'SALES_MANAGER',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('USR-20250107-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
