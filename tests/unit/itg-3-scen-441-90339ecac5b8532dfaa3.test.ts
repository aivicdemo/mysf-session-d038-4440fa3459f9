import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-441: 検出された差異が差異検出結果テーブルに永続化され、異常案件の一覧が保存される', () => {
  it('経理部ロールを持つ有効ユーザーが権限検証に成功し、isAuthorized=true、userIdとISO 8601形式のauthorizedAtが返される', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(typeof result.authorizedAt).toBe('string');
    // ISO 8601形式の日時
    const dateObj = new Date(result.authorizedAt);
    expect(dateObj.toString()).not.toBe('Invalid Date');
  });
});
