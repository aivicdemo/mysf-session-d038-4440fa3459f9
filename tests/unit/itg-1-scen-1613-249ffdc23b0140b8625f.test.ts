import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1613: ステータス不整合1件以上あれば整合性判定が偽で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false for readyForExtraction when status inconsistencies exist', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'CUST-A001', customerName: '顧客A', status: 'active' },
        { customerId: 'CUST-B001', customerName: '顧客B', status: 'inactive' }
      ]
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          dealStatus: 'closed_won',
          closedDate: '2024-01-15T10:00:00Z',
          amount: 500000
        },
        {
          dealId: 'DEAL-002',
          dealStatus: 'closed_won',
          closedDate: '2024-01-20T14:30:00Z',
          amount: 300000
        },
        {
          dealId: 'DEAL-003',
          dealStatus: 'cancelled',
          closedDate: '2024-01-10T09:00:00Z',
          amount: 100000
        }
      ]
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealStatus: 'closed_won',
          invoiceStatus: 'issued',
          invoiceDate: '2024-01-15T10:00:00Z',
          amount: 500000
        },
        {
          invoiceId: 'INV-002',
          dealStatus: 'closed_won',
          invoiceStatus: 'draft',
          invoiceDate: '2024-01-20T14:30:00Z',
          amount: 300000
        },
        {
          invoiceId: 'INV-003',
          dealStatus: 'cancelled',
          invoiceStatus: 'issued',
          invoiceDate: '2024-01-10T09:00:00Z',
          amount: 100000
        }
      ]
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageName: 'closed_won', stageSequence: 5, isActive: true },
        { stageName: 'closed_lost', stageSequence: 6, isActive: true },
        { stageName: 'cancelled', stageSequence: 7, isActive: false }
      ]
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: [
        {
          ruleId: 'RULE-001',
          ruleName: '商談と請求書の金額一致確認',
          ruleDescription: '商談ステータスが成約済みの場合、対応する請求書の合計金額が一致すること',
          isActive: true,
          validationType: 'integrity_check'
        },
        {
          ruleId: 'RULE-002',
          ruleName: '請求書ステータスの整合性確認',
          ruleDescription: '請求書に紐付く商談ステータスがアクティブ（cancelled でない）であること',
          isActive: true,
          validationType: 'status_consistency'
        }
      ]
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'INSTR-20240131-001',
      targetMonth: '2024-01',
      operatorUserId: 'USER-SALES-OPS-001',
      executionTimestamp: new Date('2024-02-05T09:30:00Z')
    });

    expect(result).toBeDefined();
    expect(result.readyForExtraction).toBe(false);
    expect(result.preparationCompletedAt).toEqual(new Date('2024-02-05T09:30:00Z'));
  });
});
