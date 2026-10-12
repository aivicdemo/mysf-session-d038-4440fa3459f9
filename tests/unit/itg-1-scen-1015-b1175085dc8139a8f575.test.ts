import { enforceSecurityPolicyForMobileAccess } from '../../src/logic/mobile-security-enforcement';
import type {
  EnforceSecurityPolicyForMobileAccessInput,
  EnforceSecurityPolicyForMobileAccessOutput,
} from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1015: モバイルからのアクセスが検出されると isMobileAccess が true になり、セキュリティ対策が適用される', () => {
  it('モバイルアクセスが検出され、機密フィールドが制限される', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'sess-mobile-001',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      ipAddress: '192.168.1.100',
    };

    const displayDataFields = [
      {
        fieldName: 'field1',
        fieldValue: '株式会社ABC商事',
        sensitivityLevel: 'internal' as const,
      },
      {
        fieldName: 'field2',
        fieldValue: '1500000',
        sensitivityLevel: 'confidential' as const,
      },
      {
        fieldName: 'field3',
        fieldValue: '月次支払い、30日支払い条件',
        sensitivityLevel: 'confidential' as const,
      },
      {
        fieldName: 'field4',
        fieldValue: '担当者: 山田太郎、電話: 090-1234-5678',
        sensitivityLevel: 'confidential' as const,
      },
      {
        fieldName: 'field5',
        fieldValue: '契約済み',
        sensitivityLevel: 'internal' as const,
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext,
      displayDataFields,
      userId: 'user-sales-001',
      currentDateTime: new Date('2025-01-15T10:30:00Z'),
    };

    const result: EnforceSecurityPolicyForMobileAccessOutput = await enforceSecurityPolicyForMobileAccess(input);

    // isMobileAccess が true に設定される
    expect(result.isMobileAccess).toBe(true);

    // restrictedFields に field2、field3、field4 が含まれる
    const restrictedFieldNames = result.restrictedFields.map((f) => f.fieldName);
    expect(restrictedFieldNames).toContain('field2');
    expect(restrictedFieldNames).toContain('field3');
    expect(restrictedFieldNames).toContain('field4');
    expect(restrictedFieldNames.length).toBe(3);

    // 各フィールドに対して元の値、マスク後の表示値、制限理由が記録される
    result.restrictedFields.forEach((field) => {
      expect(field.originalValue).toBeDefined();
      expect(field.displayValue).toBeDefined();
      expect(field.restrictionReason).toBeDefined();
    });

    // allowedFields に field1 と field5 が含まれる
    const allowedFieldNames = result.allowedFields.map((f) => f.fieldName);
    expect(allowedFieldNames).toContain('field1');
    expect(allowedFieldNames).toContain('field5');
    expect(allowedFieldNames.length).toBe(2);

    // securityControlsApplied に screenshotPreventionEnabled: true が設定される
    expect(result.securityControlsApplied.screenshotPreventionEnabled).toBe(true);

    // セッションタイムアウト時間が短縮されている
    expect(result.securityControlsApplied.sessionTimeoutMinutes).toBeLessThan(20);

    // displayPolicy に適用されたポリシー種別と説明が設定される
    expect(result.displayPolicy.policyType).toBeDefined();
    expect(result.displayPolicy.description).toBeDefined();
  });
});
