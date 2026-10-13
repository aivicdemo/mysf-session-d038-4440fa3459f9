import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-492: 修正内容の再検証から承認判定までの処理が開始から完了まで通り、工程を順にたどり、次の処理へ結果が渡り、記録が残る', () => {
  it('TOLERANCE_JUDGE ロールのユーザーが権限を持つ場合、isAuthorized=true で返される', async () => {
    const input = {
      userId: 'USR-20240115-001',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('USR-20240115-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
