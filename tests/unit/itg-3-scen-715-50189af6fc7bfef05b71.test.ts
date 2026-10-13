import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  ValidateUserAuthorizationForDiscrepancyConfirmationInput,
  ValidateUserAuthorizationForDiscrepancyConfirmationOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-715: 是正後も残存する不整合が存在するとき、残存する不整合の詳細が案件ID・差異内容・原因推定とともにリストとして検証結果に含められる', () => {
  it('ユーザー権限の検証で isAuthorized=true、userId、authorizedAt=ISO 8601形式の日時 が返される', async () => {
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
