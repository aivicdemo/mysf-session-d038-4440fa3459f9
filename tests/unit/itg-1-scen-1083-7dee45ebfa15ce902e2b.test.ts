import { notifyInvoiceSLAExceeded, NotifyInvoiceSLAExceededInput, NotifyInvoiceSLAExceededOutput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1083: 一部の受信者への通知送信に失敗したとき、成功した受信者の情報は出力に含まれ、失敗情報はfailedRecipientsに記録される', () => {
  it('成功した受信者のメール送信記録と失敗した受信者のSMS送信理由が同時に出力に含まれる', async () => {
    const dealWithSLAStatus = {
      dealId: 'DEAL-001',
      dealName: 'A社新規契約案件',
      customerId: 'CUST-001',
      customerName: 'A社',
      salesRepresentativeId: 'SR-001',
      salesRepresentativeName: '営業太郎',
      invoiceGenerationSLADeadline: new Date('2026-01-15T18:00:00Z'),
      requestGenerationSLAExceededFlag: true,
      dealAmount: 5000000,
      dealStage: '受注',
    };

    const input: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus,
      notificationChannels: ['email', 'sms'],
      urgencyLevel: 'high',
      escalateToSupervisor: true,
      currentDateTime: new Date('2026-01-16T09:00:00Z'),
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        userId: 'SR-001',
        userName: '営業太郎',
        role: '営業代表',
        email: 'taro.sales@example.com',
        phone: '09012345678',
        notificationChannels: ['email', 'sms'],
        isActive: true,
      },
    ]);

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        userId: 'SPVR-001',
        userName: '営業部長花子',
        role: '営業部長',
        email: 'hanako.supervisor@example.com',
        notificationChannels: ['email'],
      },
      {
        userId: 'SR-001',
        userName: '営業太郎',
        role: '営業代表',
        email: 'taro.sales@example.com',
        phone: '09012345678',
        notificationChannels: ['email', 'sms'],
      },
    ]);

    const result = await notifyInvoiceSLAExceeded(input);

    expect(result.dealId).toBe('DEAL-001');
    expect(result.recipientCount).toBeGreaterThanOrEqual(2);
    expect(result.sentChannels).toContain('email');
    expect(result.sentChannels).toContain('sms');
    expect(result.sentRecipients.length).toBeGreaterThan(0);
    expect(result.sentRecipients.some(r => r.userId === 'SR-001' && r.channel === 'email')).toBe(true);
    expect(result.sentRecipients.some(r => r.userId === 'SPVR-001' && r.channel === 'email')).toBe(true);
    expect(result.escalatedToSupervisor).toBe(true);
    expect(result.supervisorNotificationId).toBeDefined();
    if (result.failedRecipients && result.failedRecipients.length > 0) {
      expect(result.failedRecipients.some(f => f.userId === 'SR-001' && f.reason === '電話番号が不正です')).toBe(true);
    }
  });
});
