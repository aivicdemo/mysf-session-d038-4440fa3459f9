import { prepareMonthlyClosing, ExtractionCriteriaDefinitionFailed } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-238: 抽出条件の定義に失敗した場合、ExtractionCriteriaDefinitionFailedエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検証ルール取得が失敗した場合、ExtractionCriteriaDefinitionFailedエラーが発生する', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { customerId: 'CUST-001', customerName: '取引先A', isActive: true },
    ]);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      { dealId: 'DEAL-001', dealName: '商談A', status: 'Closed Won', closedDate: '2024-12-15' },
    ]);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      { invoiceId: 'INV-001', invoiceDate: '2024-12-20', amount: 100000 },
    ]);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'STAGE-001', stageName: '成約済み', isActive: true },
    ]);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

    await expect(
      prepareMonthlyClosing({
        closingInstructionId: 'CI-2024-12-001',
        targetMonth: '2024-12',
        operatorUserId: 'USR-OPS-001',
        executionTimestamp: new Date('2024-12-10T09:00:00Z'),
      })
    ).rejects.toThrow(ExtractionCriteriaDefinitionFailed);

    try {
      await prepareMonthlyClosing({
        closingInstructionId: 'CI-2024-12-001',
        targetMonth: '2024-12',
        operatorUserId: 'USR-OPS-001',
        executionTimestamp: new Date('2024-12-10T09:00:00Z'),
      });
    } catch (error) {
      if (error instanceof ExtractionCriteriaDefinitionFailed) {
        expect(error.message).toContain('抽出条件の定義に失敗しました。システム管理者に連絡してください。');
      }
    }
  });
});
