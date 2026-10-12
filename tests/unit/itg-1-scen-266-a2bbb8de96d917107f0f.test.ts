import { classifyAndRespondToIssue } from '../../src/logic/issue-response-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/notification-service');

describe('SCEN-266: 請求書の修正履歴が存在する場合、修正履歴が考慮されて原因が再分類される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('修正履歴を参照して、金額ズレの原因をデータ入力エラーに再分類する', async () => {
    const issueReportId = '550e8400-e29b-41d4-a716-446655440000';
    const dealId = '550e8400-e29b-41d4-a716-446655440001';
    const invoiceId = '550e8400-e29b-41d4-a716-446655440002';
    const issueType = 'amount_discrepancy';
    const reportedAmount = 95000;
    const reportedReason = '請求書に記載された金額が商談時の合意金額と異なっている。修正履歴があるはずだが確認が必要。';
    const reportedDateTime = '2026-01-15T10:30:00Z';
    const currentDateTime = '2026-01-20T14:00:00Z';
    const requestingUserId = 'user-billing-001';

    const dealAndInvoiceState = {
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      dealAmount: 100000,
      dealStatus: 'won',
      invoiceId: '550e8400-e29b-41d4-a716-446655440002',
      invoiceAmount: 95000,
      invoiceGeneratedDateTime: '2026-01-10T09:00:00Z',
      invoicingDate: '2026-01-10',
      paymentDueDate: '2026-02-10',
    };

    const invoiceModificationHistory = [
      {
        modificationId: 'mod-001',
        invoiceId: '550e8400-e29b-41d4-a716-446655440002',
        modificationDateTime: '2026-01-12T11:30:00Z',
        previousAmount: 100000,
        currentAmount: 95000,
        modificationReason: 'data_entry_error',
        modifiedByUserId: 'user-entry-002',
        description: '初期入力時に消費税計算誤りがあり、正しい金額に修正された',
      },
    ];

    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue(
      dealAndInvoiceState
    );
    (modificationTracking.retrieveModificationHistoryByTargetRecord as jest.Mock).mockResolvedValue(
      invoiceModificationHistory
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

    expect(result.issueRootCause).toBe('data_entry_error');
    expect(result.responseAction).toBe('correct_and_regenerate');
    expect(result.responseActionDescription).toContain('請求書は修正済みです');
    expect(result.responseActionDescription).toContain('2026-01-12');
    expect(result.responseActionDescription).toContain('初期入力時の消費税計算誤り');
    expect(result.responseActionDescription).toContain('100000円');
    expect(result.responseActionDescription).toContain('95000円');
    expect(result.requiredSteps).toContain('修正済み請求書の内容確認');
    expect(result.requiredSteps).toContain('営業担当者への説明資料作成');
    expect(result.requiredSteps).toContain('顧客への通知（必要に応じて）');
    expect(result.estimatedResolutionDateTime).toBe('2026-01-23T14:00:00Z');
    expect(result.notificationContent).toBeDefined();
    expect(result.notificationContent.recipientUserId).toBe(requestingUserId);
    expect(result.responseDecisionDateTime).toBe('2026-01-20T14:00:00Z');
  });
});
