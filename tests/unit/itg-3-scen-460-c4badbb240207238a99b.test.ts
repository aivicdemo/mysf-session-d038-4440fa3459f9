import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-460: AIエージェントが月次締め承認可否の判定結果を出力する', () => {
  it('ユーザー認可検証関数が正常に承認権限を返す', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(typeof result.authorizedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result.authorizedAt)).toBe(true);
  });
});
