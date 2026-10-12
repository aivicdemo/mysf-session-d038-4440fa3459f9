import { notifyAnomalyDetection } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-1035: notifyAnomalyDetection - 送信成功と失敗の混在', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('通知送信に成功した対象者と失敗した対象者が混在するとき、sentRecipients に成功者、failedRecipients に失敗者が記録される', async () => {
    const anomalies = [
      {
        anomalyType: 'amount_discrepancy' as const,
        targetRecordId: 'deal-001',
        severity: 'high' as const,
        description: '請求額が見積額と一致しません',
        expectedValue: '100000',
        actualValue: '95000',
        affectedDealId: 'deal-001',
      },
      {
        anomalyType: 'unbilled_deal' as const,
        targetRecordId: 'deal-002',
        severity: 'critical' as const,
        description: '取引先責任者との合意後30日以上請求されていません',
        affectedDealId: 'deal-002',
      },
    ];

    const detectionTimestamp = new Date('2026-10-07T10:30:00.000Z');
    const detectionSourceModulePath = 'src/logic/dataflow-anomaly-detection.ts';
    const notificationPreference = {
      channels: ['email' as const, 'sms' as const],
      urgencyLevel: 'immediate' as const,
    };

    const mockUsers = [
      {
        userId: 'user-sales-01',
        userName: '営業太郎',
        role: '営業担当者',
        email: 'sales-taro@company.com',
        phone: '09012345678',
        notificationEnabled: true,
      },
      {
        userId: 'user-sales-02',
        userName: '営業花子',
        role: '営業担当者',
        email: 'sales-hanako@company.com',
        phone: null,
        notificationEnabled: true,
      },
      {
        userId: 'user-mgr-01',
        userName: '営業部長次郎',
        role: '営業部長',
        email: 'manager-jiro@company.com',
        phone: '09087654321',
        notificationEnabled: true,
      },
      {
        userId: 'user-acct-01',
        userName: '経理三郎',
        role: '経理部門',
        email: 'accounting-saburo@company.com',
        phone: '09011112222',
        notificationEnabled: false,
      },
    ];

    const mockPermissions: Record<string, Record<string, boolean>> = {
      'user-sales-01': { email: true, sms: true },
      'user-sales-02': { email: true, sms: false },
      'user-mgr-01': { email: true, sms: true },
      'user-acct-01': { email: true, sms: false },
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
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-sales-01', userName: '営業太郎', role: '営業担当者', channel: 'email' })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-sales-01', userName: '営業太郎', role: '営業担当者', channel: 'sms' })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-sales-02', userName: '営業花子', role: '営業担当者', channel: 'email' })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-mgr-01', userName: '営業部長次郎', role: '営業部長', channel: 'email' })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-mgr-01', userName: '営業部長次郎', role: '営業部長', channel: 'sms' })
    );
    expect(result.failedRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-sales-02', userName: '営業花子', reason: expect.any(String) })
    );
    expect(result.failedRecipients).toContainEqual(
      expect.objectContaining({ userId: 'user-acct-01', userName: '経理三郎', reason: expect.any(String) })
    );
    expect(result.anomalyCount).toBe(2);
  });
});
