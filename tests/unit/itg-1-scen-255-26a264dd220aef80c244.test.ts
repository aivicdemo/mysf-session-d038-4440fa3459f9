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

describe('SCEN-255: 請求遅延で実請求日が予定日より後の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('顧客確認対応が決定される', async () => {
    const mockDealWithInvoices = {
      dealsWithInvoices: [
        {
          deal: {
            dealId: '660e8400-e29b-41d4-a716-446655440001',
            dealAmount: 1000000,
            dealStatus: 'closed_won',
            customerId: 'cust-001',
            salesRepresentativeId: 'rep-001',
            dealName: 'Test Deal',
            stageId: 'stage-closed-won',
            expectedContractDate: '2026-10-10',
            contractedDate: '2026-10-10',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2026-10-10T00:00:00Z',
            updatedAt: '2026-10-15T09:00:00Z',
            createdBy: 'user-admin',
          } as SaveDealOutput,
          invoices: [
            {
              invoice: {
                invoiceId: '770e8400-e29b-41d4-a716-446655440002',
                dealId: '660e8400-e29b-41d4-a716-446655440001',
                invoiceAmount: 1000000,
                invoiceDate: '2026-10-15',
                dueDate: '2026-11-15',
                invoiceStatus: 'issued',
                customerId: 'cust-001',
                salesRepresentativeId: 'rep-001',
                invoiceNumber: 'INV-001',
                taxAmount: 0,
                untaxedAmount: 1000000,
                paidDate: null,
                paidAmount: null,
                remarks: null,
                modificationReason: null,
                reissueCount: 0,
                lastReissuedAt: null,
                amountCalculationVerificationStatus: 'passed',
                referenceIntegrityVerificationStatus: 'passed',
                createdAt: '2026-10-15T09:00:00Z',
                updatedAt: '2026-10-15T09:00:00Z',
                createdBy: 'user-admin',
              } as SaveInvoiceOutput,
              lineItems: [],
            },
          ],
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-10-20T14:00:00Z',
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
          userId: '880e8400-e29b-41d4-a716-446655440003',
          userName: 'User',
          role: 'sales_representative',
          channel: 'email',
          sentAt: new Date('2026-10-20T14:00:00Z'),
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
      issueType: 'billing_delay',
      reportedAmount: null,
      reportedReason: '請求書の発行が予定日より遅れている',
      reportedDateTime: '2026-10-15T10:30:00Z',
      currentDateTime: '2026-10-20T14:00:00Z',
      requestingUserId: '880e8400-e29b-41d4-a716-446655440003',
    });

    expect(result.issueRootCause).toBe('system_processing_delay');
    expect(result.responseAction).toBe('customer_contact_required');
    expect(result.responseActionDescription).toContain('5日遅延');
    expect(result.responseActionDescription).toContain('顧客への連絡');
    expect(result.requiredSteps).toContain('顧客に遅延について連絡');
    expect(result.requiredSteps).toContain('支払期限の確認と調整');
    expect(result.requiredSteps).toContain('以降の対応状況を追跡');
    expect(result.estimatedResolutionDateTime).toBe('2026-10-25T14:00:00Z');
    expect(result.responseDecisionDateTime).toBe('2026-10-20T14:00:00Z');
  });
});
