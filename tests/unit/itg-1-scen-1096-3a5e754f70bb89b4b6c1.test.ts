import { notifyDashboardDataFreshnessWarning } from '../../src/logic/notification-service';
import type {
  NotifyDashboardDataFreshnessWarningInput,
} from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1096: notifyDashboardDataFreshnessWarning success case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send notification to sales manager on all channels when data is stale', async () => {
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        id: 'sales_manager_001',
        name: '山田太郎',
        role: '営業部長',
        valid: true,
      },
    ]);

    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue({
      id: 'sales_manager_001',
      enabledChannels: ['email', 'sms', 'in_app'],
    });

    const input: NotifyDashboardDataFreshnessWarningInput = {
      dashboardDataFreshnessStatus: {
        activityMetricsLastUpdatedAt: new Date('2025-01-15T08:00:00Z'),
        dealStageProgressLastUpdatedAt: new Date('2025-01-15T07:30:00Z'),
        targetAchievementDifferenceLastUpdatedAt: new Date('2025-01-14T18:00:00Z'),
        anomalyDetectionLogLastUpdatedAt: new Date('2025-01-15T09:00:00Z'),
        invoiceStatusClassificationLastUpdatedAt: new Date('2025-01-14T16:00:00Z'),
        invoiceDelayDetectionLastUpdatedAt: new Date('2025-01-15T08:30:00Z'),
        dataflowAnomaliesLastUpdatedAt: new Date('2025-01-13T10:00:00Z'),
      },
      currentDateTime: new Date('2025-01-15T10:00:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'high',
    };

    const result = await notifyDashboardDataFreshnessWarning(input);

    expect(result).toBeDefined();
    expect(result.notificationId).toBeDefined();
    expect(result.salesManagerUserId).toBe('sales_manager_001');
    expect(result.salesManagerName).toBe('山田太郎');
    expect(result.sentAt).toEqual(new Date('2025-01-15T10:00:00Z'));

    expect(result.sentChannels.length).toBe(3);
    expect(result.sentChannels).toContain('email');
    expect(result.sentChannels).toContain('sms');
    expect(result.sentChannels).toContain('in_app');

    expect(result.freshnessWarningDetails.staleDataTypes).toContain('dataflowAnomalies');
    expect(result.freshnessWarningDetails.staleDataTypes).toContain('targetAchievementDifference');
    expect(result.freshnessWarningDetails.staleDataTypes).toContain('invoiceStatusClassification');

    expect(result.freshnessWarningDetails.maxStalenessMinutes).toBe(2880);

    expect(result.failedChannels).toBeUndefined();
  });
});
