import { enforceSecurityPolicyForMobileAccess } from '../../src/logic/mobile-security-enforcement';
import { EnforceSecurityPolicyForMobileAccessInput, DisplayDataField } from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1026: モバイルからのアクセスで機密度が『極秘』のデータを表示するとアクセスが拒否される', () => {
  it('詳細表示へのアクセスが拒否される', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'sess_mobile_001',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      ipAddress: '203.0.113.45',
    };

    const displayDataFields: DisplayDataField[] = [
      {
        fieldName: '顧客名',
        fieldValue: '株式会社サンプル商事',
        sensitivityLevel: 'internal',
      },
      {
        fieldName: '契約金額',
        fieldValue: '5000000',
        sensitivityLevel: 'restricted',
      },
      {
        fieldName: '契約条件',
        fieldValue: '支払い期限30日、割引率5%',
        sensitivityLevel: 'restricted',
      },
      {
        fieldName: '担当者メールアドレス',
        fieldValue: 'tanaka@sample.com',
        sensitivityLevel: 'restricted',
      },
      {
        fieldName: '契約開始日',
        fieldValue: '2024-01-15',
        sensitivityLevel: 'internal',
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext,
      displayDataFields,
      userId: 'user_sales_001',
      currentDateTime: new Date('2024-10-15T14:30:00Z'),
    };

    const result = await enforceSecurityPolicyForMobileAccess(input);

    expect(result.isMobileAccess).toBe(true);
    expect(result.restrictedFields).toHaveLength(4);
    expect(result.allowedFields).toHaveLength(2);
    expect(result.allowedFields.map((f) => f.fieldName)).toEqual(['顧客名', '契約開始日']);

    expect(result.securityControlsApplied.screenshotPreventionEnabled).toBe(true);
    expect(result.securityControlsApplied.sessionTimeoutMinutes).toBeGreaterThan(0);

    expect(result.displayPolicy.policyType).toBe('summary_only');
    expect(result.displayPolicy.description).toContain('機密情報を含むため、詳細表示は制限されます。概要のみ表示可能です。');
  });
});
