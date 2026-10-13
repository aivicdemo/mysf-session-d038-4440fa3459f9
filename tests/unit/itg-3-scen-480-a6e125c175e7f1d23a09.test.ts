import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-480: 修正理由が空または10文字未満の場合、修正内容の再検証を実行できない', () => {
  it('should return authorized output with data-reviewer role', async () => {
    // Arrange
    const input = {
      userId: 'user-001',
      userRole: 'data-reviewer',
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
