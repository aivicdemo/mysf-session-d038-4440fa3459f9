import { notifyDashboardDataFreshnessWarning, FreshnessWarningNotApplicable } from '../../src/logic/notification-service';
import type {
  NotifyDashboardDataFreshnessWarningInput,
} from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1097: notifyDashboardDataFreshnessWarning data is fresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw FreshnessWarningNotApplicable when all data is within freshness threshold', async () => {
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        id: 'sales_manager_001',
        name: '山田太郎',
        role: '営業部長',
        isActive: true,
      },
    ]);

    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue({
      id: 'sales_manager_001',
      enabledChannels: ['email', 'in_app'],
    });

    const input: NotifyDashboardDataFreshnessWarningInput = {
      dashboardDataFreshnessStatus: {
        activityMetricsLastUpdatedAt: new Date('2026-10-07T10:00:00.000Z'),
        dealStageProgressLastUpdatedAt: new Date('2026-10-07T10:05:00.000Z'),
        targetAchievementDifferenceLastUpdatedAt: new Date('2026-10-07T10:10:00.000Z'),
        anomalyDetectionLogLastUpdatedAt: new Date('2026-10-07T10:15:00.000Z'),
        invoiceStatusClassificationLastUpdatedAt: new Date('2026-10-07T10:20:00.000Z'),
        invoiceDelayDetectionLastUpdatedAt: new Date('2026-10-07T10:25:00.000Z'),
        dataflowAnomaliesLastUpdatedAt: new Date('2026-10-07T10:30:00.000Z'),
      },
      currentDateTime: new Date('2026-10-07T10:35:00.000Z'),
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'normal',
    };

    await expect(notifyDashboardDataFreshnessWarning(input)).rejects.toThrow(
      FreshnessWarningNotApplicable
    );

    await expect(notifyDashboardDataFreshnessWarning(input)).rejects.toThrow(
      'ダッシュボードデータは十分な鮮度を保っており、警告通知は不要です。'
    );
  });
});
