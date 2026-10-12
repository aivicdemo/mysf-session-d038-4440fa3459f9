import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as auditLogging from '../../src/logic/audit-logging';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/audit-logging');

describe('SCEN-1573: 月次締め確認準備の実行操作が監査ログに記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record monthly closing preparation execution in audit logs', async () => {
    const closingInstructionId = 'CI-2024-12-001';
    const targetMonth = '2024-12';
    const operatorUserId = 'USR-001';
    const executionTimestamp = new Date('2024-12-15T09:30:00Z');

    // Mock fetchAllCustomers
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        {
          customerId: 'CUST-A001',
          customerName: '取引先A',
          isActive: true,
          isTestAccount: false,
        },
        {
          customerId: 'CUST-B001',
          customerName: '取引先B',
          isActive: true,
          isTestAccount: false,
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchDealsForPeriod
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-2024-001',
          dealName: '商談A',
          status: '成約済み',
          closingDate: '2024-12-10',
          amount: 1000000,
        },
        {
          dealId: 'DEAL-2024-002',
          dealName: '商談B',
          status: '成約済み',
          closingDate: '2024-12-20',
          amount: 500000,
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchInvoicesForPeriod
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-2024-001',
          invoiceDate: '2024-12-11',
          amount: 1000000,
          dealId: 'DEAL-2024-001',
        },
        {
          invoiceId: 'INV-2024-002',
          invoiceDate: '2024-12-21',
          amount: 500000,
          dealId: 'DEAL-2024-002',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'STAGE-01', stageName: '見込み', isClosingStage: false },
        { stageId: 'STAGE-05', stageName: '成約済み', isClosingStage: true },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      rules: [
        {
          ruleId: 'RULE-001',
          ruleName: '商談と請求書の紐付け確認',
          ruleType: 'dataIntegrity',
        },
        {
          ruleId: 'RULE-002',
          ruleName: '金額一致確認',
          ruleType: 'dataIntegrity',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock recordUserOperation for audit logging
    (auditLogging.recordUserOperation as jest.Mock).mockResolvedValue({
      operationLogId: 'OL-001',
      userId: operatorUserId,
      operationType: 'create',
      targetTableName: 'ClosingPeriod',
      targetRecordId: 'CP-2024-12',
      recordedAt: executionTimestamp,
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    expect(result.closingPeriod.targetMonth).toBe('2024-12');
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-12-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-12-31'));

    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBe(2);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toBeDefined();

    // Verify audit logging was called
    expect(auditLogging.recordUserOperation).toHaveBeenCalled();
  });
});
