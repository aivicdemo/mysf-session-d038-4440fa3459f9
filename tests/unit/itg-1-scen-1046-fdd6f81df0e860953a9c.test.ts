import { notifyModificationRequest, NotificationSendFailure, NotifyModificationRequestInput } from '../../src/logic/notification-service';
import * as datapersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1046: notifyModificationRequest - NotificationSendFailure error on email channel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotificationSendFailure when email channel fails with SMTP error', async () => {
    const input: NotifyModificationRequestInput = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice',
      modificationContent: '請求金額を1,000,000円から1,050,000円に修正。税率計算ミスによる差分50,000円を追加。',
      modificationReason: '金額ズレ',
      modificationDeadline: new Date('2026-10-15T18:00:00Z'),
      currentDateTime: new Date('2026-10-08T10:00:00Z'),
      requestedByUserId: 'user-system-admin-001',
      requestedByUserName: '営業部システム担当 山田太郎',
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'high',
    };

    const invoiceData = {
      recordId: '550e8400-e29b-41d4-a716-446655440000',
      recordType: 'invoice',
      invoiceNumber: 'INV-2026-001234',
      currentAmount: 1000000,
      previousAmount: 950000,
      status: 'draft',
      salesRepId: 'rep-sales-001',
    };

    const salesRepData = [
      {
        userId: 'rep-sales-001',
        userName: '営業担当 鈴木花子',
        email: 'suzuki.hanako@company.com',
        phone: '090-1234-5678',
        status: 'active',
        supervisorId: 'mgr-sales-dept-001',
      },
    ];

    const supervisorData = [
      {
        userId: 'mgr-sales-dept-001',
        userName: '営業部長 佐藤次郎',
        email: 'sato.jiro@company.com',
        phone: '090-9876-5432',
        role: 'sales_manager',
        status: 'active',
      },
    ];

    const permissionsData = {
      'rep-sales-001': {
        userId: 'rep-sales-001',
        canViewModificationDetails: true,
        canEditInvoice: true,
        permissionLevel: 'sales_rep',
      },
      'mgr-sales-dept-001': {
        userId: 'mgr-sales-dept-001',
        canViewModificationDetails: true,
        canApproveModification: true,
        permissionLevel: 'sales_manager',
      },
    };

    (datapersistence.fetchInvoiceById as jest.Mock).mockResolvedValue(invoiceData);
    (datapersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(salesRepData);
    (datapersistence.fetchAllUsers as jest.Mock).mockResolvedValue(supervisorData);
    (datapersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(permissionsData);

    await expect(notifyModificationRequest(input)).rejects.toThrow(NotificationSendFailure);
    await expect(notifyModificationRequest(input)).rejects.toThrow(
      '通知の送信に失敗しました。通知チャネルの状態を確認し、再度実行してください。'
    );
  });
});
