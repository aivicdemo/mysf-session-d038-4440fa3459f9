import {
  notifyDashboardDataFreshnessWarning,
  NotifyDashboardDataFreshnessWarningOutput,
} from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

const { fetchAllUsers, fetchUserPermissions } = require('../../src/logic/data-persistence');

describe('SCEN-1102: 複数データの鮮度不足検出と maxStalenessMinutes 計算', () => {
  it('複数のダッシュボード構成要素のデータが鮮度不足である場合、最も古い更新時刻からの経過分数を計算し、staleDataTypes にすべての鮮度不足データ種別を含めて出力を返す', async () => {
    const mockUsers = [
      {
        userId: 'user-001',
        name: '田中太郎',
        role: '営業部長',
        isActive: true,
      },
    ];

    const mockPermissions = {
      userId: 'user-001',
      channels: ['email', 'sms', 'in_app'],
    };

    fetchAllUsers.mockResolvedValue(mockUsers);
    fetchUserPermissions.mockResolvedValue(mockPermissions);

    const input = {
      dashboardDataFreshnessStatus: {
        activityMetricsLastUpdatedAt: new Date('2025-01-15T08:00:00Z'),
        dealStageProgressLastUpdatedAt: new Date('2025-01-15T07:30:00Z'),
        targetAchievementDifferenceLastUpdatedAt: new Date('2025-01-15T06:00:00Z'),
        anomalyDetectionLogLastUpdatedAt: new Date('2025-01-15T09:00:00Z'),
        invoiceStatusClassificationLastUpdatedAt: new Date('2025-01-15T05:00:00Z'),
        invoiceDelayDetectionLastUpdatedAt: new Date('2025-01-15T08:30:00Z'),
        dataflowAnomaliesLastUpdatedAt: new Date('2025-01-15T07:00:00Z'),
      },
      currentDateTime: new Date('2025-01-15T10:00:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
    };

    const result: NotifyDashboardDataFreshnessWarningOutput =
      await notifyDashboardDataFreshnessWarning(input);

    expect(result.notificationId).toBeDefined();
    expect(result.salesManagerUserId).toBe('user-001');
    expect(result.salesManagerName).toBe('田中太郎');
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);
    expect(result.freshnessWarningDetails.staleDataTypes).toContain(
      'targetAchievementDifference'
    );
    expect(result.freshnessWarningDetails.staleDataTypes).toContain(
      'invoiceStatusClassification'
    );
    expect(result.freshnessWarningDetails.staleDataTypes).toContain(
      'dealStageProgress'
    );
    // 最も古い時刻は invoiceStatusClassificationLastUpdatedAt (2025-01-15T05:00:00Z)
    // currentDateTime (2025-01-15T10:00:00Z) からの経過時間: 300 分
    expect(result.freshnessWarningDetails.maxStalenessMinutes).toBe(300);
    expect(result.failedChannels).toBeUndefined();
  });
});
