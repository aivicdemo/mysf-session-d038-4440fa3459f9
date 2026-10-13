import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-610: 許容範囲判定結果を反映した最新のダッシュボード表示データが生成され、API応答として返される', () => {
  it('ロール tolerance_judge に対する権限があるとき、isAuthorized=true が返される', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'tolerance_judge',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
  });

  it('ユーザーID user-001 が空文字列でもnullでもないことを確認する', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'tolerance_judge',
      userIsActive: true,
    });

    expect(result.userId).toBe('user-001');
    expect(result.userId).not.toBe('');
    expect(result.userId).not.toBeNull();
  });

  it('出力値が isAuthorized=true、userId=user-001、authorizedAt が ISO 8601 形式である', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'tolerance_judge',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
