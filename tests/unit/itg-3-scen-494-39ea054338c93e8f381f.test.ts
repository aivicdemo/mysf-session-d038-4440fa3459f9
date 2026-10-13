import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-494: 許容閾値が負の数または0の場合、データ整合性検証を実行できない', () => {
  it('data_validator ロールのユーザーが権限を持つ場合、isAuthorized=true で返される', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'data_validator',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
