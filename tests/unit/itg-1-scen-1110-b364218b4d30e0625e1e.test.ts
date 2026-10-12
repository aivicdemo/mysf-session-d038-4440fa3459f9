import { notifyDashboardDataIntegrityWarning } from '../../src/logic/notification-service';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/data-persistence.ts');
jest.mock('../../src/platform/data-store');

const mockDataPersistence = require('../../src/logic/data-persistence.ts');

describe('SCEN-1110: Single channel notification (email)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send notification via email channel when only email is specified', async () => {
    const integrityWarningDetails = {
      dataInconsistencies: [
        {
          sourceDataType: 'invoiceStatusClassification' as const,
          inconsistencyType: 'amount_mismatch' as const,
          affectedRecordCount: 3,
          description: '請求金額と売上金額の不一致',
        },
      ],
      missingCriticalData: [],
      overallSeverity: 'high' as const,
    };

    const currentDateTime = new Date('2026-10-07T10:30:00Z');
    const notificationChannels = ['email'] as const;
    const urgencyLevel = 'high' as const;

    const salesManagerUserInfo = [
      {
        userId: 'user-sales-manager-001',
        name: '山田太郎',
        role: 'sales_manager',
        email: 'yamada.taro@company.jp',
        phone: '09012345678',
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
    expect(typeof result.notificationId).toBe('string');
    expect(result.salesManagerUserId).toBe('user-sales-manager-001');
    expect(result.salesManagerName).toBe('山田太郎');
    expect(result.sentChannels).toEqual(['email']);
    expect(result.sentAt).toBeDefined();
    expect(result.integrityWarningDetails).toEqual(integrityWarningDetails);
    expect(result.failedChannels).toBeUndefined();
  });
});
