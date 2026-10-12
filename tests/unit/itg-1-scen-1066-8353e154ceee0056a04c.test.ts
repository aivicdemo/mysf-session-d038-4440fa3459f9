import { notifyIssueResponse, InvalidResponseDecisionContent } from '../../src/logic/notification-service';

describe('SCEN-1066: notifyIssueResponse - invalid response decision content', () => {
  it('should throw InvalidResponseDecisionContent when actionType is invalid', async () => {
    const input = {
      issueContext: {
        dealId: 'DEAL-001',
        invoiceId: 'INV-2024-001',
        amount: 150000,
        delayDays: 5,
        reason: '請求書未送付',
        additionalNotes: '営業担当者確認待ち'
      },
      reportingRepresentativeId: 'USER-REP-001',
      responseDecision: {
        actionType: 'invalid_action' as any,
        actionDescription: '',
        responseDeadline: new Date('2024-12-20T10:00:00Z'),
        respondingUserId: 'USER-ACCT-001',
        respondingUserName: '経理太郎',
        respondingUserRole: '経理担当者'
      },
      currentDateTime: new Date('2024-12-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'in_app'>,
      urgencyLevel: 'high' as const
    };

    await expect(notifyIssueResponse(input)).rejects.toThrow(InvalidResponseDecisionContent);
    await expect(notifyIssueResponse(input)).rejects.toThrow('対応方法の決定内容が不正です。対応方法（修正・再発行・顧客対応）と対応内容を確認してください。');
  });

  it('should throw InvalidResponseDecisionContent when actionDescription is empty', async () => {
    const input = {
      issueContext: {
        dealId: 'DEAL-001',
        invoiceId: 'INV-2024-001',
        amount: 150000,
        delayDays: 5,
        reason: '請求書未送付',
        additionalNotes: '営業担当者確認待ち'
      },
      reportingRepresentativeId: 'USER-REP-001',
      responseDecision: {
        actionType: 'reissue' as const,
        actionDescription: '',
        responseDeadline: new Date('2024-12-20T10:00:00Z'),
        respondingUserId: 'USER-ACCT-001',
        respondingUserName: '経理太郎',
        respondingUserRole: '経理担当者'
      },
      currentDateTime: new Date('2024-12-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'in_app'>,
      urgencyLevel: 'high' as const
    };

    await expect(notifyIssueResponse(input)).rejects.toThrow(InvalidResponseDecisionContent);
    await expect(notifyIssueResponse(input)).rejects.toThrow('対応方法の決定内容が不正です。対応方法（修正・再発行・顧客対応）と対応内容を確認してください。');
  });
});
