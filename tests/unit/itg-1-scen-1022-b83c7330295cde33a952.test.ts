import { enforceSecurityPolicyForMobileAccess } from '../../src/logic/mobile-security-enforcement';
import { EnforceSecurityPolicyForMobileAccessInput, DisplayDataField } from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1022: モバイルからのアクセスで公開度のデータを表示するとセキュリティ対策が調整される', () => {
  it('スクリーンショット防止が無効になり、セッションタイムアウトが 1800 秒に設定される', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'sess-mobile-001',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      ipAddress: '192.168.1.100',
    };

    const displayDataFields: DisplayDataField[] = [
      {
        fieldName: 'customerName',
        fieldValue: '株式会社ABC',
        sensitivityLevel: 'public',
      },
      {
        fieldName: 'contractAmount',
        fieldValue: '1500000',
        sensitivityLevel: 'public',
      },
      {
        fieldName: 'contractDate',
        fieldValue: '2024-01-15',
        sensitivityLevel: 'public',
      },
      {
        fieldName: 'paymentTerms',
        fieldValue: '翌月末払い',
        sensitivityLevel: 'public',
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext,
      displayDataFields,
      userId: 'user-sales-001',
      currentDateTime: new Date('2024-06-15T10:30:00Z'),
    };

    const result = await enforceSecurityPolicyForMobileAccess(input);

    expect(result.isMobileAccess).toBe(true);
    expect(result.restrictedFields).toEqual([]);
    expect(result.allowedFields).toHaveLength(4);
    expect(result.securityControlsApplied.screenshotPreventionEnabled).toBe(false);
    expect(result.securityControlsApplied.sessionTimeoutMinutes).toBe(30);
    expect(result.displayPolicy.policyType).toEqual(expect.stringMatching(/public|full_access|restricted_access/));
  });
});
