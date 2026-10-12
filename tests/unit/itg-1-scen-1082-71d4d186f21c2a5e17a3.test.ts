import { notifyInvoiceSLAExceeded, SLAExceededNotificationFailed, NotifyInvoiceSLAExceededInput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1082: 通知送信処理が失敗したとき、SLAExceededNotificationFailedエラーが発生する', () => {
  it('SLAExceededNotificationFailedエラーが発生し、エラー文言に商談IDと期限が含まれる', async () => {
    const dealWithSLAStatus = {
      dealId: 'DEAL-20250107-001',
      dealName: '顧客A 新規案件',
      customerId: 'CUST-A001',
      customerName: '株式会社A',
      salesRepresentativeId: 'SR-001',
      salesRepresentativeName: '営業太郎',
      invoiceGenerationSLADeadline: new Date('2025-01-07T17:00:00Z'),
      requestGenerationSLAExceededFlag: true,
      dealAmount: 500000,
      dealStage: '商談確定',
    };

    const input: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus,
      notificationChannels: ['email', 'in_app'],
      urgencyLevel: 'high',
      escalateToSupervisor: true,
      currentDateTime: new Date('2025-01-08T09:00:00Z'),
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        userId: 'SR-001',
        userName: '営業太郎',
        email: 'taro@company.com',
        phone: '09012345678',
        notificationChannels: ['email'],
      },
    ]);

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        userId: 'SUPER-001',
        userName: '営業部長花子',
        role: '営業部長',
        email: 'hanako@company.com',
        notificationChannels: ['email'],
      },
    ]);

    // Mock the notification send to fail with timeout error
    const error = new SLAExceededNotificationFailed(
      `請求書生成期限超過の警告通知送信に失敗しました。対象商談ID: DEAL-20250107-001、期限: 2025-01-07T17:00:00Z、エラー詳細: API接続タイムアウト`
    );

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockRejectedValueOnce(error);

    await expect(notifyInvoiceSLAExceeded(input)).rejects.toThrow(SLAExceededNotificationFailed);
    await expect(notifyInvoiceSLAExceeded(input)).rejects.toThrow('DEAL-20250107-001');
    await expect(notifyInvoiceSLAExceeded(input)).rejects.toThrow('2025-01-07T17:00:00Z');
  });
});
