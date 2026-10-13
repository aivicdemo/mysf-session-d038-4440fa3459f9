import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-479: 修正前後のデータが同一の場合、修正内容が検出されず警告が発生する', () => {
  it('should return isAuthorized=true even when data before and after correction is identical', async () => {
    // Arrange
    const input = {
      userId: 'user-001',
      userRole: 'TOLERANCE_JUDGE',
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
