import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-508: AIエージェント：月次締め承認可否の判定結果が出力される', () => {
  it('ユーザーが FINANCE_MANAGER ロールでアクティブな場合、月次締め承認可否の判定操作を実行する権限を返す', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'FINANCE_MANAGER',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
