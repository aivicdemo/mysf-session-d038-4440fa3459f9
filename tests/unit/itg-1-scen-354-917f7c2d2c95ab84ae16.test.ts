import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-354: 商談金額と請求済み金額がともにゼロの場合、請求ステータスが「未請求」と判定される', () => {
  const dealId = 'DEAL-20250107-001';
  const currentDateTime = new Date('2025-01-07T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock: 対象商談の基本情報
    (dataPersistence.fetchDealById as any).mockResolvedValue({
      dealId,
      dealAmount: 0,
      stageId: 'stage-1',
      customerId: 'CUST-001',
      salesRepresentativeId: 'SR-001',
      dealName: 'Test Deal',
      expectedContractDate: '2025-01-05',
      contractedDate: '2025-01-05',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-07T10:00:00Z',
      createdBy: 'USER-001',
    });

    // Mock: 商談に紐付く請求書一覧
    (dataPersistence.fetchInvoicesForPeriod as any).mockResolvedValue({
      invoices: [],
      totalCount: 0,
      fetchedAt: '2025-01-07T10:00:00Z',
    });

    // Mock: 滞納判定の基準日数
    (dataPersistence.fetchAllValidationRules as any).mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'rule-001',
          ruleName: 'overdueThresholdDays',
          ruleDescription: '滞納判定の基準日数',
          targetTable: 'invoice',
          targetColumn: 'dueDate',
          validationType: 'threshold',
          validationCondition: '30',
          errorMessage: 'Invoice is overdue',
          warningLevel: 'high',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-07T10:00:00Z',
    });
  });

  it('invoiceStatus が「unbilled」で返される', async () => {
    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.invoiceStatus).toBe('unbilled');
  });

  it('invoiceCount=0 である', async () => {
    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.invoiceCount).toBe(0);
  });

  it('totalInvoiceAmount=0 である', async () => {
    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.totalInvoiceAmount).toBe(0);
  });

  it('totalPaidAmount=0 である', async () => {
    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.totalPaidAmount).toBe(0);
  });

  it('dealAmount=0 である', async () => {
    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.dealAmount).toBe(0);
  });

  it('amountConsistency=true である', async () => {
    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.amountConsistency).toBe(true);
  });

  it('invoiceDetails=[] である', async () => {
    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.invoiceDetails).toEqual([]);
  });

  it('結果は ClassifyInvoiceStatusOutput の型を持つ', async () => {
    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result).toHaveProperty('dealId');
    expect(result).toHaveProperty('invoiceStatus');
    expect(result).toHaveProperty('invoiceCount');
    expect(result).toHaveProperty('totalInvoiceAmount');
    expect(result).toHaveProperty('totalPaidAmount');
    expect(result).toHaveProperty('invoiceDetails');
    expect(result).toHaveProperty('dealAmount');
    expect(result).toHaveProperty('amountConsistency');
  });

  it('エラーは発生しないこと', async () => {
    await expect(
      classifyInvoiceStatus({
        dealId,
        currentDateTime,
      })
    ).resolves.not.toThrow();
  });
});
