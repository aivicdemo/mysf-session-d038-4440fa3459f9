import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1586: 金額計算に不整合なければ妥当性判定が真で返される', () => {
  it('商談と請求書の金額が完全に一致する場合、readyForExtractionがtrueで返される', async () => {
    const mockCustomers = [
      { customerId: 'CUST-001', customerName: '取引先A', isActive: true },
      { customerId: 'CUST-002', customerName: '取引先B', isActive: true },
    ];
    const mockDeals = [
      {
        dealId: 'DEAL-001',
        dealName: '案件1',
        status: '成約済み',
        invoiceDate: '2024-12-10',
        amount: 1000000,
      },
      {
        dealId: 'DEAL-002',
        dealName: '案件2',
        status: '成約済み',
        invoiceDate: '2024-12-20',
        amount: 500000,
      },
    ];
    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceDate: '2024-12-10',
        dealId: 'DEAL-001',
        totalAmount: 1000000,
        status: '発行済み',
      },
      {
        invoiceId: 'INV-002',
        invoiceDate: '2024-12-20',
        dealId: 'DEAL-002',
        totalAmount: 500000,
        status: '発行済み',
      },
    ];
    const mockDealStages = [
      { stageId: 'STAGE-01', stageName: '初期接触', sequenceOrder: 1 },
      { stageId: 'STAGE-05', stageName: '成約済み', sequenceOrder: 5 },
    ];
    const mockValidationRules = [
      {
        ruleId: 'RULE-001',
        ruleName: '商談と請求書の金額一致確認',
        checkpointType: '金額整合性',
        isActive: true,
      },
      {
        ruleId: 'RULE-002',
        ruleName: '商談と請求書の紐付け確認',
        checkpointType: '関連性整合性',
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
      operatorUserId: 'USER-OPS-001',
      executionTimestamp: new Date('2024-12-15T10:00:00Z'),
    };

    const result = await prepareMonthlyClosing(input);

    expect(result.readyForExtraction).toBe(true);
    expect(result.closingPeriod.targetMonth).toBe('2024-12');
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-12-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-12-31'));
    expect(result.extractionScope.totalCustomerCount).toBeGreaterThanOrEqual(2);
    expect(result.extractionScope.totalDealCount).toBeGreaterThanOrEqual(2);
    expect(result.extractionScope.totalInvoiceCount).toBeGreaterThanOrEqual(2);
    expect(result.extractionCriteria.dealStageFilter).toContain('成約済み');
    expect(result.extractionScope.dataIntegrityCheckpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          checkpoint: expect.stringContaining('商談と請求書'),
        }),
      ]),
    );
    expect(result.preparationCompletedAt).toEqual(new Date('2024-12-15T10:00:00Z'));
  });
});
