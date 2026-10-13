import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-445: 許容範囲判定結果が差異検出結果テーブルに記録され、営業担当者への修正依頼対象が確定する', () => {
  it('営業部システム担当ロールで有効なユーザーが差異確認操作の権限を持つ', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '営業部システム担当',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.authorizedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });
});
