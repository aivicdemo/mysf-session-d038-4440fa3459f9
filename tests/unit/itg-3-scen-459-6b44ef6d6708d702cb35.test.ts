import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-459: AIエージェントが修正内容を自動で再検証し、整合性確認結果を集計する', () => {
  it('経理部ユーザーが差異確認権限を持つことを確認する', async () => {
    // Arrange
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    // Act
    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    // Assert - 経理部が権限対象ロールであり、ユーザーが有効な場合
    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
