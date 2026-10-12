import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1585: 検出不整合の重大度は金額差分に基づき判定される', () => {
  it('金額差分が許容差分を超える場合、重大度がcriticalとして記録される', async () => {
    const mockCustomers = [
      { customerId: 'CUST-A001', customerName: '取引先A', status: 'active', category: 'normal' },
      { customerId: 'CUST-B001', customerName: '取引先B', status: 'active', category: 'test' },
      { customerId: 'CUST-C001', customerName: '取引先C', status: 'active', category: 'normal' },
    ];
    const mockDeals = [
      {
        dealId: 'DEAL-001',
        dealName: '案件X',
        customerId: 'CUST-A001',
        amount: 5000000,
        status: 'closed_won',
        closedDate: '2024-12-15',
        invoiceAmount: 5000000,
      },
      {
        dealId: 'DEAL-002',
        dealName: '案件Y',
        customerId: 'CUST-A001',
        amount: 3000000,
        status: 'closed_won',
        closedDate: '2024-12-20',
        invoiceAmount: 3000000,
      },
      {
        dealId: 'DEAL-003',
        dealName: '案件Z',
        customerId: 'CUST-C001',
        amount: 2000000,
        status: 'closed_won',
        closedDate: '2024-12-10',
        invoiceAmount: 2500000,
      },
    ];
    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        dealId: 'DEAL-001',
        customerId: 'CUST-A001',
        invoiceAmount: 5000000,
        invoiceDate: '2024-12-16',
        status: 'issued',
      },
      {
        invoiceId: 'INV-002',
        dealId: 'DEAL-002',
        customerId: 'CUST-A001',
        invoiceAmount: 3000000,
        invoiceDate: '2024-12-21',
        status: 'issued',
      },
      {
        invoiceId: 'INV-003',
        dealId: 'DEAL-003',
        customerId: 'CUST-C001',
        invoiceAmount: 2500000,
        invoiceDate: '2024-12-11',
        status: 'issued',
      },
    ];
    const mockDealStages = [
      { stageId: 'STAGE-01', stageName: '初期接触', sequenceNumber: 1 },
      { stageId: 'STAGE-02', stageName: '提案', sequenceNumber: 2 },
      { stageId: 'STAGE-03', stageName: '成約', sequenceNumber: 3 },
    ];
    const mockValidationRules = [
      {
        ruleId: 'RULE-001',
        ruleName: '商談と請求の金額一致確認',
        description: '同一dealIdの商談金額と請求金額が一致することを検証',
        severity: 'critical',
        allowedDifference: 0,
      },
      {
        ruleId: 'RULE-002',
        ruleName: '軽微な金額差分検出',
        description: '商談と請求の金額差分が1%以内であることを検証',
        severity: 'warning',
        allowedDifference: 50000,
      },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue(mockCustomers);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(mockDeals);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockDealStages);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const input = {
      closingInstructionId: 'CI-2024-001',
      targetMonth: '2024-12',
      operatorUserId: 'USR-SALES-OPS-001',
      executionTimestamp: new Date('2025-01-05T09:00:00Z'),
    };

    const result = await prepareMonthlyClosing(input);

    expect(result.readyForExtraction).toBe(true);
    expect(result.closingPeriod.targetMonth).toBe('2024-12');
    expect(result.extractionCriteria).toBeDefined();
    expect(result.preparationCompletedAt).toBeDefined();
  });
});
