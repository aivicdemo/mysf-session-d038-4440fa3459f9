import { notifyInvoiceSLAExceeded, NoValidNotificationChannelAvailable, NotifyInvoiceSLAExceededInput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1081: 営業担当者が利用可能な通知チャネルを持たないとき、NoValidNotificationChannelAvailableエラーが発生する', () => {
  it('NoValidNotificationChannelAvailableエラーが発生し、エラー文言に営業担当者IDが含まれる', async () => {
    const dealWithSLAStatus = {
      dealId: 'DEAL-001',
      dealName: 'ABC商事様 システム導入案件',
      customerId: 'CUST-001',
      customerName: 'ABC商事',
      salesRepresentativeId: 'SR-001',
      salesRepresentativeName: '営業太郎',
      invoiceGenerationSLADeadline: new Date('2026-10-15T17:00:00Z'),
      requestGenerationSLAExceededFlag: true,
      dealAmount: 5000000,
      dealStage: '契約済み',
    };

    const input: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus,
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'high',
      escalateToSupervisor: false,
      currentDateTime: new Date('2026-10-16T09:00:00Z'),
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        userId: 'SR-001',
        userName: '営業太郎',
        email: 'taro.sales@company.com',
        phone: '09012345678',
        notificationChannels: [],
        isActive: true,
      },
    ]);

    await expect(notifyInvoiceSLAExceeded(input)).rejects.toThrow(NoValidNotificationChannelAvailable);
    await expect(notifyInvoiceSLAExceeded(input)).rejects.toThrow('SR-001');
  });
});
