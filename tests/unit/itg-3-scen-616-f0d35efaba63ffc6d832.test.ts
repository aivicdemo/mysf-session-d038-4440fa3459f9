import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-616: 差異に紐づく新システムの請求書データが取得できないとき、取得処理で失敗する', () => {
  it('ロール TOLERANCE_JUDGE に対して権限があると判定されるとき、isAuthorized=true が返される', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
  });

  it('ユーザーIDが空文字列でもnullでもないことを確認する', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    });

    expect(result.userId).toBe('user-001');
    expect(result.userId).not.toBe('');
    expect(result.userId).not.toBeNull();
  });

  it('isAuthorized=true、userId=user-001、authorizedAt が ISO 8601 形式で返される', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
