import { enforceSecurityPolicyForMobileAccess } from '../../src/logic/mobile-security-enforcement';
import { EnforceSecurityPolicyForMobileAccessInput, DisplayDataField } from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1024: セッションタイムアウト時間が 0 以下になるとき最小値の 300 秒に固定される', () => {
  it('セッションタイムアウトが 300 秒に固定される', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'session-12345',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
      ipAddress: '192.168.1.100',
    };

    const displayDataFields: DisplayDataField[] = [
      {
        fieldName: '顧客名',
        fieldValue: 'ABC株式会社',
        sensitivityLevel: 'internal',
      },
      {
        fieldName: '金額',
        fieldValue: '1500000',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: '契約条件',
        fieldValue: '支払い期限30日',
        sensitivityLevel: 'confidential',
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext,
      displayDataFields,
      userId: 'user-001',
      currentDateTime: new Date('2025-01-15T10:30:00Z'),
    };

    const result = await enforceSecurityPolicyForMobileAccess(input);

    expect(result.isMobileAccess).toBe(true);
    expect(result.restrictedFields.length).toBeGreaterThan(0);
    expect(result.allowedFields.length).toBeGreaterThan(0);
    expect(result.securityControlsApplied.sessionTimeoutMinutes).toBeGreaterThanOrEqual(300 / 60);
    expect(result.securityControlsApplied.screenshotPreventionEnabled).toBe(true);
    expect(result.displayPolicy.policyType).toBe('restricted_access');
  });
});
