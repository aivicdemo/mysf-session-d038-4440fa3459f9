import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-318: 有効で権限のあるユーザーが差異確認操作を実行するとき', () => {
  it('isAuthorized が true で authorizedAt に ISO 8601 形式の日時が返される', async () => {
    const result = await validateUserAuthorizationForDiscrepancyConfirmation({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '営業部システム担当',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
