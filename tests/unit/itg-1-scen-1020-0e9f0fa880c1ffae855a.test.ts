import { enforceSecurityPolicyForMobileAccess } from '../../src/logic/mobile-security-enforcement';
import { EnforceSecurityPolicyForMobileAccessInput, DisplayDataField } from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1020: 営業部長がモバイルからアクセスし、内部機密度のデータを表示するとセッションタイムアウトが設定される', () => {
  it('セッションタイムアウトが 1200 秒に設定されて返される', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'session-sales-manager-001',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      ipAddress: '203.0.113.45',
    };

    const displayDataFields: DisplayDataField[] = [
      {
        fieldName: '顧客名',
        fieldValue: 'ABC株式会社',
        sensitivityLevel: 'internal',
      },
      {
        fieldName: '契約金額',
        fieldValue: '1500000',
        sensitivityLevel: 'internal',
      },
      {
        fieldName: '契約日',
        fieldValue: '2024-01-15',
        sensitivityLevel: 'internal',
      },
      {
        fieldName: '担当者電話番号',
        fieldValue: '090-1234-5678',
        sensitivityLevel: 'internal',
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
      userId: 'user-sales-manager-12345',
      currentDateTime: new Date('2024-03-15T10:30:00Z'),
    };

    const result = await enforceSecurityPolicyForMobileAccess(input);

    expect(result.isMobileAccess).toBe(true);
    expect(result.restrictedFields).toEqual([]);
    expect(result.allowedFields).toHaveLength(5);
    expect(result.allowedFields.map((f) => f.fieldName)).toEqual([
      '顧客名',
      '契約金額',
      '契約日',
      '担当者電話番号',
      '請求状況',
    ]);
    expect(result.securityControlsApplied.sessionTimeoutMinutes).toBe(20);
    expect(result.securityControlsApplied.screenshotPreventionEnabled).toBe(false);
    expect(result.displayPolicy.policyType).toBe('restricted_access');
    expect(result.displayPolicy.description).toContain('内部機密情報をモバイルから閲覧可能');
    expect(result.displayPolicy.description).toContain('セッションタイムアウト');
  });
});
