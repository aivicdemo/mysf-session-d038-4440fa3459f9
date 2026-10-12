import { prepareMonthlyClosing, ExtractionCriteriaDefinitionFailed } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1617: 商談ステータスが定義済値以外でエラー発生し検証中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should raise ExtractionCriteriaDefinitionFailed when deal status is undefined', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'CUST-001', customerName: 'ABC商事' },
        { customerId: 'CUST-002', customerName: 'XYZ企業' }
      ]
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          dealName: '案件A',
          status: '成約済み',
          dealDate: '2024-01-10T00:00:00Z'
        },
        {
          dealId: 'DEAL-002',
          dealName: '案件B',
          status: '不正なステータス',
          dealDate: '2024-01-15T00:00:00Z'
        }
      ]
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          amount: 1000000,
          invoiceDate: '2024-01-12T00:00:00Z',
          status: '発行済み'
        }
      ]
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'STAGE-001', stageName: '初期接触' },
        { stageId: 'STAGE-002', stageName: '提案中' },
        { stageId: 'STAGE-003', stageName: '成約済み' }
      ]
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: [
        { ruleId: 'RULE-001', ruleName: '商談ステータス検証' },
        { ruleId: 'RULE-002', ruleName: '金額範囲検証' }
      ]
    });

    const result = prepareMonthlyClosing({
      closingInstructionId: 'INSTR-20240115-001',
      targetMonth: '2024-01',
      operatorUserId: 'USR-SALES-SYS-002',
      executionTimestamp: new Date('2024-01-16T09:00:00Z')
    });

    await expect(result).rejects.toThrow(ExtractionCriteriaDefinitionFailed);
  });
});
