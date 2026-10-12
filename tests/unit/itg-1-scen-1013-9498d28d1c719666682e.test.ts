import {
  enforceSecurityPolicyForMobileAccess,
  type EnforceSecurityPolicyForMobileAccessInput,
  type EnforceSecurityPolicyForMobileAccessOutput,
  type DisplayDataField,
} from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1013: デスクトップからのアクセスで機密情報を含むフィールドを表示', () => {
  it('should allow all fields without restriction for desktop access', async () => {
    // Arrange
    const displayDataFields: DisplayDataField[] = [
      {
        fieldName: 'field_1',
        fieldValue: 'ABC Corp',
        sensitivityLevel: 'public',
      },
      {
        fieldName: 'field_2',
        fieldValue: '5000000',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'field_3',
        fieldValue: 'Payment terms: end of month settlement',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'field_4',
        fieldValue: 'Contact: Taro Tanaka',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'field_5',
        fieldValue: 'Deal Status: Closed',
        sensitivityLevel: 'internal',
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext: {
        deviceType: 'desktop',
        sessionId: 'sess_desktop_20240115_001',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.100',
      },
      displayDataFields,
      userId: 'user_sales_001',
      currentDateTime: new Date('2024-01-15T10:30:00Z'),
    };

    // Act
    const output: EnforceSecurityPolicyForMobileAccessOutput =
      await enforceSecurityPolicyForMobileAccess(input);

    // Assert
    // isMobileAccess should be false
    expect(output.isMobileAccess).toBe(false);

    // restrictedFields should be empty
    expect(output.restrictedFields).toEqual([]);

    // allowedFields should contain all fields
    expect(output.allowedFields).toHaveLength(5);
    expect(output.allowedFields[0]).toEqual({
      fieldName: 'field_1',
      fieldValue: 'ABC Corp',
    });
    expect(output.allowedFields[1]).toEqual({
      fieldName: 'field_2',
      fieldValue: '5000000',
    });
    expect(output.allowedFields[2]).toEqual({
      fieldName: 'field_3',
      fieldValue: 'Payment terms: end of month settlement',
    });
    expect(output.allowedFields[3]).toEqual({
      fieldName: 'field_4',
      fieldValue: 'Contact: Taro Tanaka',
    });
    expect(output.allowedFields[4]).toEqual({
      fieldName: 'field_5',
      fieldValue: 'Deal Status: Closed',
    });

    // securityControlsApplied validation
    expect(output.securityControlsApplied.screenshotPreventionEnabled).toBe(
      false
    );
    expect(output.securityControlsApplied.sessionTimeoutMinutes).toBe(60);
    expect(output.securityControlsApplied.sessionTimeoutAppliedAt).toEqual(
      new Date('2024-01-15T10:30:00Z')
    );

    // displayPolicy validation
    expect(output.displayPolicy.policyType).toBe('full_access');
    expect(output.displayPolicy.description).toBe(
      'デスクトップアクセスのため、すべての表示対象フィールドは制限なく表示可能です'
    );
  });
});
