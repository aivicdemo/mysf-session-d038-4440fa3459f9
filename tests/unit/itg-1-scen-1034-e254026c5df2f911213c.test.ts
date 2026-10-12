import { notifyAnomalyDetection } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-1034: notifyAnomalyDetection - notificationPreference 省略時の自動判定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('notificationPreference が null のとき、severity に基づいて通知チャネルと対象者が自動判定される', async () => {
    const anomalies = [
      {
        anomalyType: 'amount_discrepancy' as const,
        targetRecordId: 'rec-001',
        severity: 'critical' as const,
        description: '請求金額と実績金額が100万円ズレている',
        expectedValue: '5000000',
        actualValue: '4000000',
        affectedInvoiceId: 'inv-2024-001',
      },
    ];

    const detectionTimestamp = new Date('2024-01-15T10:30:00Z');
    const detectionSourceModulePath = 'src/logic/dataflow-anomaly-detection.ts';

    const mockUsers = [
      { userId: 'user-001', userName: '営業太郎', role: '営業担当者', email: 'taro@company.com', phone: '09012345678' },
      { userId: 'user-002', userName: '営業部長花子', role: '営業部長', email: 'hanako@company.com', phone: '09087654321' },
      { userId: 'user-003', userName: '経理次郎', role: '経理部門', email: 'jiro@company.com', phone: '09011111111' },
    ];

    const mockPermissions: Record<string, Record<string, boolean>> = {
      'user-001': { email: true, sms: true, in_app: true },
      'user-002': { email: true, sms: true, in_app: true },
      'user-003': { email: true, sms: true, in_app: true },
    };

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue(mockUsers);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

    const result = await notifyAnomalyDetection({
      anomalies,
      detectionTimestamp,
      detectionSourceModulePath,
      notificationPreference: undefined,
    });

    expect(result.notificationId).toMatch(/^[a-f0-9-]{36}$/);
    expect(result.recipientCount).toBe(3);
    expect(result.sentChannels).toContain('email');
    expect(result.sentChannels).toContain('sms');
    expect(result.sentChannels).toContain('in_app');
    expect(result.sentRecipients.length).toBeGreaterThanOrEqual(3);
    expect(result.sentRecipients.every(r => r.sentAt >= detectionTimestamp)).toBe(true);
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-001', userName: '営業太郎', role: '営業担当者' })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-002', userName: '営業部長花子', role: '営業部長' })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-003', userName: '経理次郎', role: '経理部門' })
    );
    expect(result.failedRecipients).toEqual([]);
    expect(result.anomalyCount).toBe(1);
  });
});
