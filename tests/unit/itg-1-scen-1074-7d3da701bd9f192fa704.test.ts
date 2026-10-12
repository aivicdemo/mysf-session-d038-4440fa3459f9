import { notifyInvoiceSLAExceeded, NotifyInvoiceSLAExceededInput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchAllUsers: jest.fn()
}));

describe('SCEN-1074: 請求SLA超過フラグが立った商談について、指定したチャネルで営業担当者に通知でき、送信結果が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者と営業部長に複数チャネルで通知を送信', async () => {
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        userId: 'SR-0001',
        userName: '営業太郎',
        role: 'sales_representative' as const,
        email: 'taro.sales@company.com',
        phone: '09012345678',
        notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
        isActive: true,
      },
    ]);

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        userId: 'MGMT-0001',
        userName: '営業部長花子',
        role: 'sales_manager' as const,
        email: 'hanako.manager@company.com',
        phone: '09087654321',
        notificationChannels: ['email', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
        isActive: true,
        departmentId: 'DEPT-SALES',
      },
    ]);


    const input: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus: {
        dealId: 'DEAL-20240115-001',
        dealName: 'ABC社システム導入案件',
        customerId: 'CUST-ABC-001',
        customerName: 'ABC株式会社',
        salesRepresentativeId: 'SR-0001',
        salesRepresentativeName: '営業太郎',
        invoiceGenerationSLADeadline: new Date('2024-01-10T23:59:59Z'),
        requestGenerationSLAExceededFlag: true,
        dealAmount: 5000000,
        dealStage: 'Closed Won'
      },
      notificationChannels: ['email', 'sms'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
      escalateToSupervisor: true,
      currentDateTime: new Date('2024-01-15T10:30:00Z'),
    };

    const result = await notifyInvoiceSLAExceeded(input);

    expect(result.dealId).toBe('DEAL-20240115-001');
    expect(result.recipientCount).toBe(2);
    expect(result.sentChannels).toEqual(['email', 'sms']);
    expect(result.escalatedToSupervisor).toBe(true);
    expect(result.supervisorNotificationId).toBeTruthy();
    expect(result.sentRecipients).toHaveLength(3);
    expect(result.sentRecipients[0]).toMatchObject({
      userId: 'SR-0001',
      userName: '営業太郎',
      role: 'sales_representative',
      channel: 'email',
      sentAt: expect.any(Date)
    });
    expect(result.sentRecipients[1]).toMatchObject({
      userId: 'SR-0001',
      channel: 'sms'
    });
    expect(result.sentRecipients[2]).toMatchObject({
      userId: 'MGMT-0001',
      userName: '営業部長花子',
      role: 'sales_manager',
      channel: 'email'
    });
    expect(result.failedRecipients).toBeUndefined();
    expect(result.notificationId).toBeTruthy();
  });
});
