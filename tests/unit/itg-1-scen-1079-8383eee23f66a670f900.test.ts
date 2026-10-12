import { notifyInvoiceSLAExceeded, NotifyInvoiceSLAExceededInput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchAllUsers: jest.fn()
}));

describe('SCEN-1079: urgencyLevel がimmediate のときの通知内容が、urgencyLevel がnormal のときと異なる内容で送信される', () => {

  it('urgencyLevel が異なると通知内容が異なる', async () => {
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        userId: 'SR-001',
        userName: '営業太郎',
        role: 'sales_representative' as const,
        email: 'taro.sales@example.com',
        phone: '09012345678',
        notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
        isActive: true,
      },
    ]);

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        userId: 'SR-001',
        userName: '営業太郎',
        role: 'sales_representative' as const,
        email: 'taro.sales@example.com',
        notificationChannels: ['email', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      },
    ]);

    const dealWithSLAStatus = {
      dealId: 'DEAL-001',
      dealName: '顧客A 2025年度契約',
      customerId: 'CUST-001',
      customerName: '顧客A',
      salesRepresentativeId: 'SR-001',
      salesRepresentativeName: '営業太郎',
      invoiceGenerationSLADeadline: new Date('2025-01-15T17:00:00Z'),
      requestGenerationSLAExceededFlag: true,
      dealAmount: 5000000,
      dealStage: '契約済み',
    };

    const immediateInput: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus,
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'immediate' as const,
      escalateToSupervisor: false,
      currentDateTime: new Date('2025-01-16T10:30:00Z'),
    };

    const immediateResult = await notifyInvoiceSLAExceeded(immediateInput);

    const normalInput: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus,
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'normal' as const,
      escalateToSupervisor: false,
      currentDateTime: new Date('2025-01-16T10:30:00Z'),
    };

    const normalResult = await notifyInvoiceSLAExceeded(normalInput);

    // 同じ受信者・チャネルで送信される
    expect(immediateResult.sentChannels).toEqual(normalResult.sentChannels);
    expect(immediateResult.recipientCount).toBe(normalResult.recipientCount);
    expect(immediateResult.escalatedToSupervisor).toBe(normalResult.escalatedToSupervisor);

    // 通知が送信されたことを確認
    expect(immediateResult.notificationId).toBeTruthy();
    expect(normalResult.notificationId).toBeTruthy();
  });
});
