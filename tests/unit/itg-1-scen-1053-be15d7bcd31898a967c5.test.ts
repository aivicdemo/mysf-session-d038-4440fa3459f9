import { notifyModificationRequest } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1053: Return recipientCount=2 for sales representative and manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return recipientCount of 2 when notifying sales rep and manager', async () => {
    const mockInvoiceData = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice',
      currentAmount: 1000000,
      previousAmount: 950000,
      status: 'draft'
    };

    const mockSalesRepData = [
      {
        userId: 'sales-rep-001',
        userName: '鈴木花子',
        email: 'suzuki.hanako@company.com',
        role: 'sales_representative',
        status: 'active'
      }
    ];

    const mockSupervisorData = [
      {
        userId: 'manager-001',
        userName: '佐藤次郎',
        email: 'sato.jiro@company.com',
        role: 'sales_manager',
        status: 'active',
        superviseeIds: ['sales-rep-001']
      }
    ];

    const mockPermissions = [
      {
        userId: 'sales-rep-001',
        permissions: ['view_modification_request', 'edit_invoice_line_item']
      },
      {
        userId: 'manager-001',
        permissions: ['view_modification_request', 'approve_modification_request']
      }
    ];

    (dataPersistence.fetchInvoiceById as jest.Mock).mockResolvedValue(mockInvoiceData);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(mockSalesRepData);
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue(mockSupervisorData);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

    const input = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice' as const,
      modificationContent: '請求金額を1000000円から950000円に修正。消費税計算エラーによる金額ズレ。',
      modificationReason: '消費税計算エラー',
      modificationDeadline: new Date('2026-10-14T17:00:00Z'),
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      requestedByUserId: 'admin-001',
      requestedByUserName: '山田太郎',
      notificationChannels: ['email' as const, 'in_app' as const],
      urgencyLevel: 'high' as const
    };

    const result = await notifyModificationRequest(input);

    expect(result.recipientCount).toBe(2);
    expect(result.sentRecipients.filter(r => r.userId === 'sales-rep-001')).toHaveLength(2);
    expect(result.sentRecipients.filter(r => r.userId === 'manager-001')).toHaveLength(2);

    expect(result.sentRecipients.some(r => r.userId === 'sales-rep-001' && r.userName === '鈴木花子' && r.role === 'sales_representative')).toBe(true);
    expect(result.sentRecipients.some(r => r.userId === 'manager-001' && r.userName === '佐藤次郎' && r.role === 'sales_manager')).toBe(true);

    expect(result.sentChannels).toContain('email');
    expect(result.sentChannels).toContain('in_app');

    expect(result.notificationId).toBeDefined();
    expect(typeof result.notificationId).toBe('string');
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(result.notificationId)).toBe(true);

    expect(result.modificationRequestId).toBeDefined();
    expect(typeof result.modificationRequestId).toBe('string');
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(result.modificationRequestId)).toBe(true);

    expect(result.failedRecipients).toBeUndefined();
  });
});
