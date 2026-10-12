import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as anomalyLogging from '../../src/logic/anomaly-detection-logging';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  recordAnomalyDetection: jest.fn(),
}));

jest.mock('../../src/logic/notification-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'),
  notifyIssueResponse: jest.fn(),
}));

describe('SCEN-1574: 異常検知ログ記録後、異常値・未完了案件が営業部システム担当に通知される', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;
  const mockAnomalyLogging = anomalyLogging as jest.Mocked<typeof anomalyLogging>;
  const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetchAllCustomers
    (mockDataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { customerId: 'CUST-001', name: 'ABC Corporation', isActive: true, classification: 'STANDARD' },
      { customerId: 'CUST-002', name: 'XYZ Inc', isActive: true, classification: 'STANDARD' },
    ]);

    // Mock fetchDealsForPeriod
    (mockDataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      {
        dealId: 'DEAL-2024-0001',
        customerId: 'CUST-001',
        status: 'CLOSED_WON',
        amount: 500000,
        invoiceId: 'INV-2024-0001',
      },
      {
        dealId: 'DEAL-2024-0002',
        customerId: 'CUST-002',
        status: 'CLOSED_WON',
        amount: 750000,
        invoiceId: null,
      },
    ]);

    // Mock fetchInvoicesForPeriod
    (mockDataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-2024-0001',
        dealId: 'DEAL-2024-0001',
        customerId: 'CUST-001',
        amount: 500000,
        status: 'ISSUED',
      },
    ]);

    // Mock fetchAllDealStages
    (mockDataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'STAGE-001', stageName: 'CLOSED_WON', isActive: true },
      { stageId: 'STAGE-002', stageName: 'CLOSED_LOST', isActive: true },
      { stageId: 'STAGE-003', stageName: 'IN_PROGRESS', isActive: true },
    ]);

    // Mock fetchAllValidationRules
    (mockDataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'RULE-001', ruleName: 'deal_invoice_matching', description: '商談と請求書の紐付け確認', isActive: true },
      { ruleId: 'RULE-002', ruleName: 'amount_consistency', description: '金額一致確認', isActive: true },
      { ruleId: 'RULE-003', ruleName: 'status_consistency', description: 'ステータス整合性確認', isActive: true },
    ]);

    // Mock recordAnomalyDetection
    (mockAnomalyLogging.recordAnomalyDetection as jest.Mock).mockResolvedValue({
      anomalyId: 'ANOM-2024-001',
      recordedAt: new Date('2024-11-30T10:00:00Z'),
    });

    // Mock notifyIssueResponse
    (mockNotificationService.notifyIssueResponse as jest.Mock).mockResolvedValue({
      notificationId: 'NOTIF-2024-001',
      sentAt: new Date('2024-11-30T10:00:00Z'),
    });
  });

  it('should prepare monthly closing with anomaly detection and notification', async () => {
    const input = {
      closingInstructionId: 'INSTR-2024-001',
      targetMonth: '2024-11',
      operatorUserId: 'USR-SALES-SYSADMIN-001',
      executionTimestamp: new Date('2024-11-30T10:00:00Z'),
    };

    const result = await prepareMonthlyClosing(input);

    // Verify basic structure
    expect(result).toBeDefined();
    expect(result.closingPeriod).toBeDefined();
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionCriteria).toBeDefined();
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(new Date('2024-11-30T10:00:00Z'));

    // Verify closingPeriod
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-11-01T00:00:00Z'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-11-30T23:59:59Z'));

    // Verify extractionScope contains correct data
    expect(result.extractionScope.customerIds).toContain('CUST-001');
    expect(result.extractionScope.customerIds).toContain('CUST-002');
    expect(result.extractionScope.dealIds).toContain('DEAL-2024-0001');
    expect(result.extractionScope.dealIds).toContain('DEAL-2024-0002');
    expect(result.extractionScope.invoiceIds).toContain('INV-2024-0001');

    // Verify extractionCriteria
    expect(result.extractionCriteria.dealStageFilter).toContain('CLOSED_WON');

    // Verify all required data fetch calls
    expect(mockDataPersistence.fetchAllCustomers).toHaveBeenCalled();
    expect(mockDataPersistence.fetchDealsForPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date('2024-11-01T00:00:00Z'),
        endDate: new Date('2024-11-30T23:59:59Z'),
      })
    );
    expect(mockDataPersistence.fetchInvoicesForPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date('2024-11-01T00:00:00Z'),
        endDate: new Date('2024-11-30T23:59:59Z'),
      })
    );
    expect(mockDataPersistence.fetchAllDealStages).toHaveBeenCalled();
    expect(mockDataPersistence.fetchAllValidationRules).toHaveBeenCalled();

    // Verify anomaly detection logging
    expect((mockAnomalyLogging.recordAnomalyDetection as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({
        closingInstructionId: 'INSTR-2024-001',
        operatorUserId: 'USR-SALES-SYSADMIN-001',
        targetMonth: '2024-11',
      })
    );

    // Verify notification to operator
    expect((mockNotificationService.notifyIssueResponse as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'USR-SALES-SYSADMIN-001',
        closingInstructionId: 'INSTR-2024-001',
      })
    );
  });
});
