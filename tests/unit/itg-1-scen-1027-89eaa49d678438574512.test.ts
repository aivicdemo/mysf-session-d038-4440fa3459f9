import { enforceSecurityPolicyForMobileAccess } from '../../src/logic/mobile-security-enforcement';
import { EnforceSecurityPolicyForMobileAccessInput, DisplayDataField } from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1027: 業務ルール br-tx_7-007 の計算式が代表的な入力値で設計通りの結果を返す', () => {
  it('モバイルデバイスからのアクセスで機密フィールドを含む場合、正しく制限される', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'sess-mobile-001',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
      ipAddress: '203.0.113.42',
    };

    const displayDataFields: DisplayDataField[] = [
      {
        fieldName: 'field_1',
        fieldValue: 'ABC商事株式会社',
        sensitivityLevel: 'internal',
      },
      {
        fieldName: 'field_2',
        fieldValue: '5000000',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'field_3',
        fieldValue: '支払期限30日',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'field_4',
        fieldValue: '営業担当者: 山田太郎',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'field_5',
        fieldValue: '2024-01-15',
        sensitivityLevel: 'internal',
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext,
      displayDataFields,
      userId: 'user-sales-001',
      currentDateTime: new Date('2024-12-19T14:30:00Z'),
    };

    const result = await enforceSecurityPolicyForMobileAccess(input);

    expect(result.isMobileAccess).toBe(true);

    expect(result.restrictedFields).toHaveLength(3);
    const restrictedNames = result.restrictedFields.map((f) => f.fieldName);
    expect(restrictedNames).toEqual(['field_2', 'field_3', 'field_4']);

    result.restrictedFields.forEach((field) => {
      expect(field.displayValue).not.toBeNull();
      if (field.fieldName === 'field_2') {
        expect(field.displayValue).toBe('***円');
      }
    });

    expect(result.allowedFields).toHaveLength(2);
    expect(result.allowedFields.map((f) => f.fieldName)).toEqual(['field_1', 'field_5']);

    expect(result.securityControlsApplied.screenshotPreventionEnabled).toBe(true);
    expect(result.securityControlsApplied.sessionTimeoutMinutes * 60).toBe(600);

    expect(result.displayPolicy.policyType).toBe('restricted_access');
    expect(result.displayPolicy.description).toContain('機密情報を含むため、詳細表示は制限されます。概要のみ表示可能です。');
  });
});
