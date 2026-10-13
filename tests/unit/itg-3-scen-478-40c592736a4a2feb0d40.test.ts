import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-478: 修正後の旧新システム請求書データが再取得され、修正内容が両システムに反映されていることを確認できる', () => {
  it('should return authorized output with reconciliation_approver role', async () => {
    // Arrange
    const input = {
      userId: 'user-001',
      userRole: 'reconciliation_approver',
      userIsActive: true,
    };

    // Act
    const result = await validateUserAuthorizationForToleranceJudgment(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toBeDefined();

    // Verify authorizedAt is ISO 8601 format
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(result.authorizedAt).toMatch(isoRegex);
  });
});
