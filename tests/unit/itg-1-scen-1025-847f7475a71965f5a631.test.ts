import { enforceSecurityPolicyForMobileAccess } from '../../src/logic/mobile-security-enforcement';
import { EnforceSecurityPolicyForMobileAccessInput, DisplayDataField } from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1025: モバイルからのアクセスで機密度が『機密』のデータを表示するとマスクされる', () => {
  it('金額フィールドが『***円』でマスクされる', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'sess-mobile-001',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
      ipAddress: '203.0.113.45',
    };

    const displayDataFields: DisplayDataField[] = [
      {
        fieldName: '顧客名',
        fieldValue: '株式会社ABC',
        sensitivityLevel: 'internal',
      },
      {
        fieldName: '契約金額',
        fieldValue: '1500000',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: '請求金額',
        fieldValue: '750000',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: '契約開始日',
        fieldValue: '2024-01-15',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: '請求状況',
        fieldValue: '未請求',
        sensitivityLevel: 'internal',
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext,
      displayDataFields,
      userId: 'user-sales-001',
      currentDateTime: new Date('2024-10-15T10:30:00Z'),
    };

    const result = await enforceSecurityPolicyForMobileAccess(input);

    expect(result.isMobileAccess).toBe(true);
    expect(result.restrictedFields).toHaveLength(3);

    const contractAmount = result.restrictedFields.find((f) => f.fieldName === '契約金額');
    expect(contractAmount).toBeDefined();
    expect(contractAmount?.displayValue).toBe('***円');

    const billingAmount = result.restrictedFields.find((f) => f.fieldName === '請求金額');
    expect(billingAmount).toBeDefined();
    expect(billingAmount?.displayValue).toBe('***円');

    const contractDate = result.restrictedFields.find((f) => f.fieldName === '契約開始日');
    expect(contractDate).toBeDefined();
    expect(contractDate?.displayValue).toBe('****-**-**');

    expect(result.allowedFields).toHaveLength(2);
    expect(result.allowedFields.map((f) => f.fieldName)).toEqual(['顧客名', '請求状況']);

    expect(result.securityControlsApplied.screenshotPreventionEnabled).toBe(true);
    expect(result.securityControlsApplied.sessionTimeoutMinutes).toBe(10);
  });
});
