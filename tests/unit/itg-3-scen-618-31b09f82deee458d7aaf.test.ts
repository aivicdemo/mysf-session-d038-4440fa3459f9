import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-618: 判定対象の差異値が負の値のとき、『差異の数値は0以上である必要があります』例外が発生する', () => {
  it('ロール tolerance_judge に対して権限があると判定されるとき、isAuthorized=true が返される', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-123',
      userRole: 'tolerance_judge',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
  });

  it('関数が正常に完了し、isAuthorized=true、userId=user-123、authorizedAt は ISO 8601形式の日時文字列が返される', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-123',
      userRole: 'tolerance_judge',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-123');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
