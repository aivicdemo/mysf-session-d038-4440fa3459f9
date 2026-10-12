import { notifyModificationRequest } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';
import { SupervisorNotFound } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1044: SupervisorNotFound error when supervisor is invalid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should raise SupervisorNotFound error when supervisor status is null', async () => {
    const mockInvoiceData = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      invoiceNumber: 'INV-2026-001',
      salesRepresentativeId: 'user-sales-001',
      amount: 1000000,
      status: 'draft'
    };

    const mockSalesRepData = [
      {
        userId: 'user-sales-001',
        userName: '営業太郎',
        email: 'sales-taro@example.com',
        status: 'active',
        supervisorId: 'user-supervisor-001'
      }
    ];

    const mockSupervisorData = [
      {
        userId: 'user-supervisor-001',
        userName: '営業部長 花子',
        email: 'supervisor-hanako@example.com',
        role: '営業部長',
        status: null
      }
    ];

    const mockPermissions = {
      'user-sales-001': { permissions: ['view_invoice', 'modify_invoice'] },
      'user-supervisor-001': { permissions: ['view_invoice'] }
    };

    (dataPersistence.fetchInvoiceById as jest.Mock).mockResolvedValue(mockInvoiceData);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(mockSalesRepData);
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue(mockSupervisorData);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

    const input = {
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      targetRecordType: 'invoice' as const,
      modificationContent: '請求金額を1,000,000円から1,050,000円に修正',
      modificationReason: '消費税計算誤り',
      modificationDeadline: new Date('2026-10-15T17:00:00Z'),
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      requestedByUserId: 'user-sys-001',
      requestedByUserName: '営業部システム担当 太郎',
      notificationChannels: ['email' as const, 'in_app' as const],
      urgencyLevel: 'high' as const
    };

    await expect(notifyModificationRequest(input)).rejects.toThrow(SupervisorNotFound);
    await expect(notifyModificationRequest(input)).rejects.toThrow('営業担当者の上司が見つかりません。組織構造を確認してください。');
  });
});
