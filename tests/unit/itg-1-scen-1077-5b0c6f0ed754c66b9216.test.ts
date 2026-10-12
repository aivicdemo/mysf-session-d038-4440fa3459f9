import { notifyInvoiceSLAExceeded, NotifyInvoiceSLAExceededInput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchAllUsers: jest.fn()
}));

describe('SCEN-1077: escalateToSupervisor がtrue のとき、営業部長へもエスカレーション通知が送信されて出力に反映される', () => {
  it('営業部長にエスカレーション通知を送信', async () => {
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        userId: 'SR-001',
        userName: '営業太郎',
        role: 'sales_representative' as const,
        email: 'taro.sales@company.com',
        phone: '09012345678',
        notificationChannels: ['email', 'in_app', 'sms'] as Array<'email' | 'sms' | 'in_app'>,
      },
    ]);

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        userId: 'SUPV-001',
        userName: '営業部長花子',
        role: 'sales_manager' as const,
        email: 'hanako.supervisor@company.com',
        phone: '09087654321',
        notificationChannels: ['email', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      },
    ]);

    const input: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus: {
        dealId: 'DEAL-20250107-001',
        dealName: '大型プロジェクト契約',
        customerId: 'CUST-12345',
        customerName: 'ABC商事',
        salesRepresentativeId: 'SR-001',
        salesRepresentativeName: '営業太郎',
        invoiceGenerationSLADeadline: new Date('2025-01-07T17:00:00Z'),
        requestGenerationSLAExceededFlag: true,
        dealAmount: 5000000,
        dealStage: 'クローズ完了',
      },
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
      escalateToSupervisor: true,
      currentDateTime: new Date('2025-01-08T09:00:00Z'),
    };

    const result = await notifyInvoiceSLAExceeded(input);

    expect(result.dealId).toBe('DEAL-20250107-001');
    expect(result.recipientCount).toBe(2);
    expect(result.sentChannels).toEqual(['email', 'in_app']);
    expect(result.escalatedToSupervisor).toBe(true);
    expect(result.supervisorNotificationId).toBeTruthy();
    expect(result.sentRecipients).toHaveLength(4);
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
    expect(result.sentRecipients[2]).toMatchObject({
      userId: 'SUPV-001',
      userName: '営業部長花子',
      role: 'sales_manager',
      channel: 'email'
    });
    expect(result.sentRecipients[3]).toMatchObject({
      userId: 'SUPV-001',
      channel: 'in_app'
    });
    expect(result.failedRecipients).toBeUndefined();
    expect(result.notificationId).toBeTruthy();
  });
});
