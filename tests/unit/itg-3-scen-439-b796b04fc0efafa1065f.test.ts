import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-439: 取引先から請求までの参照チェーン全体を検証し、参照先が存在しない・ステータス不整合・金額ズレが検出される', () => {
  it('経理部ロールの有効ユーザーが権限検証に成功し、isAuthorizedがtrue、userIdと秒単位以上の精度のauthorizedAtが返される', async () => {
    const beforeCall = new Date();

    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    const afterCall = new Date();

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');

    // ISO 8601形式の確認
    const dateObj = new Date(result.authorizedAt);
    expect(dateObj.toString()).not.toBe('Invalid Date');

    // 秒単位以上の精度の確認（呼び出し時点の日時であることを確認）
    expect(dateObj.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(dateObj.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
  });
});
