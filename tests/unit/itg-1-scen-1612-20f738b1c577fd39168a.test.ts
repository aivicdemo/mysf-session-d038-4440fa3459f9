import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1612: ステータス不整合なければ整合性判定が真で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for readyForExtraction when no status inconsistencies exist', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'CUST-001', name: 'A商事', isActive: true },
        { customerId: 'CUST-002', name: 'B工業', isActive: true }
      ]
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          status: '成約済み',
          closedDate: '2024-12-15',
          amount: 1000000
        },
        {
          dealId: 'DEAL-002',
          status: '成約済み',
          closedDate: '2024-12-20',
          amount: 500000
        }
      ]
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          invoiceDate: '2024-12-15',
          amount: 1000000,
          status: '請求済み'
        },
        {
          invoiceId: 'INV-002',
          dealId: 'DEAL-002',
          invoiceDate: '2024-12-20',
          amount: 500000,
          status: '請求済み'
        }
      ]
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'STAGE-001', stageName: '初期接触' },
        { stageId: 'STAGE-002', stageName: '成約済み' }
      ]
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: [
        {
          ruleId: 'VAL-001',
          ruleName: 'ステータス整合性チェック',
          description: '商談ステータスと請求ステータスの整合性を確認'
        },
        {
          ruleId: 'VAL-002',
          ruleName: '金額一致チェック',
          description: '商談金額と請求金額の一致を確認'
        }
      ]
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'CI-2024-12-001',
      targetMonth: '2024-12',
      operatorUserId: 'USR-SALES-SYS-001',
      executionTimestamp: new Date('2024-12-20T10:00:00Z')
    });

    expect(result).toBeDefined();
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(new Date('2024-12-20T10:00:00Z'));
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-12-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-12-31'));
    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBe(2);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);
  });
});
