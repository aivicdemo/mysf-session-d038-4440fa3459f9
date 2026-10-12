import { notifyModificationRequest } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1051: Handle invoice_line_item record type successfully', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully process modification request for invoice_line_item', async () => {
    const mockInvoiceData = {
      recordId: '550e8400-e29b-41d4-a716-446655440000',
      recordType: 'invoice_line_item',
      invoiceId: 'inv-2026-10-001',
      status: 'draft'
    };

    const mockSalesRepData = [
      {
        userId: 'sales-rep-001',
        userName: '佐藤次郎',
        role: 'sales_representative',
        email: 'satoh.jiro@example.com',
        phone: '09012345678',
        status: 'active'
      }
    ];

    const mockSupervisorData = [
      {
        userId: 'supervisor-001',
        userName: '山田太郎',
        role: 'sales_supervisor',
        email: 'yamada.taro@example.com',
        phone: '09087654321',
        status: 'active'
      }
    ];

    const mockPermissions = {
      'sales-rep-001': {
        userId: 'sales-rep-001',
        permissions: ['view_invoice_line_item', 'edit_invoice_line_item', 'receive_modification_request']
      },
      'supervisor-001': {
        userId: 'supervisor-001',
        permissions: ['view_invoice_line_item', 'edit_invoice_line_item', 'approve_modification_request']
      }
    };

    (dataPersistence.fetchInvoiceById as jest.Mock).mockResolvedValue(mockInvoiceData);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(mockSalesRepData);
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue(mockSupervisorData);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

    const input = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice_line_item' as const,
      modificationContent: '単価を¥1,000から¥1,200に修正。税抜き小計を¥10,000から¥12,000に修正。',
      modificationReason: '商談商品の単価変更に伴う請求明細の修正',
      modificationDeadline: new Date('2026-10-15T23:59:59Z'),
      currentDateTime: new Date('2026-10-10T10:00:00Z'),
      requestedByUserId: 'user-admin-001',
      requestedByUserName: '鈴木太郎',
      notificationChannels: ['email' as const, 'in_app' as const],
      urgencyLevel: 'high' as const
    };

    const result = await notifyModificationRequest(input);

    expect(result.notificationId).toBeDefined();
    expect(typeof result.notificationId).toBe('string');
    expect(result.recipientCount).toBe(2);
    expect(result.sentChannels).toContain('email');
    expect(result.sentChannels).toContain('in_app');
    expect(result.sentRecipients).toHaveLength(4);

    const salesRepRecipients = result.sentRecipients.filter(r => r.userId === 'sales-rep-001');
    const supervisorRecipients = result.sentRecipients.filter(r => r.userId === 'supervisor-001');

    expect(salesRepRecipients).toHaveLength(2);
    expect(supervisorRecipients).toHaveLength(2);

    expect(salesRepRecipients.some(r => r.channel === 'email')).toBe(true);
    expect(salesRepRecipients.some(r => r.channel === 'in_app')).toBe(true);
    expect(supervisorRecipients.some(r => r.channel === 'email')).toBe(true);
    expect(supervisorRecipients.some(r => r.channel === 'in_app')).toBe(true);

    expect(result.modificationRequestId).toBeDefined();
    expect(typeof result.modificationRequestId).toBe('string');
    expect(result.failedRecipients).toBeUndefined();
  });
});
