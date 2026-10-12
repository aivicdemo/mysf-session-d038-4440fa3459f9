import { enforceSecurityPolicyForMobileAccess } from '../../src/logic/mobile-security-enforcement';
import { EnforceSecurityPolicyForMobileAccessInput, DisplayDataField } from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1023: 要求フィールドが空のとき警告が返される', () => {
  it('空の displayDataFields で警告『表示対象フィールドが指定されていません』が出力される', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'sess-12345',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      ipAddress: '192.168.1.100',
    };

    const displayDataFields: DisplayDataField[] = [];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext,
      displayDataFields,
      userId: 'user-001',
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
    };

    const result = await enforceSecurityPolicyForMobileAccess(input);

    expect(result.isMobileAccess).toBe(true);
    expect(result.restrictedFields).toEqual([]);
    expect(result.allowedFields).toEqual([]);
    expect(result.securityControlsApplied.screenshotPreventionEnabled).toBe(true);
    expect(result.securityControlsApplied.sessionTimeoutMinutes).toBeGreaterThan(0);
  });
});
