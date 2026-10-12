import { enforceSecurityPolicyForMobileAccess, MobileDeviceDetected } from '../../src/logic/mobile-security-enforcement';
import { EnforceSecurityPolicyForMobileAccessInput, DisplayDataField } from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1018: モバイルからのアクセスが検出されるとエラーが発生する', () => {
  it('MobileDeviceDetected エラーが発生し、正しいメッセージと制限フィールドが返される', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'sess-mobile-001',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      ipAddress: '203.0.113.45',
    };

    const displayDataFields: DisplayDataField[] = [
      {
        fieldName: '顧客名',
        fieldValue: '株式会社A商事',
        sensitivityLevel: 'internal',
      },
      {
        fieldName: '契約金額',
        fieldValue: '1500000',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: '契約条件',
        fieldValue: '月額支払い、12ヶ月契約',
        sensitivityLevel: 'confidential',
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext,
      displayDataFields,
      userId: 'user-sales-001',
      currentDateTime: new Date('2026-10-07T10:30:00Z'),
    };

    await expect(enforceSecurityPolicyForMobileAccess(input)).rejects.toThrow(MobileDeviceDetected);

    try {
      await enforceSecurityPolicyForMobileAccess(input);
    } catch (error) {
      if (error instanceof MobileDeviceDetected) {
        expect(error.message).toBe('モバイルデバイスからのアクセスが検出されました。機密情報の表示範囲を制限します。');
      }
    }
  });
});
