import { classifyAndRespondToIssue } from '../../src/logic/issue-response-management';
import type { SaveDealOutput, SaveInvoiceOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealsWithInvoices: jest.fn(),
}));
jest.mock('../../src/logic/modification-tracking', () => ({
  ...jest.requireActual<typeof import('../../src/logic/modification-tracking')>('../../src/logic/modification-tracking'),
  retrieveModificationHistoryByTargetRecord: jest.fn(),
}));
jest.mock('../../src/logic/notification-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'),
  notifyIssueResponse: jest.fn(),
}));

describe('SCEN-254: 金額ズレが商談金額の5%未満の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('端数処理の差異と分類されて経理判断待ちになる', async () => {
    const mockDealWithInvoices = {
      dealsWithInvoices: [
        {
          deal: {
            dealId: '660e8400-e29b-41d4-a716-446655440001',
            dealAmount: 100000,
            dealStatus: 'closed_won',
            customerId: 'cust-001',
            salesRepresentativeId: 'rep-001',
            dealName: 'Test Deal',
            stageId: 'stage-closed-won',
            expectedContractDate: '2026-09-01',
            contractedDate: '2026-09-01',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2026-09-01T09:00:00Z',
            updatedAt: '2026-10-01T08:00:00Z',
            createdBy: 'user-admin',
          } as SaveDealOutput,
          invoices: [
            {
              invoice: {
                invoiceId: '770e8400-e29b-41d4-a716-446655440002',
                dealId: '660e8400-e29b-41d4-a716-446655440001',
                invoiceAmount: 95200,
                invoiceDate: '2026-10-01',
                dueDate: '2026-10-31',
                invoiceStatus: 'issued',
                customerId: 'cust-001',
                salesRepresentativeId: 'rep-001',
                invoiceNumber: 'INV-001',
                taxAmount: 0,
                untaxedAmount: 95200,
                paidDate: null,
                paidAmount: null,
                remarks: null,
                modificationReason: null,
                reissueCount: 0,
                lastReissuedAt: null,
                amountCalculationVerificationStatus: 'passed',
                referenceIntegrityVerificationStatus: 'passed',
                createdAt: '2026-10-01T08:00:00Z',
                updatedAt: '2026-10-01T08:00:00Z',
                createdBy: 'user-admin',
              } as SaveInvoiceOutput,
              lineItems: [],
            },
          ],
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-10-07T14:00:00Z',
    };

    const mockModificationHistory = {
      modificationRecords: [],
      totalCount: 0,
    };

    const mockNotification = {
      notificationId: 'notif-001',
      recipientCount: 1,
      sentChannels: ['email'],
      sentRecipients: [
        {
          userId: 'billing-user-001',
          userName: 'Billing User',
          role: 'accounting_department',
          channel: 'email',
          sentAt: new Date('2026-10-07T14:05:00Z'),
        },
      ],
      responseNotificationId: 'resp-notif-001',
    };

    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue(mockDealWithInvoices);
    (modificationTracking.retrieveModificationHistoryByTargetRecord as jest.Mock).mockResolvedValue(mockModificationHistory);
    (notificationService.notifyIssueResponse as jest.Mock).mockResolvedValue(mockNotification);

    const result = await classifyAndRespondToIssue({
      issueReportId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      invoiceId: '770e8400-e29b-41d4-a716-446655440002',
      issueType: 'amount_discrepancy',
      reportedAmount: 95200,
      reportedReason: '請求書の金額が商談金額と異なる。端数処理の影響と考えられる。',
      reportedDateTime: '2026-10-07T10:30:00Z',
      currentDateTime: '2026-10-07T14:00:00Z',
      requestingUserId: 'billing-user-001',
    });

    expect(result.issueRootCause).toBe('incorrect_amount_calculation');
    expect(result.responseAction).toBe('manual_review_required');
    expect(result.responseActionDescription).toContain('端数処理の差異');
    expect(result.responseActionDescription).toContain('経理部門による最終判断');
    expect(result.requiredSteps).toContain('経理部門で金額ズレの原因を確認');
    expect(result.requiredSteps).toContain('必要に応じて会計処理の修正検討');
    expect(result.requiredSteps).toContain('顧客への説明方針を決定');
    expect(result.estimatedResolutionDateTime).toBe('2026-10-08T14:00:00Z');
    expect(result.responseDecisionDateTime).toBe('2026-10-07T14:00:00Z');
    expect(result.notificationContent.notificationChannel).toBe('email');
    expect(result.notificationContent.message).toContain('端数処理の差異');
  });
});
