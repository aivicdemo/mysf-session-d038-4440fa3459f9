import { enforceSecurityPolicyForMobileAccess, SensitiveFieldsRequireRestriction } from '../../src/logic/mobile-security-enforcement';
import { EnforceSecurityPolicyForMobileAccessInput, DisplayDataField } from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1017: モバイルからのアクセスで機密度が『機密』以上のデータを表示しようとするとエラーが発生する', () => {
  it('SensitiveFieldsRequireRestriction エラーが throw される', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'session-mobile-001',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
      ipAddress: '203.0.113.45',
    };

    const displayDataFields: DisplayDataField[] = [
      {
        fieldName: '顧客名',
        fieldValue: '株式会社ABC商事',
        sensitivityLevel: 'internal',
      },
      {
        fieldName: '契約金額',
        fieldValue: '1500000',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: '契約条件',
        fieldValue: '月額支払い、割引率15%',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: '担当者電話番号',
        fieldValue: '090-1234-5678',
        sensitivityLevel: 'confidential',
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext,
      displayDataFields,
      userId: 'user-sales-001',
      currentDateTime: new Date('2026-10-15T10:30:00Z'),
    };

    await expect(enforceSecurityPolicyForMobileAccess(input)).rejects.toThrow(SensitiveFieldsRequireRestriction);

    try {
      await enforceSecurityPolicyForMobileAccess(input);
    } catch (error) {
      if (error instanceof SensitiveFieldsRequireRestriction) {
        expect(error.message).toBe('機密情報を含むため、詳細表示は制限されます。概要のみ表示可能です。');
      }
    }
  });
});
