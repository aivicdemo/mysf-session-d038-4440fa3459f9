import { notifyIssueResponse, InvalidReportingRepresentativeId } from '../../src/logic/notification-service';

describe('SCEN-1065: notifyIssueResponse - invalid reporting representative ID', () => {
  it('should throw InvalidReportingRepresentativeId when reportingRepresentativeId is empty string', async () => {
    const input = {
      issueContext: {
        dealId: 'DEAL-20250101-001',
        invoiceId: 'INV-20250101-001',
        amount: 500000,
        delayDays: 5,
        reason: '請求書未発行',
        additionalNotes: '営業担当者が請求手続きを忘れていた'
      },
      reportingRepresentativeId: '',
      responseDecision: {
        actionType: 'reissue' as const,
        actionDescription: '請求書を再発行し、営業担当者に確認を依頼',
        responseDeadline: new Date('2025-01-10T17:00:00Z'),
        respondingUserId: 'USER-BILLING-001',
        respondingUserName: '山田太郎',
        respondingUserRole: '経理部長'
      },
      currentDateTime: new Date('2025-01-08T09:00:00Z'),
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'in_app'>,
      urgencyLevel: 'high' as const
    };

    await expect(notifyIssueResponse(input)).rejects.toThrow(InvalidReportingRepresentativeId);
    await expect(notifyIssueResponse(input)).rejects.toThrow('報告を行った営業担当者が特定できません。営業担当者IDを確認してください。');
  });

  it('should throw InvalidReportingRepresentativeId when reportingRepresentativeId is null', async () => {
    const input = {
      issueContext: {
        dealId: 'DEAL-20250101-001',
        invoiceId: 'INV-20250101-001',
        amount: 500000,
        delayDays: 5,
        reason: '請求書未発行',
        additionalNotes: '営業担当者が請求手続きを忘れていた'
      },
      reportingRepresentativeId: null as any,
      responseDecision: {
        actionType: 'reissue' as const,
        actionDescription: '請求書を再発行し、営業担当者に確認を依頼',
        responseDeadline: new Date('2025-01-10T17:00:00Z'),
        respondingUserId: 'USER-BILLING-001',
        respondingUserName: '山田太郎',
        respondingUserRole: '経理部長'
      },
      currentDateTime: new Date('2025-01-08T09:00:00Z'),
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'in_app'>,
      urgencyLevel: 'high' as const
    };

    await expect(notifyIssueResponse(input)).rejects.toThrow(InvalidReportingRepresentativeId);
    await expect(notifyIssueResponse(input)).rejects.toThrow('報告を行った営業担当者が特定できません。営業担当者IDを確認してください。');
  });
});
