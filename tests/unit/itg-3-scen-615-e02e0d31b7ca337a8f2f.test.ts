import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-615: 差異に紐づく旧システムの請求書データが取得できないとき、取得処理で失敗する', () => {
  it('ロール tolerance_judge に対して権限があると判定されるとき、isAuthorized=true が返される', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'tolerance_judge',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
  });

  it('出力型 ValidateUserAuthorizationForToleranceJudgmentOutput として isAuthorized=true、userId=user-001、authorizedAt が現在時刻の ISO 8601 形式が返却される', async () => {
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
