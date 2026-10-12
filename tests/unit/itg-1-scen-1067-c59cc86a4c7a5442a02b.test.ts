import { notifyIssueResponse, InvalidResponseDeadline } from '../../src/logic/notification-service';

describe('SCEN-1067: notifyIssueResponse - invalid response deadline', () => {
  it('should throw InvalidResponseDeadline when responseDeadline is before currentDateTime', async () => {
    const input = {
      issueContext: {
        dealId: 'DEAL-001',
        invoiceId: 'INV-2024-001',
        amount: 500000,
        delayDays: 5,
        reason: '請求書未発行',
        additionalNotes: '営業担当者確認済み'
      },
      reportingRepresentativeId: 'REP-001',
      responseDecision: {
        actionType: 'reissue' as const,
        actionDescription: '請求書を再発行し営業担当者に確認',
        responseDeadline: new Date('2024-01-01T10:00:00Z'),
        respondingUserId: 'ACCT-002',
        respondingUserName: '山田太郎',
        respondingUserRole: '経理課長'
      },
      currentDateTime: new Date('2024-01-02T15:00:00Z'),
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'in_app'>,
      urgencyLevel: 'high' as const
    };

    await expect(notifyIssueResponse(input)).rejects.toThrow(InvalidResponseDeadline);
    await expect(notifyIssueResponse(input)).rejects.toThrow('対応期限が現在日時より前です。対応期限を確認してください。');
  });
});
