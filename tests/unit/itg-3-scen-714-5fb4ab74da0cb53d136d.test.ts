import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  ValidateUserAuthorizationForDiscrepancyConfirmationInput,
  ValidateUserAuthorizationForDiscrepancyConfirmationOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-714: 是正によって複数の不整合が解消されたとき、解消された不整合の件数が正確にカウントされて検証結果に反映される', () => {
  it('ユーザーのロール・権限が有効であるとき、isAuthorized=true、userId、authorizedAt=ISO 8601形式の日時 が返される', async () => {
    const input: ValidateUserAuthorizationForDiscrepancyConfirmationInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForDiscrepancyConfirmationOutput = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(typeof result.authorizedAt).toBe('string');
    // ISO 8601形式の日時であることを確認
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.authorizedAt)).toBe(true);
  });
});
