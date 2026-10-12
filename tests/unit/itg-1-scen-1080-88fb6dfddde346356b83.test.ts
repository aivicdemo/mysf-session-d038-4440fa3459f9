import { notifyInvoiceSLAExceeded, NoSalesRepresentativeFound, NotifyInvoiceSLAExceededInput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1080: 通知対象の営業担当者が見つからないとき、NoSalesRepresentativeFoundエラーが発生する', () => {
  it('NoSalesRepresentativeFoundエラーが発生し、エラー文言に対象商談IDが含まれる', async () => {
    const dealWithSLAStatus = {
      dealId: 'DEAL-001',
      dealName: '顧客A向けシステム構築',
      customerId: 'CUST-001',
      customerName: '顧客A',
      salesRepresentativeId: 'SR-999',
      salesRepresentativeName: '山田太郎',
      invoiceGenerationSLADeadline: new Date('2024-12-15T23:59:59Z'),
      requestGenerationSLAExceededFlag: true,
      dealAmount: 5000000,
      dealStage: '契約締結',
    };

    const input: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus,
      notificationChannels: ['email', 'in_app'],
      urgencyLevel: 'high',
      escalateToSupervisor: false,
      currentDateTime: new Date('2024-12-20T10:00:00Z'),
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([]);

    await expect(notifyInvoiceSLAExceeded(input)).rejects.toThrow(NoSalesRepresentativeFound);
    await expect(notifyInvoiceSLAExceeded(input)).rejects.toThrow('DEAL-001');
  });
});
