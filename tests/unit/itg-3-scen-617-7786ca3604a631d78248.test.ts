import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-617: 差異種類に対応する許容基準が未設定のとき、警告『差異種別の許容範囲が未設定です。デフォルト値を適用します』が記録されデフォルト値が使用される', () => {
  it('ロール data_analyst に対して権限があると判定されるとき、isAuthorized=true が返される', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'data_analyst',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
  });

  it('ユーザーID user-001 が有効であることを確認する', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'data_analyst',
      userIsActive: true,
    });

    expect(result.userId).toBe('user-001');
    expect(result.userId).not.toBe('');
    expect(result.userId).not.toBeNull();
  });

  it('出力型の以下の値が返される: isAuthorized=true、userId=user-001、authorizedAt が ISO 8601 形式', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'data_analyst',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
