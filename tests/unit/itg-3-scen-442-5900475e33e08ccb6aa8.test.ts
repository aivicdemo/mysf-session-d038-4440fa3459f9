import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-442: 各差異の種類に対応する許容基準が取得され、差異の許容範囲判定に使用される', () => {
  it('経理部ロールを持つ有効ユーザーが権限検証に成功し、isAuthorized=true、userIdと権限検証実行時刻のISO 8601形式のauthorizedAtが返される', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(typeof result.authorizedAt).toBe('string');
    // ISO 8601形式の確認
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.authorizedAt).toMatch(iso8601Regex);
  });
});
