import { notifyDashboardDataIntegrityWarning } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence.ts');

const mockDataPersistence = require('../../src/logic/data-persistence.ts');

describe('SCEN-1111: All channels notification (email, sms, in_app)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send notification via all channels when email, sms, in_app are specified', async () => {
    const integrityWarningDetails = {
      dataInconsistencies: [
        {
          sourceDataType: 'activityMetrics' as const,
          inconsistencyType: 'missing_records' as const,
          affectedRecordCount: 5,
          description: '営業活動記録が同期されていません',
        },
        {
          sourceDataType: 'invoiceStatusClassification' as const,
          inconsistencyType: 'amount_mismatch' as const,
          affectedRecordCount: 3,
          description: '請求金額が商談金額と一致しません',
        },
      ],
      missingCriticalData: [
        {
          dataType: 'dealStageProgress' as const,
          missingRecordCount: 2,
          description: '商談進捗データが欠落しています',
        },
      ],
      overallSeverity: 'high' as const,
    };

    const currentDateTime = new Date('2026-10-07T10:30:00.000Z');
    const notificationChannels = ['email', 'sms', 'in_app'] as const;
    const urgencyLevel = 'immediate' as const;

    const salesManagerUserInfo = [
      {
        userId: 'sales-manager-001',
        name: '山田太郎',
        role: 'sales_manager',
        email: 'yamada.taro@company.com',
        phoneNumber: '+81-90-1234-5678',
      },
    ];

    mockDataPersistence.fetchAllUsers = jest.fn().mockResolvedValue(salesManagerUserInfo);

    const result = await notifyDashboardDataIntegrityWarning({
      integrityWarningDetails,
      currentDateTime,
      notificationChannels: Array.from(notificationChannels),
      urgencyLevel,
    });

    expect(result.notificationId).toBeTruthy();
    expect(result.salesManagerUserId).toBe('sales-manager-001');
    expect(result.salesManagerName).toBe('山田太郎');
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);
    expect(result.sentAt).toBeDefined();
    expect(result.integrityWarningDetails.dataInconsistencies).toHaveLength(2);
    expect(result.integrityWarningDetails.missingCriticalData).toHaveLength(1);
    expect(result.integrityWarningDetails.overallSeverity).toBe('high');
    expect(result.failedChannels).toBeUndefined();
  });
});
