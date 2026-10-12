import { notifyModificationRequest, NotifyModificationRequestOutput, NotifyModificationRequestInput } from '../../src/logic/notification-service';
import * as datapersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1048: notifyModificationRequest - Multiple notification channels with priority order', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return only successfully sent channels in sentChannels when in_app is unavailable', async () => {
    const input: NotifyModificationRequestInput = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice',
      modificationContent: '請求金額を1000000から950000に修正。税抜金額の計算エラーが原因。',
      modificationReason: '金額ズレ',
      modificationDeadline: new Date('2026-10-15T18:00:00Z'),
      currentDateTime: new Date('2026-10-08T09:00:00Z'),
      requestedByUserId: 'admin-user-001',
      requestedByUserName: '山田太郎',
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'high',
    };

    const invoiceData = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice',
      invoiceNumber: 'INV-2026-001',
      currentAmount: 1000000,
      salesRepresentativeId: 'sales-rep-001',
      status: 'pending',
    };

    const salesRepData = [
      {
        userId: 'sales-rep-001',
        userName: '佐藤次郎',
        role: 'sales_representative',
        email: 'satoh.jiro@company.com',
        phone: '09012345678',
        status: 'active',
      },
    ];

    const supervisorData = [
      {
        userId: 'supervisor-001',
        userName: '鈴木部長',
        role: 'sales_supervisor',
        email: 'suzuki.bucho@company.com',
        phone: '09087654321',
        status: 'active',
      },
    ];

    const permissionsData = {
      'sales-rep-001': {
        permission_level: 'standard',
      },
      'supervisor-001': {
        permission_level: 'supervisor',
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
    expect(result.sentChannels).toEqual(['email', 'sms']);
    expect(result.sentChannels).not.toContain('in_app');
    expect(result.sentRecipients).toHaveLength(4);
    expect(result.sentRecipients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'sales-rep-001', channel: 'email' }),
        expect.objectContaining({ userId: 'sales-rep-001', channel: 'sms' }),
        expect.objectContaining({ userId: 'supervisor-001', channel: 'email' }),
        expect.objectContaining({ userId: 'supervisor-001', channel: 'sms' }),
      ])
    );
    expect(result.failedRecipients).toBeUndefined();
    expect(result.modificationRequestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
