import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1584: 割引額と税額に差分があれば計算誤り検出', () => {
  it('totalAmount = amount - discount + taxの関係式が成立しない場合、readyForExtractionがfalseで返される', async () => {
    const mockCustomers = [
      { customerId: 'CUST-001', customerName: 'テスト取引先A', customerType: 'active', isTestRecord: false },
      { customerId: 'CUST-002', customerName: 'テスト取引先B', customerType: 'active', isTestRecord: false },
    ];
    const mockDeals = [
      {
        dealId: 'DEAL-001',
        customerId: 'CUST-001',
        dealStatus: '成約済み',
        amount: 1000000,
        contractDate: '2024-12-10',
        discount: 50000,
        tax: 85000,
        isCancelled: false,
      },
      {
        dealId: 'DEAL-002',
        customerId: 'CUST-002',
        dealStatus: '成約済み',
        amount: 2000000,
        contractDate: '2024-12-15',
        discount: 100000,
        tax: 171000,
        isCancelled: false,
      },
    ];
    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        dealId: 'DEAL-001',
        customerId: 'CUST-001',
        invoiceDate: '2024-12-10',
        totalAmount: 1000000,
        discount: 50000,
        tax: 85000,
        invoiceStatus: '発行済み',
      },
      {
        invoiceId: 'INV-002',
        dealId: 'DEAL-002',
        customerId: 'CUST-002',
        invoiceDate: '2024-12-16',
        totalAmount: 2000000,
        discount: 100000,
        tax: 171000,
        invoiceStatus: '発行済み',
      },
    ];
    const mockDealStages = [
      { stageId: 'STAGE-001', stageName: '成約済み', isActive: true },
      { stageId: 'STAGE-002', stageName: 'キャンセル', isActive: true },
    ];
    const mockValidationRules = [
      {
        ruleId: 'RULE-001',
        ruleName: '割引額と税額の合計計算確認',
        ruleType: '計算検証',
        description: 'totalAmount = amount - discount + tax の検証',
        isActive: true,
      },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue(mockCustomers);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(mockDeals);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockDealStages);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const input = {
      closingInstructionId: 'INSTR-2024-001',
      targetMonth: '2024-12',
      operatorUserId: 'USER-SALES-ADMIN-001',
      executionTimestamp: new Date('2025-01-05T09:00:00Z'),
    };

    const result = await prepareMonthlyClosing(input);

    expect(result.readyForExtraction).toBe(false);
    expect(result.extractionScope.dataIntegrityCheckpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          checkpoint: expect.stringContaining('割引額と税額の合計計算確認'),
        }),
      ]),
    );
    expect(result.preparationCompletedAt).toEqual(new Date('2025-01-05T09:00:00Z'));
  });
});
