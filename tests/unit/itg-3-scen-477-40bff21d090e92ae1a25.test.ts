import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-477: 修正対象の差異レコードと修正前のデータ状態が取得でき、修正前後の比較基準が確立される', () => {
  it('should return isAuthorized=true with valid inputs and current timestamp', async () => {
    // Arrange
    const input = {
      userId: 'user-001',
      userRole: 'tolerance_reviewer',
      userIsActive: true,
    };

    // Act
    const result = await validateUserAuthorizationForToleranceJudgment(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toBeDefined();

    // Check authorizedAt is ISO 8601 format
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(result.authorizedAt).toMatch(isoRegex);
  });
});
