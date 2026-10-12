import { notifyInvoiceSLAExceeded, NoValidNotificationChannelAvailable, NotifyInvoiceSLAExceededInput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1084: 通知チャネルが空配列のとき、NoValidNotificationChannelAvailableエラーが発生する', () => {
  it('NoValidNotificationChannelAvailableエラーが発生し、エラー文言に営業担当者IDが含まれる', async () => {
    const dealWithSLAStatus = {
      dealId: 'DEAL-2024-001',
      dealName: 'A社 システム導入プロジェクト',
      customerId: 'CUST-001',
      customerName: 'A社',
      salesRepresentativeId: 'SR-100',
      salesRepresentativeName: '営業太郎',
      invoiceGenerationSLADeadline: new Date('2024-12-20T17:00:00Z'),
      requestGenerationSLAExceededFlag: true,
      dealAmount: 5000000,
      dealStage: '契約締結',
    };

    const input: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus,
      notificationChannels: [],
      urgencyLevel: 'high',
      escalateToSupervisor: false,
      currentDateTime: new Date('2024-12-21T10:00:00Z'),
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        userId: 'SR-100',
        userName: '営業太郎',
        role: '営業担当者',
        email: 'taro.sales@company.jp',
        phone: '09012345678',
        notificationChannels: [],
      },
    ]);

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        userId: 'MGR-001',
        userName: '営業部長花子',
        role: '営業部長',
        email: 'hanako.manager@company.jp',
        notificationChannels: ['email'],
      },
    ]);

    await expect(notifyInvoiceSLAExceeded(input)).rejects.toThrow(NoValidNotificationChannelAvailable);
    await expect(notifyInvoiceSLAExceeded(input)).rejects.toThrow('SR-100');
  });
});
