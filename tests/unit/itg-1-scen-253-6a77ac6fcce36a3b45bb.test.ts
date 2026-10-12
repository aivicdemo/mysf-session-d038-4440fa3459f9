import { classifyAndRespondToIssue, UnclassifiableIssueRootCause } from '../../src/logic/issue-response-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');

describe('SCEN-253: 金額ズレが商談金額の5%以上の場合、システムエラーと分類されて手動修正対応が決定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should classify amount discrepancy >= 5% as system error and determine manual review response', async () => {
    const dealAndInvoiceData = [
      {
        dealId: '660e8400-e29b-41d4-a716-446655440001',
        dealAmount: 1000000,
        dealStatus: 'closed_won',
        invoiceId: '770e8400-e29b-41d4-a716-446655440002',
        invoiceAmount: 900000,
        invoiceStatus: 'issued',
        invoiceGeneratedDateTime: '2026-01-14T09:00:00Z',
        invoiceBillingDate: '2026-01-14',
        invoiceDueDate: '2026-02-14',
      },
    ];

    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue(dealAndInvoiceData);
    (modificationTracking.retrieveModificationHistoryByTargetRecord as jest.Mock).mockResolvedValue([]);

    const input = {
      issueReportId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      invoiceId: '770e8400-e29b-41d4-a716-446655440002',
      issueType: 'amount_discrepancy',
      reportedAmount: 105000,
      reportedReason: '請求書の金額が商談金額と合致していません。詳細確認をお願いします。',
      reportedDateTime: '2026-01-15T10:30:00Z',
      currentDateTime: '2026-01-15T14:00:00Z',
      requestingUserId: '880e8400-e29b-41d4-a716-446655440003',
    };

    const result = await classifyAndRespondToIssue(input);

    expect(result.issueRootCause).toBe('incorrect_amount_calculation');
    expect(result.responseAction).toBe('manual_review_required');
    expect(result.responseActionDescription).toBe(
      '金額ズレが商談金額の5%以上（差分率79.5%）のため、システムエラーと分類されました。手動修正対応が必要です。請求書の再計算と修正を実施してください。'
    );
    expect(result.requiredSteps).toEqual([
      '請求書の金額計算ロジックを確認',
      '商談金額との差分原因を特定',
      '修正後の請求書を再生成',
      '修正内容を顧客に通知',
    ]);
    expect(result.estimatedResolutionDateTime).toBe('2026-01-16T14:00:00Z');
    expect(result.responseDecisionDateTime).toBe('2026-01-15T14:00:00Z');

    expect(result.notificationContent).toBeDefined();
    expect(result.notificationContent.recipientUserId).toBe('880e8400-e29b-41d4-a716-446655440003');
    expect(result.notificationContent.notificationChannel).toBeDefined();
    expect(result.notificationContent.message).toBeDefined();
    expect(result.notificationContent.subject).toBeDefined();
  });
});
