import { notifyModificationRequest, NotifyModificationRequestOutput, NotifyModificationRequestInput } from '../../src/logic/notification-service';
import * as datapersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1050: notifyModificationRequest - Normal completion with invoice type', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully notify when targetRecordType is invoice', async () => {
    const input: NotifyModificationRequestInput = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice',
      modificationContent: '請求金額を修正。修正対象フィールド: amount、修正前の値: 1000000、修正後の値: 1050000',
      modificationReason: '金額ズレ：税計算の誤りにより、消費税10%の計算が正確ではありませんでした',
      modificationDeadline: new Date('2025-01-20T17:00:00Z'),
      currentDateTime: new Date('2025-01-10T09:00:00Z'),
      requestedByUserId: 'user-admin-001',
      requestedByUserName: '営業部システム担当 太郎',
      notificationChannels: ['email', 'in_app'],
      urgencyLevel: 'high',
    };

    const invoiceData = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      recordType: 'invoice',
      amount: 1000000,
      status: 'draft',
      salesRepresentativeId: 'sales-rep-001',
      invoiceDate: new Date('2025-01-05T00:00:00Z'),
    };

    const salesRepData = [
      {
        userId: 'sales-rep-001',
        userName: '営業担当者 花子',
        email: 'hanako@company.com',
        phone: '09012345678',
        role: 'sales_representative',
        status: 'active',
        supervisorId: 'supervisor-001',
      },
    ];

    const supervisorData = [
      {
        userId: 'supervisor-001',
        userName: '営業部長 次郎',
        email: 'jiro@company.com',
        phone: '09087654321',
        role: 'sales_supervisor',
        status: 'active',
      },
    ];

    const permissionsData = {
      'sales-rep-001': {
        canViewModificationContent: true,
        canViewFinancialDetails: true,
        canApproveModification: false,
      },
      'supervisor-001': {
        canViewModificationContent: true,
        canViewFinancialDetails: true,
        canApproveModification: true,
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
    expect(result.sentChannels).not.toContain('sms');

    expect(result.sentRecipients).toHaveLength(4);
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'sales-rep-001',
        userName: '営業担当者 花子',
        role: 'sales_representative',
        channel: 'email',
      })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'sales-rep-001',
        userName: '営業担当者 花子',
        role: 'sales_representative',
        channel: 'in_app',
      })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'supervisor-001',
        userName: '営業部長 次郎',
        role: 'sales_supervisor',
        channel: 'email',
      })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'supervisor-001',
        userName: '営業部長 次郎',
        role: 'sales_supervisor',
        channel: 'in_app',
      })
    );

    result.sentRecipients.forEach((recipient) => {
      expect(recipient.sentAt).toBeInstanceOf(Date);
      expect(recipient.sentAt.getTime()).toBeGreaterThanOrEqual(input.currentDateTime.getTime());
    });

    expect(result.failedRecipients).toBeUndefined();
    expect(result.modificationRequestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
