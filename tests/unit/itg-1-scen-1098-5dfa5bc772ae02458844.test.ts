import { notifyDashboardDataFreshnessWarning, SalesManagerNotFound } from '../../src/logic/notification-service';
import type {
  NotifyDashboardDataFreshnessWarningInput,
} from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1098: notifyDashboardDataFreshnessWarning no sales manager found', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SalesManagerNotFound when no sales manager role user exists', async () => {
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([]);

    const input: NotifyDashboardDataFreshnessWarningInput = {
      dashboardDataFreshnessStatus: {
        activityMetricsLastUpdatedAt: new Date('2025-01-10T10:00:00Z'),
        dealStageProgressLastUpdatedAt: new Date('2025-01-10T10:05:00Z'),
        targetAchievementDifferenceLastUpdatedAt: new Date('2025-01-10T10:10:00Z'),
        anomalyDetectionLogLastUpdatedAt: new Date('2025-01-10T10:15:00Z'),
        invoiceStatusClassificationLastUpdatedAt: new Date('2025-01-10T10:20:00Z'),
        invoiceDelayDetectionLastUpdatedAt: new Date('2025-01-10T10:25:00Z'),
        dataflowAnomaliesLastUpdatedAt: new Date('2025-01-10T10:30:00Z'),
      },
      currentDateTime: new Date('2025-01-10T12:00:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'high',
    };

    await expect(notifyDashboardDataFreshnessWarning(input)).rejects.toThrow(
      SalesManagerNotFound
    );

    await expect(notifyDashboardDataFreshnessWarning(input)).rejects.toThrow(
      '営業部長への通知先が確定できません。組織設定を確認してください。'
    );
  });
});
