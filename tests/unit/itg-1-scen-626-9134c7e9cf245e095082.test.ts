import { prepareDistributionPlan, InvalidVersionManagementRuleError } from '../../src/logic/distribution-preparation';

describe('SCEN-626: prepareDistributionPlan - バージョン管理ルールが必須要素を満たさないときエラーが発生', () => {
  it('should throw InvalidVersionManagementRuleError when trackUpdateDateTime is false', async () => {
    const input: any = {
      approvalStatus: 'approved',
      mediaFormats: ['PDF', 'Web', 'MobileApp'],
      accessControlRules: [
        { role: 'SalesRepresentative' as const, mediaFormats: ['PDF', 'Web'], fieldMaskingLevel: 'partial' as const },
      ],
      versionManagementRules: {
        trackUpdateDateTime: false,
        trackChangeHistory: true,
        enableDiffDisplay: true,
        retentionDays: 30,
      },
      documentMetadata: {
        documentName: '操作ガイド_v1.0',
        documentVersion: '1.0',
        approvalDate: '2026-01-15T10:00:00Z',
        approverName: '営業部長太郎',
      },
    };

    await expect(prepareDistributionPlan(input)).rejects.toThrow(InvalidVersionManagementRuleError);
    await expect(prepareDistributionPlan(input)).rejects.toThrow('バージョン管理ルールに必須要素（更新日時、変更履歴、差分表示）が不足しています。');
  });
});
