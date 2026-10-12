import { escalateResponseSLAExceeded, NotificationSendFailure, EscalateResponseSLAExceededInput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1092: 通知送信処理が失敗した場合、NotificationSendFailureエラーを返し、failedRecipientsに記録', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('email チャネルでの送信は成功、sms チャネルでの送信は失敗する場合、NotificationSendFailure エラーを返す', async () => {
    // Mock fetchAllSalesRepresentatives to return supervisor information
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        salesRepresentativeId: 'SR-12345',
        supervisorId: 'SUP-001',
        supervisorName: '佐藤花子',
        supervisorEmail: 'satoh.hanako@company.com',
        supervisorPhone: '09012345678',
        role: '営業部長',
      },
    ]);

    const input: EscalateResponseSLAExceededInput = {
      inquiryId: 'INQ-20240115-001',
      inquiryContent: '大量注文の納期短縮について相談したい',
      salesRepresentativeId: 'SR-12345',
      salesRepresentativeName: '山田太郎',
      inquiryReceivedDateTime: new Date('2024-01-15T09:00:00Z'),
      slaDeadlineDateTime: new Date('2024-01-15T13:00:00Z'),
      currentDateTime: new Date('2024-01-15T14:30:00Z'),
      notificationChannels: ['email', 'sms'],
      urgencyLevel: 'immediate',
    };

    // The function is expected to throw NotificationSendFailure when notification delivery partially fails
    // In this test, email succeeds but sms fails
    let error: unknown;
    try {
      await escalateResponseSLAExceeded(input);
      throw new Error('Expected NotificationSendFailure to be thrown');
    } catch (e) {
      error = e;
    }

    // Verify the error is NotificationSendFailure
    expect(error).toBeInstanceOf(NotificationSendFailure);

    // Verify failedRecipients contains the failed SMS notification for supervisor SUP-001
    if (error instanceof Error && 'failedRecipients' in error) {
      expect((error as any).failedRecipients).toEqual([
        {
          supervisorId: 'SUP-001',
          supervisorName: '佐藤花子',
          reason: 'SMS送信ゲートウェイの接続タイムアウト',
        },
      ]);

      // Verify sentRecipients contains the successful email notification
      expect((error as any).sentRecipients).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            supervisorId: 'SUP-001',
            supervisorName: '佐藤花子',
            channel: 'email',
            sentAt: input.currentDateTime,
          }),
        ])
      );

      // Verify sentChannels contains only 'email', not 'sms'
      expect((error as any).sentChannels).toEqual(['email']);
    }
  });
});
