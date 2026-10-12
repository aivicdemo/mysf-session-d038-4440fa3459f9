import { notifyAnomalyDetection, InvalidAnomalyInput, TargetRecordNotFound, SalesRepresentativeNotFound } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-1033: notifyAnomalyDetection - urgencyLevel に基づく通知チャネルと対象者の選択', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('urgencyLevel=immediate のとき、指定チャネル（email、sms）を優先し、対象者と異常内容に基づいて通知が送信される', async () => {
    const anomalies = [
      {
        anomalyType: 'amount_discrepancy' as const,
        targetRecordId: 'REC-001',
        severity: 'critical' as const,
        description: '請求金額と実績金額の不一致',
        expectedValue: '1000000',
        actualValue: '950000',
        affectedInvoiceId: 'INV-2024-001',
      },
    ];

    const detectionTimestamp = new Date('2024-01-15T10:30:00Z');
    const detectionSourceModulePath = 'src/logic/dataflow-anomaly-detection.ts';
    const notificationPreference = {
      channels: ['email' as const, 'sms' as const],
      urgencyLevel: 'immediate' as const,
    };

    const mockUsers = [
      { userId: 'USR-001', userName: '田中太郎', role: '営業担当者', email: 'tanaka@company.com', phone: '09012345678' },
      { userId: 'USR-002', userName: '佐藤部長', role: '営業部長', email: 'sato@company.com', phone: '09087654321' },
      { userId: 'USR-003', userName: '経理太郎', role: '経理部門', email: 'keiri@company.com', phone: '09098765432' },
    ];

    const mockPermissions = {
      'USR-001': { email: true, sms: true, in_app: true },
      'USR-002': { email: true, sms: true, in_app: true },
      'USR-003': { email: true, sms: false, in_app: true },
    };

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue(mockUsers);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

    const result = await notifyAnomalyDetection({
      anomalies,
      detectionTimestamp,
      detectionSourceModulePath,
      notificationPreference,
    });

    expect(result.notificationId).toBeDefined();
    expect(result.recipientCount).toBe(3);
    expect(result.sentChannels).toEqual(['email', 'sms']);
    expect(result.anomalyCount).toBe(1);
    expect(result.sentRecipients).toHaveLength(5);
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'USR-001', userName: '田中太郎', role: '営業担当者', channel: 'email' })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'USR-001', userName: '田中太郎', role: '営業担当者', channel: 'sms' })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'USR-002', userName: '佐藤部長', role: '営業部長', channel: 'email' })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'USR-002', userName: '佐藤部長', role: '営業部長', channel: 'sms' })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'USR-003', userName: '経理太郎', role: '経理部門', channel: 'email' })
    );
    expect(result.failedRecipients).toEqual([]);
    expect(result.sentRecipients.every(r => r.sentAt >= detectionTimestamp)).toBe(true);
  });
});
