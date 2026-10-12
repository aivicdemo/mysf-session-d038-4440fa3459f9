import { notifyModificationRequest, NotifyModificationRequestOutput, NotifyModificationRequestInput } from '../../src/logic/notification-service';
import * as datapersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1049: notifyModificationRequest - Partial notification failure with failed recipients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return both sentRecipients and failedRecipients when some recipients fail', async () => {
    const input: NotifyModificationRequestInput = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice',
      modificationContent: '請求金額を1,000,000円から950,000円に修正。税率計算の誤りを是正',
      modificationReason: '金額ズレ：税率計算時に端数処理が不正確だったため',
      modificationDeadline: new Date('2025-12-31T17:00:00Z'),
      currentDateTime: new Date('2025-12-24T09:00:00Z'),
      requestedByUserId: 'user-admin-001',
      requestedByUserName: '山田太郎',
      notificationChannels: ['email', 'in_app'],
      urgencyLevel: 'high',
    };

    const invoiceData = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      invoiceNumber: 'INV-2025-001234',
      amount: 1000000,
      taxRate: 0.1,
      salesRepresentativeId: 'sales-rep-001',
      status: 'draft',
    };

    const salesRepData = [
      {
        userId: 'sales-rep-001',
        userName: '佐藤次郎',
        email: 'satou.jiro@example.com',
        phone: '090-1234-5678',
        supervisorId: 'supervisor-001',
        status: 'active',
      },
    ];

    const supervisorData = [
      {
        userId: 'supervisor-001',
        userName: '鈴木部長',
        email: 'suzuki.buchou@example.com',
        phone: '090-9876-5432',
        role: 'sales_manager',
        status: 'active',
      },
    ];

    const permissionsData = {
      'sales-rep-001': {
        canViewModificationDetails: true,
        canEditInvoice: true,
        permissions: ['view_invoice', 'edit_invoice', 'view_modification_request'],
      },
      'supervisor-001': {
        canViewModificationDetails: true,
        canApproveModification: true,
        permissions: ['view_invoice', 'approve_modification', 'view_modification_request'],
      },
    };

    (datapersistence.fetchInvoiceById as jest.Mock).mockResolvedValue(invoiceData);
    (datapersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(salesRepData);
    (datapersistence.fetchAllUsers as jest.Mock).mockResolvedValue(supervisorData);
    (datapersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(permissionsData);

    const result = await notifyModificationRequest(input);

    expect(result).toBeDefined();
    expect(result.notificationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.recipientCount).toBe(2);
    expect(result.sentChannels).toEqual(['email', 'in_app']);

    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'sales-rep-001',
        userName: '佐藤次郎',
        role: 'sales_representative',
        channel: 'email',
      })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'sales-rep-001',
        userName: '佐藤次郎',
        role: 'sales_representative',
        channel: 'in_app',
      })
    );

    expect(result.failedRecipients).toBeDefined();
    expect(result.failedRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'supervisor-001',
        userName: '鈴木部長',
        reason: 'メールサーバー接続エラー',
      })
    );
    expect(result.failedRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'supervisor-001',
        userName: '鈴木部長',
        reason: 'アプリ内通知システム エラー',
      })
    );

    expect(result.modificationRequestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
