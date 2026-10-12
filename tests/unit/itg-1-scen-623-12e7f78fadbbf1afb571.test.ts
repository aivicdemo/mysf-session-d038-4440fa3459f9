import { prepareDistributionPlan, ApprovalNotCompletedError } from '../../src/logic/distribution-preparation';

describe('SCEN-623: prepareDistributionPlan - 承認状態が未完了のときエラーが発生', () => {
  it('should throw ApprovalNotCompletedError when approvalStatus is pending', async () => {
    const input: any = {
      approvalStatus: 'pending',
      mediaFormats: ['PDF', 'Web'],
      accessControlRules: [
        { role: 'SalesRepresentative' as const, mediaFormats: ['PDF', 'Web'], fieldMaskingLevel: 'partial' as const },
      ],
      versionManagementRules: {
        trackUpdateDateTime: true,
        trackChangeHistory: true,
        enableDiffDisplay: true,
        retentionDays: 90,
      },
      documentMetadata: {
        documentName: '営業ガイド',
        documentVersion: '1.0',
        approvalDate: '2026-01-15T10:00:00Z',
        approverName: '営業部長太郎',
      },
    };

    await expect(prepareDistributionPlan(input)).rejects.toThrow(ApprovalNotCompletedError);
    await expect(prepareDistributionPlan(input)).rejects.toThrow('配布準備を開始するには、操作ガイド・業務フロー図が営業部長に承認されている必要があります。');
  });
});
