import {
  notifyAnomalyDetection,
  NoValidNotificationRecipients,
  type NotifyAnomalyDetectionInput,
} from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-1030: notifyAnomalyDetection - 通知対象者が見つからないエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoValidNotificationRecipients when fetchAllUsers returns empty array', async () => {
    const input: NotifyAnomalyDetectionInput = {
      anomalies: [
        {
          anomalyType: 'amount_discrepancy',
          targetRecordId: 'REC-001',
          severity: 'critical',
          description: '請求金額と実績金額が一致しません',
          expectedValue: '100000',
          actualValue: '95000',
          affectedInvoiceId: 'INV-2025-001',
        },
      ],
      detectionTimestamp: new Date('2025-01-15T10:30:00Z'),
      detectionSourceModulePath: 'src/logic/dataflow-anomaly-detection.ts',
      notificationPreference: {
        channels: ['email', 'sms'],
        urgencyLevel: 'immediate',
      },
    };

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue([]);

    await expect(notifyAnomalyDetection(input)).rejects.toThrow(NoValidNotificationRecipients);
    await expect(notifyAnomalyDetection(input)).rejects.toThrow(
      'この異常に対する通知対象者が見つかりません。権限設定と対象者の連絡先を確認してください。'
    );
  });

  it('should throw NoValidNotificationRecipients when fetchUserPermissions returns empty array', async () => {
    const input: NotifyAnomalyDetectionInput = {
      anomalies: [
        {
          anomalyType: 'amount_discrepancy',
          targetRecordId: 'REC-001',
          severity: 'critical',
          description: '請求金額と実績金額が一致しません',
          expectedValue: '100000',
          actualValue: '95000',
          affectedInvoiceId: 'INV-2025-001',
        },
      ],
      detectionTimestamp: new Date('2025-01-15T10:30:00Z'),
      detectionSourceModulePath: 'src/logic/dataflow-anomaly-detection.ts',
      notificationPreference: {
        channels: ['email', 'sms'],
        urgencyLevel: 'immediate',
      },
    };

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        userId: 'user-001',
        userName: 'User One',
        role: 'sales_rep',
      },
    ]);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue([]);

    await expect(notifyAnomalyDetection(input)).rejects.toThrow(NoValidNotificationRecipients);
    await expect(notifyAnomalyDetection(input)).rejects.toThrow(
      'この異常に対する通知対象者が見つかりません。権限設定と対象者の連絡先を確認してください。'
    );
  });
});
