import { notifyModificationRequest, NotificationChannelUnavailable, NotifyModificationRequestInput } from '../../src/logic/notification-service';
import * as datapersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1045: notifyModificationRequest - NotificationChannelUnavailable error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotificationChannelUnavailable when all notification channels are unavailable', async () => {
    const input: NotifyModificationRequestInput = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice',
      modificationContent: '請求金額を1,000,000円から1,050,000円に修正。消費税計算の誤り（税率8%の適用漏れ）。',
      modificationReason: '金額ズレ',
      modificationDeadline: new Date('2026-10-15T23:59:59Z'),
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      requestedByUserId: 'user-sys-001',
      requestedByUserName: '営業部システム担当 太郎',
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'high',
    };

    const invoiceData = {
      invoiceId: 'inv-001',
      amount: 1000000,
      status: 'draft',
      salesRepId: 'sr-001',
    };

    const salesRepData = [
      {
        salesRepId: 'sr-001',
        userId: 'user-rep-001',
        userName: '営業担当 花子',
        email: 'hanako@company.com',
        phone: '+81-90-1234-5678',
        status: 'active',
      },
    ];

    const supervisorData = [
      {
        userId: 'user-sup-001',
        userName: '営業部長 次郎',
        email: 'jiro@company.com',
        phone: '+81-90-8765-4321',
        status: 'active',
        role: 'supervisor',
      },
    ];

    const permissionsData = [
      {
        userId: 'user-rep-001',
        role: 'sales_representative',
        permissions: ['view_invoice', 'modify_invoice_detail'],
      },
      {
        userId: 'user-sup-001',
        role: 'sales_supervisor',
        permissions: ['view_invoice', 'approve_modification'],
      },
    ];

    (datapersistence.fetchInvoiceById as jest.Mock).mockResolvedValue(invoiceData);
    (datapersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(salesRepData);
    (datapersistence.fetchAllUsers as jest.Mock).mockResolvedValue(supervisorData);
    (datapersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(permissionsData);

    await expect(notifyModificationRequest(input)).rejects.toThrow(NotificationChannelUnavailable);
    await expect(notifyModificationRequest(input)).rejects.toThrow(
      '指定された通知チャネルが利用できません。別のチャネルを選択してください。'
    );
  });
});
