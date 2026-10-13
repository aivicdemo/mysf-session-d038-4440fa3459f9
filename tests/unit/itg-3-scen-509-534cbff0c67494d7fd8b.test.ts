import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-509: AIエージェント：検証ルールで判定できない複雑な異常が検出された場合、エスカレーションされる', () => {
  it('ユーザーが TOLERANCE_JUDGE ロールでアクティブな場合、許容範囲判定操作の実行権限を持つ', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-complex-anomaly-001',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-complex-anomaly-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
