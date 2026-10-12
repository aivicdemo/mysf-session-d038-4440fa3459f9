import { classifyAndRespondToIssue, UnclassifiableIssueRootCause } from '../../src/logic/issue-response-management';

describe('SCEN-260: 報告の種別が空文字列または規定外の値のとき、業務ルールの制約エラーが throw される', () => {
  it('should throw UnclassifiableIssueRootCause when issueType is empty string', async () => {
    const input = {
      issueReportId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      invoiceId: null,
      issueType: '',
      reportedAmount: null,
      reportedReason: '請求書が未発行のままである',
      reportedDateTime: '2026-10-01T10:00:00Z',
      currentDateTime: '2026-10-07T14:30:00Z',
      requestingUserId: 'user-accounting-001',
    };

    await expect(classifyAndRespondToIssue(input)).rejects.toThrow(UnclassifiableIssueRootCause);
    await expect(classifyAndRespondToIssue(input)).rejects.toThrow(
      '報告内容から原因を特定できません。営業担当者に詳細情報の追加報告を依頼してください。'
    );
  });
});
