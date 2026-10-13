import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-458: AIエージェントが修正対象の営業担当者に自動通知し、修正期限を設定する', () => {
  it('営業部システム担当ユーザーが差異確認権限を持つことを確認する', async () => {
    // Arrange
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '営業部システム担当',
      userIsActive: true,
    };

    // Act
    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    // Assert
    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
