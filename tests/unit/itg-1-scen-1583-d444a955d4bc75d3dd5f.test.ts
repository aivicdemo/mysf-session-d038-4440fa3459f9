import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1583: 明細全行金額合計とヘッダー合計金額が異なれば不整合検出', () => {
  it('請求ヘッダー合計と明細合計が不一致の場合、readyForExtractionがfalseで返される', async () => {
    const mockCustomers = [
      { customerId: 'C001', name: '取引先A', status: 'Active' },
      { customerId: 'C002', name: '取引先B', status: 'Active' },
    ];
    const mockDeals = [
      { dealId: 'D001', dealAmount: 100000, status: 'Closed Won', closedDate: '2024-12-15' },
      { dealId: 'D002', dealAmount: 50000, status: 'Closed Won', closedDate: '2024-12-20' },
    ];
    const mockInvoices = [
      { invoiceId: 'INV001', totalAmount: 150000, invoiceDate: '2024-12-16', status: 'Issued' },
      { invoiceId: 'INV002', totalAmount: 150000, invoiceDate: '2024-12-21', status: 'Issued' },
    ];
    const mockDealStages = [
      { stageId: 'S001', stageName: 'Closed Won', isFinal: true },
      { stageId: 'S002', stageName: 'Cancelled', isFinal: true },
    ];
    const mockValidationRules = [
      { ruleId: 'R001', ruleName: '金額整合性', description: '請求明細合計とヘッダー合計の一致を確認' },
      { ruleId: 'R002', ruleName: '商談請求紐付け', description: '成約済み商談が請求書に紐付いていることを確認' },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue(mockCustomers);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(mockDeals);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockDealStages);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const input = {
      closingInstructionId: 'INSTR-2024-001',
      targetMonth: '2024-12',
      operatorUserId: 'USER-SALES-OPS-001',
      executionTimestamp: new Date('2025-01-05T10:00:00Z'),
    };

    const result = await prepareMonthlyClosing(input);

    expect(result.readyForExtraction).toBe(false);
    expect(result.closingPeriod.targetMonth).toBe('2024-12');
    expect(result.extractionScope.dataIntegrityCheckpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ checkpoint: expect.any(String), description: expect.any(String) }),
      ]),
    );
    expect(result.preparationCompletedAt).toEqual(new Date('2025-01-05T10:00:00Z'));
  });
});
