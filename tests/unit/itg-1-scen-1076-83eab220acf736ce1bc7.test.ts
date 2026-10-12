import { notifyInvoiceSLAExceeded, NotifyInvoiceSLAExceededInput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchAllUsers: jest.fn()
}));

describe('SCEN-1076: 通知チャネルが複数指定されたとき、すべての指定チャネルで営業担当者に通知できる', () => {
  it('全 3 チャネルで営業担当者に通知を送信', async () => {
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        userId: 'SR-001',
        userName: '営業太郎',
        role: 'sales_representative' as const,
        email: 'taro.sales@company.com',
        phone: '09012345678',
        notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      },
    ]);

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        userId: 'SUPER-001',
        userName: '営業部長',
        role: 'sales_manager' as const,
        email: 'bucho@company.com',
        phone: '09087654321',
        notificationChannels: ['email'] as Array<'email' | 'sms' | 'in_app'>,
      },
    ]);

    const input: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus: {
        dealId: 'DEAL-20250107-001',
        dealName: 'A社システム導入案件',
        customerId: 'CUST-A001',
        customerName: 'A社',
        salesRepresentativeId: 'SR-001',
        salesRepresentativeName: '営業太郎',
        invoiceGenerationSLADeadline: new Date('2025-01-05T17:00:00Z'),
        requestGenerationSLAExceededFlag: true,
        dealAmount: 5000000,
        dealStage: 'クローズ受注',
      },
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
      escalateToSupervisor: false,
      currentDateTime: new Date('2025-01-07T10:30:00Z'),
    };

    const result = await notifyInvoiceSLAExceeded(input);

    expect(result.dealId).toBe('DEAL-20250107-001');
    expect(result.recipientCount).toBe(1);
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);
    expect(result.sentChannels).toHaveLength(3);
    expect(result.sentRecipients).toHaveLength(3);
    expect(result.sentRecipients[0]).toMatchObject({
      userId: 'SR-001',
      userName: '営業太郎',
      role: 'sales_representative',
      channel: 'email',
      sentAt: expect.any(Date)
    });
    expect(result.sentRecipients[1]).toMatchObject({
      userId: 'SR-001',
      channel: 'sms'
    });
    expect(result.sentRecipients[2]).toMatchObject({
      userId: 'SR-001',
      channel: 'in_app'
    });
    expect(result.escalatedToSupervisor).toBe(false);
    expect(result.supervisorNotificationId).toBeUndefined();
    expect(result.failedRecipients).toBeUndefined();
    expect(result.notificationId).toBeTruthy();
  });
});
