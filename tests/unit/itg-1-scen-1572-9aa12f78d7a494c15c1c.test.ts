import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as anomalyDetectionLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/anomaly-detection-logging');

describe('SCEN-1572: 検出された金額ズレ・未請求・ステータス不整合が異常検知ログに記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record detected amount discrepancies, unbilled deals, and status mismatches in anomaly detection logs', async () => {
    const closingInstructionId = 'INSTR-2025-01-001';
    const targetMonth = '2025-01';
    const operatorUserId = 'USR-SALES-OPS-001';
    const executionTimestamp = new Date('2025-02-01T09:00:00Z');

    // Mock fetchAllCustomers
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        {
          customerId: 'CUST-001',
          customerName: 'テスト取引先A',
          isActive: true,
          createdDate: '2024-06-15',
        },
        {
          customerId: 'CUST-002',
          customerName: 'テスト取引先B',
          isActive: true,
          createdDate: '2024-06-15',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchDealsForPeriod - includes cancelled deal
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          dealStatus: '成約済み',
          dealAmount: 500000,
          contractDate: '2025-01-15',
          expectedClosingDate: '2025-01-20',
        },
        {
          dealId: 'DEAL-002',
          customerId: 'CUST-001',
          dealStatus: 'キャンセル済み',
          dealAmount: 300000,
          contractDate: '2025-01-10',
          expectedClosingDate: '2025-01-25',
        },
        {
          dealId: 'DEAL-003',
          customerId: 'CUST-002',
          dealStatus: '成約済み',
          dealAmount: 250000,
          contractDate: '2025-01-05',
          expectedClosingDate: '2025-01-28',
        },
      ],
      totalCount: 3,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchInvoicesForPeriod - DEAL-003 has amount discrepancy and unbilled status
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          invoiceAmount: 500000,
          invoiceStatus: '請求済み',
          invoiceDate: '2025-01-20',
          dueDate: '2025-02-20',
        },
        {
          invoiceId: 'INV-002',
          dealId: 'DEAL-003',
          customerId: 'CUST-002',
          invoiceAmount: 200000,
          invoiceStatus: '未請求',
          invoiceDate: null,
          dueDate: null,
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'STAGE-001', stageName: '初期接触', stageOrder: 1 },
        { stageId: 'STAGE-002', stageName: '提案中', stageOrder: 2 },
        { stageId: 'STAGE-003', stageName: '成約済み', stageOrder: 3 },
      ],
      totalCount: 3,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      rules: [
        {
          ruleId: 'RULE-001',
          ruleName: '金額ズレ検出',
          ruleType: 'amount_mismatch',
          threshold: 0,
          isActive: true,
        },
        {
          ruleId: 'RULE-002',
          ruleName: '未請求案件検出',
          ruleType: 'unbilled_deal',
          threshold: null,
          isActive: true,
        },
        {
          ruleId: 'RULE-003',
          ruleName: 'ステータス不整合検出',
          ruleType: 'status_mismatch',
          threshold: null,
          isActive: true,
        },
      ],
      totalCount: 3,
      fetchedAt: new Date().toISOString(),
    });

    // Mock recordAnomalyDetection
    (anomalyDetectionLogging.recordAnomalyDetection as jest.Mock).mockResolvedValue({
      anomalyDetectionLogId: 'ADL-001',
      recordedAt: executionTimestamp,
      status: 'recorded',
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toBeDefined();

    // Verify anomaly detection logging was called for detected issues
    expect(anomalyDetectionLogging.recordAnomalyDetection).toHaveBeenCalled();
  });
});
