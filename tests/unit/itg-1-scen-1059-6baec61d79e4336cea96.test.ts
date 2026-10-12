import { notifyIssueReport, ReportingRepresentativeNotFound } from '../../src/logic/notification-service';

describe('SCEN-1059: notifyIssueReport - invalid reporting representative', () => {
  it('should throw ReportingRepresentativeNotFound when reportingRepresentativeId is invalid', async () => {
    const input = {
      reportContent: {
        dealId: 'DEAL-001',
        invoiceId: 'INV-2024-001',
        amount: 150000,
        delayDays: 5,
        reason: '請求書の発行漏れ',
        additionalNotes: '顧客から問い合わせあり'
      },
      reportingRepresentativeId: 'invalid-rep-id-12345',
      reportTimestamp: new Date('2024-01-15T10:30:00Z'),
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'in_app'>,
      urgencyLevel: 'high' as const
    };

    await expect(notifyIssueReport(input)).rejects.toThrow(ReportingRepresentativeNotFound);
    await expect(notifyIssueReport(input)).rejects.toThrow('報告者の営業担当者情報が見つかりません。');
  });
});
