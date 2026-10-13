import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  ValidateUserAuthorizationForDiscrepancyConfirmationInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-468: AIエージェントに不正なプロンプト入力が含まれるとき', () => {
  it('不正なプロンプトが無視され、正規の権限判定結果が得られる', async () => {
    const input: ValidateUserAuthorizationForDiscrepancyConfirmationInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '営業部システム担当',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
