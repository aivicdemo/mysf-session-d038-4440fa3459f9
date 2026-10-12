import { notifyAnomalyDetection } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-1036: notifyAnomalyDetection - anomalyCount=1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('異常が1件のとき、anomalyCount に1が記録される', async () => {
    const anomalies = [
      {
        anomalyType: 'amount_discrepancy' as const,
        targetRecordId: 'rec_001',
        severity: 'high' as const,
        description: '請求金額と実績金額の差異',
        expectedValue: '100000',
        actualValue: '95000',
        affectedInvoiceId: 'inv_001',
      },
    ];

    const detectionTimestamp = new Date('2026-10-07T10:30:00.000Z');
    const detectionSourceModulePath = 'src/logic/dataflow-anomaly-detection.ts';
    const notificationPreference = {
      channels: ['email' as const, 'in_app' as const],
      urgencyLevel: 'high' as const,
    };

    const mockUsers = [
      {
        userId: 'user_sales_001',
        userName: '営業太郎',
        role: 'sales_representative',
        email: 'sales_taro@company.jp',
        phone: '09012345678',
        notificationEnabled: true,
      },
      {
        userId: 'user_sales_mgr_001',
        userName: '営業部長花子',
        role: 'sales_manager',
        email: 'mgr_hanako@company.jp',
        phone: '09087654321',
        notificationEnabled: true,
      },
      {
        userId: 'user_accounting_001',
        userName: '経理次郎',
        role: 'accounting',
        email: 'accounting_jiro@company.jp',
        phone: '09011223344',
        notificationEnabled: true,
      },
    ];

    const mockPermissions: Record<string, Record<string, boolean>> = {
      user_sales_001: { email: true, in_app: true },
      user_sales_mgr_001: { email: true, in_app: true },
      user_accounting_001: { email: true, in_app: true },
    };

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue(mockUsers);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

    const result = await notifyAnomalyDetection({
      anomalies,
      detectionTimestamp,
      detectionSourceModulePath,
      notificationPreference,
    });

    expect(result.anomalyCount).toBe(1);
    expect(result.notificationId).toBeDefined();
    expect(result.recipientCount).toBe(3);
    expect(result.sentChannels).toEqual(['email', 'in_app']);
    expect(result.sentRecipients.length).toBeGreaterThanOrEqual(3);
    expect(result.failedRecipients).toEqual([]);
  });
});
