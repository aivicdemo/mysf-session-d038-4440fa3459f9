import { notifyInvoiceSLAExceeded, NotifyInvoiceSLAExceededInput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchAllUsers: jest.fn()
}));

describe('SCEN-1078: escalateToSupervisor がfalse または未指定のとき、営業部長へのエスカレーション通知は送信されない', () => {
  it('営業部長へのエスカレーション通知は送信されず、営業担当者への通知のみ', async () => {
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        userId: 'SR-001',
        userName: '営業太郎',
        role: 'sales_representative' as const,
        email: 'taro@example.com',
        phone: '09012345678',
        notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      },
    ]);

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        userId: 'SUPER-001',
        userName: '営業部長花子',
        role: 'sales_supervisor' as const,
        email: 'hanako@example.com',
        notificationChannels: ['email'] as Array<'email' | 'sms' | 'in_app'>,
      },
    ]);

    const input: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus: {
        dealId: 'DEAL-001',
        dealName: '顧客A様 システム導入案件',
        customerId: 'CUST-001',
        customerName: '顧客A様',
        salesRepresentativeId: 'SR-001',
        salesRepresentativeName: '営業太郎',
        invoiceGenerationSLADeadline: new Date('2024-12-20T18:00:00Z'),
        requestGenerationSLAExceededFlag: true,
        dealAmount: 5000000,
        dealStage: '契約済み',
      },
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
      escalateToSupervisor: false,
      currentDateTime: new Date('2024-12-21T09:00:00Z'),
    };

    const result = await notifyInvoiceSLAExceeded(input);

    expect(result.dealId).toBe('DEAL-001');
    expect(result.recipientCount).toBe(1);
    expect(result.sentChannels).toEqual(['email', 'in_app']);
    expect(result.sentRecipients).toHaveLength(2);
    expect(result.sentRecipients[0]).toMatchObject({
      userId: 'SR-001',
      userName: '営業太郎',
      role: 'sales_representative',
      channel: 'email',
      sentAt: expect.any(Date)
    });
    expect(result.sentRecipients[1]).toMatchObject({
      userId: 'SR-001',
      channel: 'in_app'
    });
    expect(result.escalatedToSupervisor).toBe(false);
    expect(result.supervisorNotificationId).toBeUndefined();
    expect(result.failedRecipients).toBeUndefined();
    expect(result.notificationId).toBeTruthy();
  });
});
