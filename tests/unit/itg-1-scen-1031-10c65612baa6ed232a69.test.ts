import { notifyAnomalyDetection, NotificationChannelUnavailable, NotifyAnomalyDetectionInput } from '../../src/logic/notification-service';
import * as dataStore from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-1031: NotificationChannelUnavailable エラーが発生するテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('選択された通知チャネルが利用不可、または対象者がそのチャネルを有効にしていないとき、NotificationChannelUnavailable エラーが発生する', async () => {
    const input: NotifyAnomalyDetectionInput = {
      anomalies: [
        {
          anomalyType: 'amount_discrepancy',
          targetRecordId: 'deal-001',
          severity: 'critical',
          description: '請求金額が見積金額と不一致',
          expectedValue: '1000000',
          actualValue: '950000',
          affectedDealId: 'deal-001',
          affectedInvoiceId: 'inv-001',
        },
      ],
      detectionTimestamp: new Date('2026-10-07T10:30:00Z'),
      detectionSourceModulePath: 'src/logic/dataflow-anomaly-detection.ts',
      notificationPreference: {
        channels: ['email', 'sms'],
        urgencyLevel: 'immediate',
      },
    };

    const mockUsers = [
      {
        userId: 'user-sales-001',
        userName: '営業太郎',
        role: 'sales_representative',
        email: 'sales-taro@company.com',
        phone: '+81-90-1234-5678',
      },
      {
        userId: 'user-manager-001',
        userName: '営業部長花子',
        role: 'sales_manager',
        email: 'manager-hanako@company.com',
        phone: '+81-90-9876-5432',
      },
      {
        userId: 'user-accounting-001',
        userName: '経理次郎',
        role: 'accounting_department',
        email: 'accounting-jiro@company.com',
        phone: '+81-90-5555-6666',
      },
    ];

    const channelAvailability = {
      'user-sales-001': { email: true, sms: false, in_app: true },
      'user-manager-001': { email: false, sms: true, in_app: true },
      'user-accounting-001': { email: true, sms: true, in_app: true },
    };

    (dataStore.fetchAllUsers as jest.Mock).mockResolvedValue(mockUsers);
    (dataStore.fetchUserPermissions as jest.Mock).mockResolvedValue(channelAvailability);

    await expect(notifyAnomalyDetection(input)).rejects.toThrow(NotificationChannelUnavailable);
    await expect(notifyAnomalyDetection(input)).rejects.toThrow(
      '選択された通知チャネルが利用できません。別のチャネルで通知を送信するか、対象者の通知設定を確認してください。'
    );
  });
});
