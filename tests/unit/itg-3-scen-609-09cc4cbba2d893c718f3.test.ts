import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-609: 許容範囲判定結果（判定フラグ・判定日時・判定者）が差異検出結果テーブルに保存される', () => {
  it('ロール TOLERANCE_JUDGE に対して権限があると判定されるとき、isAuthorized=true が返される', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });

  it('出力型の isAuthorized フィールドが true、userId が user-001、authorizedAt が ISO 8601 形式である', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-001',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    });

    expect(result).toEqual({
      isAuthorized: true,
      userId: 'user-001',
      authorizedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/),
    });
  });
});
