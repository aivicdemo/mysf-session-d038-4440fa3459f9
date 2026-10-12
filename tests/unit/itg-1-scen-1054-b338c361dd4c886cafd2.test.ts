import { notifyIssueReport } from '../../src/logic/notification-service';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn()
}));

describe('SCEN-1054: Successfully deliver billing issue report to accounting department', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully deliver billing issue report to all accounting recipients', async () => {
    const reportTimestamp = new Date('2024-10-07T10:30:00Z');

    const input = {
      reportContent: {
        dealId: 'DEAL-2024-001',
        invoiceId: 'INV-2024-0512',
        amount: 150000,
        delayDays: 5,
        reason: '請求書未発行',
        additionalNotes: '顧客との契約完了後、請求手続きが遅延'
      },
      reportingRepresentativeId: 'REP-00123',
      reportTimestamp: reportTimestamp,
      notificationChannels: ['email' as const, 'in_app' as const],
      urgencyLevel: 'high' as const
    };

    const result = await notifyIssueReport(input);

    expect(result.notificationId).toBeDefined();
    expect(typeof result.notificationId).toBe('string');

    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    expect(result.recipientCount).toBe(2);

    expect(result.sentChannels).toContain('email');

    expect(result.sentRecipients).toHaveLength(2);

    const acc00456 = result.sentRecipients.find(r => r.userId === 'ACC-00456');
    const acc00789 = result.sentRecipients.find(r => r.userId === 'ACC-00789');

    expect(acc00456).toBeDefined();
    expect(acc00456?.userName).toBe('山田太郎');
    expect(acc00456?.role).toBe('経理部長');
    expect(acc00456?.channel).toBe('email');
    expect(acc00456?.sentAt).toBeDefined();

    expect(acc00789).toBeDefined();
    expect(acc00789?.userName).toBe('佐藤花子');
    expect(acc00789?.role).toBe('請求担当者');
    expect(acc00789?.channel).toBe('email');
    expect(acc00789?.sentAt).toBeDefined();

    expect(result.failedRecipients).toBeUndefined();
  });
});
