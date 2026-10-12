import { classifyAndRespondToIssue } from '../../src/logic/issue-response-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/notification-service');

describe('SCEN-267: 対応方法決定時に営業担当者への通知が実行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('請求漏れ報告を受けて、営業担当者への通知が実行される', async () => {
    const issueReportId = '550e8400-e29b-41d4-a716-446655440000';
    const dealId = '660e8400-e29b-41d4-a716-446655440001';
    const invoiceId = '770e8400-e29b-41d4-a716-446655440002';
    const issueType = 'billing_omission';
    const reportedAmount = null;
    const reportedReason = '請求書が予定日から30日以上経過しても発行されていない状態が続いている';
    const reportedDateTime = '2026-10-07T10:00:00Z';
    const currentDateTime = '2026-10-07T14:30:00Z';
    const requestingUserId = '880e8400-e29b-41d4-a716-446655440003';

    const dealAndInvoiceState = {
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      dealStatus: 'won',
      dealAmount: 1000000,
      expectedBillingDate: '2026-09-01',
      invoiceId: '770e8400-e29b-41d4-a716-446655440002',
      invoiceStatus: 'not_generated',
      invoiceGeneratedDateTime: null,
      paymentDueDate: '2026-09-30',
    };

    const invoiceModificationHistory: any[] = [];

    const notificationResult = {
      notificationId: '990e8400-e29b-41d4-a716-446655440004',
      sentDateTime: '2026-10-07T14:30:30Z',
      recipientUserId: '660e8400-e29b-41d4-a716-446655440005',
      channel: 'email',
    };

    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue(
      dealAndInvoiceState
    );
    (modificationTracking.retrieveModificationHistoryByTargetRecord as jest.Mock).mockResolvedValue(
      invoiceModificationHistory
    );
    (notificationService.notifyIssueResponse as jest.Mock).mockResolvedValue(
      notificationResult
    );

    const result = await classifyAndRespondToIssue({
      issueReportId,
      dealId,
      invoiceId,
      issueType,
      reportedAmount,
      reportedReason,
      reportedDateTime,
      currentDateTime,
      requestingUserId,
    });

    expect(result.issueRootCause).toBe('missing_invoice_generation');
    expect(result.responseAction).toBe('correct_and_regenerate');
    expect(result.responseActionDescription).toContain('請求書');
    expect(result.responseActionDescription).toContain('生成');
    expect(result.requiredSteps).toContain('請求データ検証');
    expect(result.requiredSteps).toContain('請求書生成');
    expect(result.estimatedResolutionDateTime <= '2026-10-10T14:30:00Z').toBe(true);
    expect(result.estimatedResolutionDateTime >= currentDateTime).toBe(true);
    expect(result.notificationContent).toBeDefined();
    expect(result.notificationContent.recipientUserId).toBeDefined();
    expect(result.notificationContent.notificationChannel).toBeDefined();
    expect(result.notificationContent.subject).toBeDefined();
    expect(result.notificationContent.message).toBeDefined();

    expect(notificationService.notifyIssueResponse).toHaveBeenCalled();
    const notifyCall = (notificationService.notifyIssueResponse as jest.Mock).mock.calls[0][0];
    expect(notifyCall).toEqual(result.notificationContent);

    expect(result.responseDecisionDateTime >= currentDateTime).toBe(true);
  });
});
