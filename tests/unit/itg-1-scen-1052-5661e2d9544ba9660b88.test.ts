import { notifyModificationRequest } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1052: Handle immediate urgency level with priority notification delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should prioritize notification delivery when urgency level is immediate', async () => {
    const mockInvoiceData = {
      recordId: '550e8400-e29b-41d4-a716-446655440000',
      recordType: 'invoice',
      currentAmount: 1000000,
      previousAmount: 950000,
      invoiceNumber: 'INV-2026-001',
      clientName: 'ABC株式会社',
      status: 'draft'
    };

    const mockSalesRepData = [
      {
        userId: 'user-sales-001',
        userName: '営業担当者 鈴木花子',
        email: 'suzuki.hanako@example.com',
        phone: '09012345678',
        status: 'active',
        role: 'sales_representative',
        supervisorId: 'user-manager-001'
      }
    ];

    const mockSupervisorData = [
      {
        userId: 'user-manager-001',
        userName: '営業部長 佐藤次郎',
        email: 'sato.jiro@example.com',
        phone: '09087654321',
        status: 'active',
        role: 'sales_manager'
      }
    ];

    const mockPermissions = [
      {
        userId: 'user-sales-001',
        permissions: ['view_modification_request', 'edit_invoice', 'submit_modification']
      },
      {
        userId: 'user-manager-001',
        permissions: ['view_modification_request', 'approve_modification', 'edit_invoice']
      }
    ];

    (dataPersistence.fetchInvoiceById as jest.Mock).mockResolvedValue(mockInvoiceData);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(mockSalesRepData);
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue(mockSupervisorData);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

    const currentTime = new Date('2026-10-07T09:00:00Z');
    const input = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice' as const,
      modificationContent: '請求金額を1000000から950000に修正。税抜金額の計算誤りを修正',
      modificationReason: '金額ズレ：商品単価の割引率が反映されていなかった',
      modificationDeadline: new Date('2026-10-10T18:00:00Z'),
      currentDateTime: currentTime,
      requestedByUserId: 'user-admin-001',
      requestedByUserName: '営業部システム担当 山田太郎',
      notificationChannels: ['email' as const, 'sms' as const, 'in_app' as const],
      urgencyLevel: 'immediate' as const
    };

    const result = await notifyModificationRequest(input);

    expect(result.notificationId).toBeDefined();
    expect(typeof result.notificationId).toBe('string');
    expect(result.recipientCount).toBe(2);
    expect(result.sentChannels).toEqual(expect.arrayContaining(['email', 'sms', 'in_app']));
    expect(result.sentRecipients).toHaveLength(6);

    const salesRepRecipients = result.sentRecipients.filter(r => r.userId === 'user-sales-001');
    const managerRecipients = result.sentRecipients.filter(r => r.userId === 'user-manager-001');

    expect(salesRepRecipients).toHaveLength(3);
    expect(managerRecipients).toHaveLength(3);

    expect(salesRepRecipients.map(r => r.channel)).toEqual(expect.arrayContaining(['email', 'sms', 'in_app']));
    expect(managerRecipients.map(r => r.channel)).toEqual(expect.arrayContaining(['email', 'sms', 'in_app']));

    salesRepRecipients.forEach(r => {
      expect(r.sentAt.getTime()).toBeGreaterThanOrEqual(currentTime.getTime());
      expect(r.userName).toBe('営業担当者 鈴木花子');
      expect(r.role).toBe('sales_representative');
    });

    managerRecipients.forEach(r => {
      expect(r.sentAt.getTime()).toBeGreaterThanOrEqual(currentTime.getTime());
      expect(r.userName).toBe('営業部長 佐藤次郎');
      expect(r.role).toBe('sales_manager');
    });

    expect(result.failedRecipients).toBeUndefined();
    expect(result.modificationRequestId).toBeDefined();
    expect(typeof result.modificationRequestId).toBe('string');
  });
});
