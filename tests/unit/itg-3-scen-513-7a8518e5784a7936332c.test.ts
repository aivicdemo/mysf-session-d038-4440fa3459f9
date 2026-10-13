import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-513: AIエージェント：差異検出レポートがAmazon S3に保存される', () => {
  it('TOLERANCE_JUDGE ロールでアクティブユーザーの場合、isAuthorized=true で権限認可情報を返す', async () => {
    const input = {
      userId: 'user-12345',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    // 期待結果：isAuthorized=true、userId='user-12345'、authorizedAt は ISO 8601形式のタイムスタンプ
    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });

  it('ロール権限があり、ユーザーがアクティブな場合、エラーなく出力型を返す', async () => {
    const input = {
      userId: 'user-12345',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result).toBeDefined();
    expect(result.isAuthorized).toBeDefined();
    expect(result.userId).toBeDefined();
    expect(result.authorizedAt).toBeDefined();
    expect(typeof result.isAuthorized).toBe('boolean');
    expect(typeof result.userId).toBe('string');
    expect(typeof result.authorizedAt).toBe('string');
  });
});
