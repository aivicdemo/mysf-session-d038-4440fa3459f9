import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  ValidateUserAuthorizationForDiscrepancyConfirmationInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-471: AIエージェントが既に実行済みの差異に対して再実行されるとき', () => {
  it('冪等性を保って同じ結果を返す', async () => {
    const input: ValidateUserAuthorizationForDiscrepancyConfirmationInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result1 = await validateUserAuthorizationForDiscrepancyConfirmation(input);
    const result2 = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result1.isAuthorized).toBe(result2.isAuthorized);
    expect(result1.isAuthorized).toBe(true);
    expect(result1.userId).toBe(result2.userId);
    expect(result1.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result1.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result2.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
