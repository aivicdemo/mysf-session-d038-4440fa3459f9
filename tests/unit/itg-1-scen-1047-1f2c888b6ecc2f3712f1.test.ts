import { notifyModificationRequest } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';
import { InsufficientPermissionForNotification } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1047: InsufficientPermissionForNotification error when recipient lacks permission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should raise InsufficientPermissionForNotification error when recipient lacks required permissions', async () => {
    const mockInvoiceData = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      invoiceNumber: 'INV-20261001-001',
      currentAmount: 1000000,
      previousAmount: 1050000,
      salesRepresentativeId: 'sales-rep-001',
      status: 'draft'
    };

    const mockSalesRepData = [
      {
        userId: 'sales-rep-001',
        userName: '営業担当者 花子',
        email: 'hanako@example.com',
        phone: '09012345678',
        role: 'sales_representative',
        supervisorId: 'supervisor-001',
        status: 'active'
      }
    ];

    const mockSupervisorData = [
      {
        userId: 'supervisor-001',
        userName: '営業部長 次郎',
        email: 'jiro@example.com',
        phone: '09087654321',
        role: 'sales_manager',
        status: 'active'
      }
    ];

    const mockPermissions = {
      'sales-rep-001': { permissions: ['view:own_invoices', 'edit:own_invoices'] },
      'supervisor-001': { permissions: ['view:all_invoices', 'approve:modifications'] }
    };

    (dataPersistence.fetchInvoiceById as jest.Mock).mockResolvedValue(mockInvoiceData);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(mockSalesRepData);
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue(mockSupervisorData);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

    const input = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice' as const,
      modificationContent: '請求金額を1000000から1050000に修正。消費税計算誤りにより差額50000円を追加',
      modificationReason: '金額ズレ',
      modificationDeadline: new Date('2026-10-15T17:00:00Z'),
      currentDateTime: new Date('2026-10-07T09:00:00Z'),
      requestedByUserId: 'admin-user-001',
      requestedByUserName: '営業部システム担当 太郎',
      notificationChannels: ['email' as const, 'in_app' as const],
      urgencyLevel: 'high' as const
    };

    await expect(notifyModificationRequest(input)).rejects.toThrow(InsufficientPermissionForNotification);
    await expect(notifyModificationRequest(input)).rejects.toThrow('通知対象者の権限が不足しているため、修正内容を表示できません。権限を確認してください。');
  });
});
