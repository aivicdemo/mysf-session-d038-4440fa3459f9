import { notifyModificationRequest } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchInvoiceById: jest.fn(),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-1037: notifyModificationRequest - 正常系', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('修正依頼の必須項目がすべて満たされ、修正期限が現在日時以降であるとき、修正依頼が通知される', async () => {
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';
    const targetRecordType = 'invoice' as const;
    const modificationContent = '請求金額を1000000円から950000円に修正。税抜き金額の計算誤りを修正';
    const modificationReason = '金額ズレ：契約書の値引き条件を反映漏れ';
    const modificationDeadline = new Date('2026-10-15T18:00:00.000Z');
    const currentDateTime = new Date('2026-10-08T09:00:00.000Z');
    const requestedByUserId = 'user-system-admin-001';
    const requestedByUserName = '山田太郎';
    const notificationChannels = ['email' as const, 'in_app' as const];
    const urgencyLevel = 'high' as const;

    const mockInvoice = { id: targetRecordId, type: 'invoice', amount: 1000000 };
    const mockSalesReps = [
      { id: 'user-sales-rep-001', name: '佐藤花子', email: 'satoh.hanako@company.jp', status: 'active' },
    ];
    const mockManagers = [
      {
        id: 'user-sales-director-001',
        name: '鈴木次郎',
        email: 'suzuki.jiro@company.jp',
        status: 'active',
        role: 'manager',
      },
    ];
    const mockPermissions = {
      'user-sales-rep-001': {
        permissions: ['view_invoice', 'modify_invoice_draft', 'receive_modification_request'],
      },
      'user-sales-director-001': {
        permissions: ['view_invoice', 'approve_modification', 'receive_modification_request'],
      },
    };

    (dataPersistence.fetchInvoiceById as jest.Mock).mockResolvedValue(mockInvoice);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(mockSalesReps);
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue(mockManagers);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

    const result = await notifyModificationRequest({
      targetRecordId,
      targetRecordType,
      modificationContent,
      modificationReason,
      modificationDeadline,
      currentDateTime,
      requestedByUserId,
      requestedByUserName,
      notificationChannels,
      urgencyLevel,
    });

    expect(result.notificationId).toMatch(/^[a-f0-9-]{36}$/);
    expect(result.recipientCount).toBe(2);
    expect(result.sentChannels).toEqual(['email', 'in_app']);
    expect(result.sentRecipients).toHaveLength(2);
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-sales-rep-001', userName: '佐藤花子', role: 'manager' })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-sales-director-001', userName: '鈴木次郎', role: 'manager' })
    );
    expect(result.sentRecipients.every(r => r.sentAt >= currentDateTime)).toBe(true);
    expect(result.failedRecipients).toBeUndefined();
    expect(result.modificationRequestId).toMatch(/^[a-f0-9-]{36}$/);
  });
});
