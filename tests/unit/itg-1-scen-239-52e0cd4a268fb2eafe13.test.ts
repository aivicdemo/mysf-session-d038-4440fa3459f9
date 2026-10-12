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

describe('SCEN-239: 対象月が指定されていない場合、前月が自動設定されて月次締め対象期間が確定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対象月が空文字列の場合、前月が自動設定される', async () => {
    const mockCustomers = [
      { customerId: 'CUST-001', customerName: '取引先A', isActive: true },
      { customerId: 'CUST-002', customerName: '取引先B', isActive: true },
    ];

    const mockDeals = [
      { dealId: 'DEAL-001', dealName: '商談A', status: '成約済み', closingDate: '2024-12-15', amount: 1000000 },
    ];

    const mockInvoices = [
      { invoiceId: 'INV-001', invoiceDate: '2024-12-20', amount: 1000000, status: '請求済み' },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue(mockCustomers);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(mockDeals);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'STAGE-001', stageName: '成約済み', isActive: true },
    ]);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'RULE-001', ruleName: '商談と請求書の紐付け確認', isActive: true },
    ]);

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'INSTR-20250101-001',
      targetMonth: '',
      operatorUserId: 'USER-SALES-OPERATOR-001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    });

    expect(result.closingPeriod.targetMonth).toBe('2024-12');
    expect(result.readyForExtraction).toBe(true);
    expect(result.extractionScope.customerIds.length).toBeGreaterThan(0);
  });
});
