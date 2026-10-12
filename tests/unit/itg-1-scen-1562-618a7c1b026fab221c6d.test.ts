import { prepareMonthlyClosing, ExtractionScopeDefinitionFailed } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1562: 有効オブジェクトなしでエラーが発生し処理中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ExtractionScopeDefinitionFailed error when no valid objects exist', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [],
      totalCount: 0,
      fetchedAt: '2024-01-31T09:00:00Z',
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [],
      totalCount: 0,
      fetchedAt: '2024-01-31T09:00:00Z',
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [],
      totalCount: 0,
      fetchedAt: '2024-01-31T09:00:00Z',
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [],
      totalCount: 0,
      fetchedAt: '2024-01-31T09:00:00Z',
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: [],
      totalCount: 0,
      fetchedAt: '2024-01-31T09:00:00Z',
    });

    await expect(
      prepareMonthlyClosing({
        closingInstructionId: 'INSTR-20240115-001',
        targetMonth: '2024-01',
        operatorUserId: 'USR-SALES-OPS-001',
        executionTimestamp: new Date('2024-01-31T09:00:00Z'),
      })
    ).rejects.toThrow(ExtractionScopeDefinitionFailed);
  });
});
