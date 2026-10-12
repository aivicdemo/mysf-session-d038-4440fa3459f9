import { enforceSecurityPolicyForMobileAccess, MobileDeviceDetected } from '../../src/logic/mobile-security-enforcement';
import { EnforceSecurityPolicyForMobileAccessInput, DisplayDataField } from '../../src/logic/mobile-security-enforcement';

describe('SCEN-1019: 営業担当者がモバイルからアクセスし、機密フィールドを表示しようとすると拒否される', () => {
  it('エラーメッセージが『このデータはモバイルからは表示できません。PC からアクセスしてください』で返される', async () => {
    const deviceContext = {
      deviceType: 'mobile' as const,
      sessionId: 'sess_20250107_001',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X)',
      ipAddress: '203.0.113.45',
    };

    const displayDataFields: DisplayDataField[] = [
      {
        fieldName: 'customerName',
        fieldValue: '株式会社ABC',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'contractAmount',
        fieldValue: '¥5,000,000',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'contractTerms',
        fieldValue: '支払条件：翌月末払い、期間：2025年1月～12月',
        sensitivityLevel: 'confidential',
      },
      {
        fieldName: 'personalInfo',
        fieldValue: '田中太郎（営業担当者）',
        sensitivityLevel: 'confidential',
      },
    ];

    const input: EnforceSecurityPolicyForMobileAccessInput = {
      deviceContext,
      displayDataFields,
      userId: 'user_sales_001',
      currentDateTime: new Date('2025-01-07T10:30:00Z'),
    };

    await expect(enforceSecurityPolicyForMobileAccess(input)).rejects.toThrow(MobileDeviceDetected);

    try {
      await enforceSecurityPolicyForMobileAccess(input);
    } catch (error) {
      if (error instanceof MobileDeviceDetected) {
        expect(error.message).toBe('このデータはモバイルからは表示できません。PC からアクセスしてください');
      }
    }
  });
});
