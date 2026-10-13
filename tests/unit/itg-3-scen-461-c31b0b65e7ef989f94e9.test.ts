import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-461: 検証ルールで判定できない複雑な異常が検出されたとき、AIエージェントが例外案件として人に報告する', () => {
  it('経理部ロールを持つ有効ユーザーとして差異確認操作の実行権限が認可される', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result.authorizedAt)).toBe(true);
  });
});
