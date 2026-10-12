import { notifyAnomalyDetection, NotificationSendFailure, NotifyAnomalyDetectionInput } from '../../src/logic/notification-service';
import * as dataStore from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-1032: NotificationSendFailure エラーが発生するテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('外部メールサーバー・SMS提供者・アプリ通知サービスとの通信に失敗したとき、NotificationSendFailure エラーが発生する', async () => {
    const input: NotifyAnomalyDetectionInput = {
      anomalies: [
        {
          anomalyType: 'amount_discrepancy',
          targetRecordId: 'rec_001',
          severity: 'critical',
          description: '請求金額が実績と不一致',
          expectedValue: '500000',
          actualValue: '450000',
          affectedInvoiceId: 'inv_001',
        },
      ],
      detectionTimestamp: new Date('2026-10-07T10:30:00Z'),
      detectionSourceModulePath: 'src/logic/dataflow-anomaly-detection.ts',
      notificationPreference: {
        channels: ['email', 'sms', 'in_app'],
        urgencyLevel: 'immediate',
      },
    };

    const mockUsers = [
      {
        userId: 'user_sales_001',
        userName: '営業太郎',
        role: 'sales_rep',
        email: 'sales_taro@example.com',
        phone: '09012345678',
        notificationChannels: ['email', 'sms', 'in_app'],
      },
      {
        userId: 'user_sales_manager_001',
        userName: '営業部長花子',
        role: 'sales_manager',
        email: 'manager_hanako@example.com',
        phone: '09087654321',
        notificationChannels: ['email', 'in_app'],
      },
      {
        userId: 'user_accounting_001',
        userName: '経理次郎',
        role: 'accounting',
        email: 'accounting_jiro@example.com',
        phone: null,
        notificationChannels: ['email'],
      },
    ];

    const channelAvailability = {
      email: {
        available: false,
        reason: 'SendGrid API接続失敗: Connection timeout',
        errorCode: 'EXTERNAL_SERVICE_UNAVAILABLE',
      },
      sms: {
        available: false,
        reason: 'SMS提供者との通信失敗: Authentication failed',
        errorCode: 'EXTERNAL_SERVICE_UNAVAILABLE',
      },
      in_app: {
        available: false,
        reason: 'アプリ通知サービスとの通信失敗: Service temporarily unavailable',
        errorCode: 'EXTERNAL_SERVICE_UNAVAILABLE',
      },
    };

    (dataStore.fetchAllUsers as jest.Mock).mockResolvedValue(mockUsers);
    (dataStore.fetchUserPermissions as jest.Mock).mockResolvedValue(channelAvailability);

    await expect(notifyAnomalyDetection(input)).rejects.toThrow(NotificationSendFailure);
    await expect(notifyAnomalyDetection(input)).rejects.toThrow(
      '通知の送信に失敗しました。ネットワーク接続と外部サービスの状態を確認してください。'
    );
  });
});
