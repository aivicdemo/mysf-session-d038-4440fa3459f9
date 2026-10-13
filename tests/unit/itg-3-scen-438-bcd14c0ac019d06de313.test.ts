import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-438: 旧システムと新システムから月次対象期間の取引先・商談・請求データが抽出され、データセットが次の工程に渡される', () => {
  it('経理部ロールの有効ユーザーが権限検証に成功し、出力型が正確な値を返す', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    // 出力型 ValidateUserAuthorizationForDiscrepancyConfirmationOutput の検証
    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(typeof result.authorizedAt).toBe('string');
    // ISO 8601形式の確認
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.authorizedAt).toMatch(dateRegex);
  });
});
