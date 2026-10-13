import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-437: 月次締め実行ユーザーが整合性検証実行権限を持つとき、権限検証に成功して次の工程に進む', () => {
  it('経理部ロールを持つ有効ユーザーの権限検証が成功する', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.authorizedAt).toBeDefined();
    expect(typeof result.authorizedAt).toBe('string');
    // ISO 8601形式の確認
    expect(() => new Date(result.authorizedAt)).not.toThrow();
    const dateObj = new Date(result.authorizedAt);
    expect(dateObj.toString()).not.toBe('Invalid Date');
  });
});
