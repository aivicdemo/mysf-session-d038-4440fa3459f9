import {
  notifyAnomalyDetection,
  type NotifyAnomalyDetectionInput,
} from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-1028: notifyAnomalyDetection - 複数異常の正常入力', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send notifications for multiple anomalies with different severity levels', async () => {
    const anomalies = [
      {
        anomalyType: 'amount_discrepancy' as const,
        targetRecordId: 'deal-001',
        severity: 'critical' as const,
        description: '請求額が実績と一致しない',
        expectedValue: '150000',
        actualValue: '145000',
        affectedDealId: 'deal-001',
        affectedInvoiceId: 'inv-001',
      },
      {
        anomalyType: 'unbilled_deal' as const,
        targetRecordId: 'deal-002',
        severity: 'high' as const,
        description: '商談が請求書に計上されていない',
        affectedDealId: 'deal-002',
      },
      {
        anomalyType: 'status_mismatch' as const,
        targetRecordId: 'inv-002',
        severity: 'medium' as const,
        description: '請求書ステータスが商談ステータスと不整合',
        expectedValue: 'approved',
        actualValue: 'draft',
        affectedInvoiceId: 'inv-002',
      },
    ];

    const input: NotifyAnomalyDetectionInput = {
      anomalies,
      detectionTimestamp: new Date('2026-10-15T10:30:00.000Z'),
      detectionSourceModulePath: 'src/logic/dataflow-anomaly-detection.ts',
      notificationPreference: {
        channels: ['email', 'sms', 'in_app'],
        urgencyLevel: 'immediate',
      },
    };

    const users = [
      {
        userId: 'user-sales-001',
        userName: '営業太郎',
        role: 'sales_rep',
        email: 'taro@company.com',
        phone: '09012345678',
        notificationSettings: { email: true, sms: true, in_app: true },
      },
      {
        userId: 'user-sales-mgr-001',
        userName: '営業部長花子',
        role: 'sales_manager',
        email: 'hanako@company.com',
        phone: '09087654321',
        notificationSettings: { email: true, sms: false, in_app: true },
      },
      {
        userId: 'user-accounting-001',
        userName: '経理次郎',
        role: 'accounting',
        email: 'jiro@company.com',
        phone: '09011223344',
        notificationSettings: { email: true, sms: true, in_app: false },
      },
    ];

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue(users);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue({
      critical: ['sales_rep', 'sales_manager', 'accounting'],
      high: ['sales_manager', 'accounting'],
      medium: ['accounting'],
    });

    const result = await notifyAnomalyDetection(input);

    expect(result.notificationId).toBeDefined();
    expect(result.recipientCount).toBe(5);
    expect(result.sentChannels).toContain('email');
    expect(result.sentChannels).toContain('sms');
    expect(result.sentRecipients).toHaveLength(5);
    expect(result.anomalyCount).toBe(3);
    expect(result.failedRecipients).toEqual([]);

    const sentRecipients = result.sentRecipients;
    expect(sentRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'user-sales-001',
        userName: '営業太郎',
        channel: 'email',
      })
    );
    expect(sentRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'user-sales-001',
        userName: '営業太郎',
        channel: 'sms',
      })
    );
    expect(sentRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'user-sales-mgr-001',
        userName: '営業部長花子',
        channel: 'email',
      })
    );
    const accountingRecipients = sentRecipients.filter((r) => r.userId === 'user-accounting-001');
    expect(accountingRecipients).toHaveLength(3);
    accountingRecipients.forEach((r) => {
      expect(r).toHaveProperty('userId');
      expect(r).toHaveProperty('userName');
      expect(r).toHaveProperty('role');
      expect(r).toHaveProperty('channel');
      expect(r).toHaveProperty('sentAt');
    });
  });
});
