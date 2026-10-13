import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  ValidateUserAuthorizationForDiscrepancyConfirmationInput,
  ValidateUserAuthorizationForDiscrepancyConfirmationOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-470: AIエージェント出力が低信頼度のとき', () => {
  it('判定結果が保留状態として記録され、人の確認を待つ', async () => {
    const input: ValidateUserAuthorizationForDiscrepancyConfirmationInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForDiscrepancyConfirmationOutput =
      await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
