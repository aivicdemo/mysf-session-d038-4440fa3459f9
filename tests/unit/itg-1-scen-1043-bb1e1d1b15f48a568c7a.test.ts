import { notifyModificationRequest, SalesRepresentativeNotFound } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchInvoiceById: jest.fn(),
  fetchAllSalesRepresentatives: jest.fn(),
}));

describe('SCEN-1043: notifyModificationRequest - 営業担当者が存在しないときエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('修正対象の請求書に紐付く営業担当者が存在しないか無効ステータスであるとき、SalesRepresentativeNotFound エラーを発生させる', async () => {
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';
    const targetRecordType = 'invoice' as const;
    const modificationContent = '請求金額を1,000,000円から1,050,000円に修正。税額計算の誤りにより修正。';
    const modificationReason = '金額ズレ';
    const modificationDeadline = new Date('2026-10-15T17:00:00Z');
    const currentDateTime = new Date('2026-10-07T09:00:00Z');
    const requestedByUserId = 'admin-user-001';
    const requestedByUserName = '営業部システム担当 太郎';
    const notificationChannels = ['email' as const, 'in_app' as const];
    const urgencyLevel = 'high' as const;

    const mockInvoice = { invoiceId: targetRecordId, invoiceNumber: 'INV-2026-001', amount: 1000000, status: 'draft' };

    (dataPersistence.fetchInvoiceById as jest.Mock).mockResolvedValue(mockInvoice);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([]);

    await expect(
      notifyModificationRequest({
        targetRecordId,
        targetRecordType,
        modificationContent,
        modificationReason,
        modificationDeadline,
        currentDateTime,
        requestedByUserId,
        requestedByUserName,
        notificationChannels,
        urgencyLevel,
      })
    ).rejects.toThrow(SalesRepresentativeNotFound);
  });
});
