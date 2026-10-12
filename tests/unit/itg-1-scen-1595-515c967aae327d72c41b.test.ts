import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-1595: 請求明細空時、警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対象期間の商談に対応する請求明細がない場合、警告が記録される', async () => {
    const closingInstructionId = 'INSTR-2024-12-001';
    const targetMonth = '2024-12';
    const operatorUserId = 'USR-SALES-OPS-001';
    const executionTimestamp = new Date('2024-12-15T09:00:00Z');

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { id: 'CUST-001', name: 'テスト取引先', isActive: false, type: 'テスト' },
      { id: 'CUST-002', name: '通常取引先', isActive: true, type: '通常' },
    ]);

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      { id: 'DEAL-001', stageName: '成約済み', closeDate: '2024-12-10', amount: 150000 },
    ]);

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([]);

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { id: 'STAGE-001', name: '成約済み', isActive: true },
    ]);

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { id: 'RULE-001', name: '商談と請求の金額一致確認', description: '商談金額と請求合計金額が一致していることを検証' },
    ]);

    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-12-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-12-31'));
    expect(result.extractionScope.exclusionRules).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(executionTimestamp);
  });
});
