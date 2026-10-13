import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-440: 商談ステータスと請求ステータスの対応ルールに基づいて不整合が検出され、差異レコードが生成される', () => {
  it('経理部ロールを持つ有効ユーザーの権限検証で、isAuthorized=true、userIdが一致、authorizedAtがISO 8601形式で返される', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    // ISO 8601形式（例：'2025-12-15T14:30:45.123Z'）の確認
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.authorizedAt).toMatch(iso8601Regex);
  });
});
