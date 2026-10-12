import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1611: ステータス整合性検証で不整合検出時、詳細がリストアップされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list integrity check details when status inconsistencies are detected', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'CUST-001', customerName: '顧客A', isActive: true },
        { customerId: 'CUST-002', customerName: 'テスト顧客', isActive: true }
      ]
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          dealName: '案件A',
          status: '成約済み',
          closeDatePlanned: '2024-11-10',
          invoiceDatePlanned: '2024-11-12',
          customerId: 'CUST-001'
        },
        {
          dealId: 'DEAL-002',
          dealName: '案件B',
          status: 'キャンセル済み',
          closeDatePlanned: '2024-11-05',
          invoiceDatePlanned: '2024-11-08',
          customerId: 'CUST-001'
        },
        {
          dealId: 'DEAL-003',
          dealName: '案件C',
          status: '成約済み',
          closeDatePlanned: '2024-11-20',
          invoiceDatePlanned: '2024-11-22',
          customerId: 'CUST-002'
        }
      ]
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          invoiceDate: '2024-11-12',
          amount: 100000,
          status: '発行済み',
          customerId: 'CUST-001'
        },
        {
          invoiceId: 'INV-002',
          dealId: 'DEAL-003',
          invoiceDate: '2024-11-22',
          amount: 250000,
          status: '発行済み',
          customerId: 'CUST-002'
        }
      ]
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'STAGE-001', stageName: '新規', sequenceOrder: 1, isActive: true },
        { stageId: 'STAGE-005', stageName: '成約済み', sequenceOrder: 5, isActive: true },
        { stageId: 'STAGE-006', stageName: 'キャンセル済み', sequenceOrder: 6, isActive: true }
      ]
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: [
        {
          ruleId: 'RULE-001',
          ruleName: '商談請求書紐付け確認',
          checkType: 'deal_invoice_linkage',
          description: '成約済みの商談に対応する請求書が存在すること',
          isActive: true
        },
        {
          ruleId: 'RULE-002',
          ruleName: '金額一致確認',
          checkType: 'amount_matching',
          description: '商談額と請求書額が一致すること',
          isActive: true
        },
        {
          ruleId: 'RULE-003',
          ruleName: 'ステータス整合性検証',
          checkType: 'status_consistency',
          description: '商談ステータスと請求書発行状況の整合性確認',
          isActive: true
        }
      ]
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'INSTR-2024-11-001',
      targetMonth: '2024-11',
      operatorUserId: 'USER-SALES-OPS-001',
      executionTimestamp: new Date('2024-11-15T10:30:00Z')
    });

    expect(result).toBeDefined();
    expect(result.readyForExtraction).toBe(false);
    expect(result.preparationCompletedAt).toEqual(new Date('2024-11-15T10:30:00Z'));
    expect(result.extractionScope.dataIntegrityCheckpoints.length).toBeGreaterThan(0);
    expect(result.extractionScope.exclusionRules).toContainEqual(
      expect.stringContaining('キャンセル済み')
    );
  });
});
