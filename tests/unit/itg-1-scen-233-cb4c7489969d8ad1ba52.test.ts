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

describe('SCEN-233: 営業部長の指示IDが有効で対象月が有効な形式で担当者に権限がある場合、月次締め対象期間と抽出範囲・条件を確定してデータ抽出可能な状態になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効な指示ID・対象月・権限がある場合、月次締め準備が完了する', async () => {
    const mockCustomers = [
      { id: 'CUST-001', name: 'A Company Inc.', status: 'active', createdDate: '2024-06-15' },
      { id: 'CUST-002', name: 'B Corporation', status: 'active', createdDate: '2024-08-20' },
      { id: 'CUST-003', name: 'Test Customer', status: 'test', createdDate: '2024-12-01' },
    ];

    const mockDeals = [
      { id: 'DEAL-2025-001', customerId: 'CUST-001', stage: 'Closed Won', amount: 500000, closedDate: '2025-01-15', status: 'closed_won' },
      { id: 'DEAL-2025-002', customerId: 'CUST-002', stage: 'Closed Won', amount: 300000, closedDate: '2025-01-25', status: 'closed_won' },
      { id: 'DEAL-2025-003', customerId: 'CUST-001', stage: 'Closed Lost', amount: 100000, closedDate: '2025-01-10', status: 'closed_lost' },
    ];

    const mockInvoices = [
      { id: 'INV-2025-001', dealId: 'DEAL-2025-001', date: '2025-01-16', amount: 500000, status: 'issued' },
      { id: 'INV-2025-002', dealId: 'DEAL-2025-002', date: '2025-01-26', amount: 300000, status: 'issued' },
    ];

    const mockStages = [
      { stageId: 'STAGE-001', name: 'Prospecting', probability: 10 },
      { stageId: 'STAGE-002', name: 'Qualification', probability: 25 },
      { stageId: 'STAGE-003', name: 'Closed Won', probability: 100 },
      { stageId: 'STAGE-004', name: 'Closed Lost', probability: 0 },
    ];

    const mockRules = [
      { ruleId: 'RULE-001', objectName: 'Deal', description: 'Deals must have status Closed Won to be included in invoicing', isActive: true },
      { ruleId: 'RULE-002', objectName: 'Invoice', description: 'Invoices must have date within target period', isActive: true },
      { ruleId: 'RULE-003', objectName: 'Customer', description: 'Test customers must be excluded from closing', isActive: true },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue(mockCustomers);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(mockDeals);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockStages);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockRules);

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'CI-2025-01-001',
      targetMonth: '2025-01',
      operatorUserId: 'USR-SALES-OPS-001',
      executionTimestamp: new Date('2025-02-01T09:00:00Z'),
    });

    expect(result.readyForExtraction).toBe(true);
    expect(result.closingPeriod.targetMonth).toBe('2025-01');
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2025-01-01T00:00:00Z'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2025-01-31T23:59:59Z'));

    expect(result.extractionScope.totalCustomerCount).toBeGreaterThan(0);
    expect(result.extractionScope.totalDealCount).toBeGreaterThan(0);
    expect(result.extractionScope.totalInvoiceCount).toBeGreaterThan(0);

    expect(result.extractionCriteria.dealStageFilter.length).toBeGreaterThan(0);
    expect(result.extractionCriteria.customerStatusFilter.length).toBeGreaterThan(0);
    expect(result.preparationCompletedAt).toEqual(new Date('2025-02-01T09:00:00Z'));
  });
});
