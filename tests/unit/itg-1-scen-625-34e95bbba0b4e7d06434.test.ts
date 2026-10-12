import { prepareDistributionPlan, InvalidAccessControlRuleError } from '../../src/logic/distribution-preparation';

describe('SCEN-625: prepareDistributionPlan - 無効なロールでエラーが発生', () => {
  it('should throw InvalidAccessControlRuleError when accessControlRules contains invalid role', async () => {
    const input: any = {
      approvalStatus: 'approved',
      mediaFormats: ['PDF', 'Web', 'MobileApp'],
      accessControlRules: [
        { role: 'SalesRepresentative' as const, mediaFormats: ['PDF'], fieldMaskingLevel: 'full' as const },
        { role: 'UnknownRole' as any, mediaFormats: ['Web'], fieldMaskingLevel: 'partial' as const },
      ],
      versionManagementRules: {
        trackUpdateDateTime: true,
        trackChangeHistory: true,
        enableDiffDisplay: true,
        retentionDays: 30,
      },
      documentMetadata: {
        documentName: '操作ガイド',
        documentVersion: '1.0',
        approvalDate: '2024-01-15',
        approverName: '営業部長 太郎',
      },
    };

    await expect(prepareDistributionPlan(input)).rejects.toThrow(InvalidAccessControlRuleError);
    await expect(prepareDistributionPlan(input)).rejects.toThrow('アクセス権限ルールに無効なロールが含まれています。営業担当者、営業部長、経理部門のいずれかを指定してください。');
  });
});
