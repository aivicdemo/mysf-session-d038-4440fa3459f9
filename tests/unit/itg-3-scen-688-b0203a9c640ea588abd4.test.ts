import { validateUserAuthorizationForToleranceJudgment, ValidateUserAuthorizationForToleranceJudgmentInput, ValidateUserAuthorizationForToleranceJudgmentOutput } from '../../src/logic/authorization-validation';

describe('SCEN-688: ユーザー権限検証 - 経理権限者が権限検証成功', () => {
  it('should authorize accounting manager for tolerance judgment operation', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-accounting-001',
      userRole: 'accounting_manager',
      userIsActive: true
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-accounting-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
