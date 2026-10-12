import {
  enforceSecurityPolicyForMobileAccess,
  type EnforceSecurityPolicyForMobileAccessInput,
  type EnforceSecurityPolicyForMobileAccessOutput,
  type DisplayDataField,
} from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1014: モバイルからのアクセスで機密フィールド（金額・個人情報・契約条件）をマスク', () => {
  it('should restrict and mask confidential fields for mobile access', async () => {
    // Arrange
    const displayDataFields: DisplayDataField[] = [
      {
        fieldName: 'field_public_001',
        fieldValue: '株式会社A社',
        sensitivityLevel: 'public',
      },
      {
        fieldName: 'field_confidential_amount',
        fieldValue: '1500000',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'field_confidential_email',
        fieldValue: 'contact@example.com',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'field_confidential_terms',
        fieldValue: '12ヶ月契約、自動更新条項あり',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'field_internal_date',
        fieldValue: '2024-01-15',
        sensitivityLevel: 'internal',
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext: {
        deviceType: 'mobile',
        sessionId: 'sess-mobile-12345',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        ipAddress: '203.0.113.45',
      },
      displayDataFields,
      userId: 'user-sales-001',
      currentDateTime: new Date('2024-12-15T10:30:00Z'),
    };

    // Act
    const output: EnforceSecurityPolicyForMobileAccessOutput =
      await enforceSecurityPolicyForMobileAccess(input);

    // Assert
    // isMobileAccess should be true
    expect(output.isMobileAccess).toBe(true);

    // restrictedFields should contain 3 confidential fields
    expect(output.restrictedFields).toHaveLength(3);

    // Verify field_confidential_amount
    const restrictedAmount = output.restrictedFields.find(
      (f) => f.fieldName === 'field_confidential_amount'
    );
    expect(restrictedAmount).toBeDefined();
    expect(restrictedAmount?.originalValue).toBe('1500000');
    expect(restrictedAmount?.displayValue).toBe('***円');
    expect(restrictedAmount?.restrictionReason).toBe('confidential');

    // Verify field_confidential_email
    const restrictedEmail = output.restrictedFields.find(
      (f) => f.fieldName === 'field_confidential_email'
    );
    expect(restrictedEmail).toBeDefined();
    expect(restrictedEmail?.originalValue).toBe('contact@example.com');
    expect(restrictedEmail?.displayValue).toBe('***@***.com');
    expect(restrictedEmail?.restrictionReason).toBe('confidential');

    // Verify field_confidential_terms
    const restrictedTerms = output.restrictedFields.find(
      (f) => f.fieldName === 'field_confidential_terms'
    );
    expect(restrictedTerms).toBeDefined();
    expect(restrictedTerms?.originalValue).toBe('12ヶ月契約、自動更新条項あり');
    expect(restrictedTerms?.displayValue).toBe('詳細は表示できません');
    expect(restrictedTerms?.restrictionReason).toBe('confidential');

    // allowedFields should contain 2 non-confidential fields
    expect(output.allowedFields).toHaveLength(2);

    // Verify field_public_001
    const allowedPublic = output.allowedFields.find(
      (f) => f.fieldName === 'field_public_001'
    );
    expect(allowedPublic).toBeDefined();
    expect(allowedPublic?.fieldValue).toBe('株式会社A社');

    // Verify field_internal_date
    const allowedInternal = output.allowedFields.find(
      (f) => f.fieldName === 'field_internal_date'
    );
    expect(allowedInternal).toBeDefined();
    expect(allowedInternal?.fieldValue).toBe('2024-01-15');

    // securityControlsApplied validation
    expect(output.securityControlsApplied.screenshotPreventionEnabled).toBe(
      true
    );
    expect(output.securityControlsApplied.sessionTimeoutMinutes).toBe(10);
    expect(output.securityControlsApplied.sessionTimeoutAppliedAt).toEqual(
      new Date('2024-12-15T10:30:00Z')
    );

    // displayPolicy validation
    expect(output.displayPolicy.policyType).toBe('restricted_access');
    expect(output.displayPolicy.description).toBe(
      '機密情報を含むため、詳細表示は制限されます。概要のみ表示可能です。'
    );
  });
});
