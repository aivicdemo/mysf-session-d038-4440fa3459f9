import { enforceSecurityPolicyForMobileAccess } from '../../src/logic/mobile-security-enforcement';
import { EnforceSecurityPolicyForMobileAccessInput, DisplayDataField } from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1021: 営業部長がモバイルからアクセスし、内部機密度のデータを表示するとアクセスが許可される', () => {
  it('詳細表示へのアクセスが許可される', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'sess-sales-manager-001',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
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
        sensitivityLevel: 'internal',
      },
      {
        fieldName: '契約条件',
        fieldValue: '月額サポート付き',
        sensitivityLevel: 'internal',
      },
      {
        fieldName: '契約開始日',
        fieldValue: '2024-01-01',
        sensitivityLevel: 'internal',
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext,
      displayDataFields,
      userId: 'user-sales-manager-001',
      currentDateTime: new Date('2024-11-15T10:30:00Z'),
    };

    const result = await enforceSecurityPolicyForMobileAccess(input);

    expect(result.isMobileAccess).toBe(true);
    expect(result.restrictedFields).toEqual([]);
    expect(result.allowedFields).toHaveLength(4);
    expect(result.allowedFields[0]).toEqual({
      fieldName: '顧客名',
      fieldValue: 'ABC株式会社',
    });
    expect(result.allowedFields[1]).toEqual({
      fieldName: '金額',
      fieldValue: '1500000',
    });
    expect(result.allowedFields[2]).toEqual({
      fieldName: '契約条件',
      fieldValue: '月額サポート付き',
    });
    expect(result.allowedFields[3]).toEqual({
      fieldName: '契約開始日',
      fieldValue: '2024-01-01',
    });
    expect(result.securityControlsApplied.screenshotPreventionEnabled).toBe(false);
    expect(result.securityControlsApplied.sessionTimeoutMinutes).toBe(20);
    expect(result.displayPolicy.policyType).toBe('restricted_access');
    expect(result.displayPolicy.description).toContain('内部機密情報はモバイルからアクセス可能');
    expect(result.displayPolicy.description).toContain('セッションセキュリティ');
  });
});
