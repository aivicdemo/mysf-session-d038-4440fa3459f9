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

describe('SCEN-1588: 金額検証結果に不整合詳細リストが含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('不整合詳細リストと除外ルールが extractionScope に含まれる', async () => {
    const closingInstructionId = 'CI-2024-11-001';
    const targetMonth = '2024-11';
    const operatorUserId = 'OP-USR-0001';
    const executionTimestamp = new Date('2024-11-15T09:30:00Z');

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { customerId: 'CUST-001', customerName: '顧客A', isActive: true, isTestAccount: false },
      { customerId: 'CUST-002', customerName: '顧客B', isActive: true, isTestAccount: false },
    ]);

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      { dealId: 'DEAL-001', dealName: '商談X', status: '成約済み', closedDate: '2024-11-10', customerId: 'CUST-001' },
      { dealId: 'DEAL-002', dealName: '商談Y', status: '成約済み', closedDate: '2024-11-12', customerId: 'CUST-002' },
      { dealId: 'DEAL-003', dealName: '商談Z', status: 'キャンセル済み', closedDate: '2024-11-05', customerId: 'CUST-001' },
    ]);

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      { invoiceId: 'INV-001', dealId: 'DEAL-001', invoiceAmount: 100000, invoiceDate: '2024-11-10', status: '未請求' },
      { invoiceId: 'INV-002', dealId: 'DEAL-002', invoiceAmount: 200000, invoiceDate: '2024-11-12', status: '未請求' },
      { invoiceId: 'INV-003', dealId: 'DEAL-003', invoiceAmount: 50000, invoiceDate: '2024-11-05', status: '未請求' },
    ]);

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'STAGE-001', stageName: '初期接触', isActive: true },
      { stageId: 'STAGE-002', stageName: '提案', isActive: true },
      { stageId: 'STAGE-003', stageName: '成約済み', isActive: true },
      { stageId: 'STAGE-004', stageName: 'キャンセル済み', isActive: true },
    ]);

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'RULE-001', ruleName: '金額一致確認', ruleType: '金額検証', isActive: true, description: '商談金額と請求金額が一致することを確認' },
      { ruleId: 'RULE-002', ruleName: '商談・請求紐付け確認', ruleType: '紐付け検証', isActive: true, description: 'すべての請求が対応する商談に紐付いていることを確認' },
    ]);

    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-11-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-11-30'));
    expect(result.extractionScope.extractionObjects).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints.length).toBeGreaterThanOrEqual(2);
    const checkpointNames = result.extractionScope.dataIntegrityCheckpoints.map(c => c.checkpoint);
    expect(checkpointNames).toContain('金額検証');
    expect(checkpointNames).toContain('紐付け確認');
    expect(result.extractionScope.exclusionRules).toBeDefined();
    expect(result.extractionScope.exclusionRules.some(rule => rule.includes('キャンセル済み'))).toBe(true);
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(executionTimestamp);
  });
});
