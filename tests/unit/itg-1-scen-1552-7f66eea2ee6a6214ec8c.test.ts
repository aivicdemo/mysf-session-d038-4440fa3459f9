import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1552: 対象月未指定で開始すると前月が自動設定され抽出スコープが確定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set previous month as target month when not specified, and prepare extraction scope', async () => {
    const mockCustomers = [
      {
        customerId: 'CUST-001',
        customerName: 'A株式会社',
        isActive: true,
        createdDate: '2024-10-15',
        createdAt: '2024-10-15T00:00:00Z',
        updatedAt: '2024-10-15T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
      {
        customerId: 'CUST-002',
        customerName: 'B有限会社',
        isActive: true,
        createdDate: '2024-11-01',
        createdAt: '2024-11-01T00:00:00Z',
        updatedAt: '2024-11-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
    ];

    const mockDeals = [
      {
        dealId: 'DEAL-2024-12-001',
        dealName: '案件α',
        customerId: 'CUST-001',
        stageId: 'STAGE-02',
        dealAmount: 5000000,
        contractedDate: '2024-12-10',
        salesRepresentativeId: 'SR-001',
        expectedContractDate: '2024-12-10',
        createdAt: '2024-12-10T00:00:00Z',
        updatedAt: '2024-12-10T00:00:00Z',
        createdBy: 'USER-001',
        invoiceSLAExceededFlag: false,
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
      },
      {
        dealId: 'DEAL-2024-12-002',
        dealName: '案件β',
        customerId: 'CUST-002',
        stageId: 'STAGE-02',
        dealAmount: 3000000,
        contractedDate: '2024-12-15',
        salesRepresentativeId: 'SR-002',
        expectedContractDate: '2024-12-15',
        createdAt: '2024-12-15T00:00:00Z',
        updatedAt: '2024-12-15T00:00:00Z',
        createdBy: 'USER-002',
        invoiceSLAExceededFlag: false,
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
      },
    ];

    const mockInvoices = [
      {
        invoiceId: 'INV-2024-12-001',
        dealId: 'DEAL-2024-12-001',
        invoiceAmount: 5000000,
        status: 'issued',
        customerId: 'CUST-001',
        salesRepresentativeId: 'SR-001',
        invoiceNumber: 'INV-001',
        invoiceDate: '2024-12-10',
        dueDate: '2025-01-09',
        taxAmount: 0,
        untaxedAmount: 5000000,
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2024-12-10T00:00:00Z',
        updatedAt: '2024-12-10T00:00:00Z',
        createdBy: 'USER-001',
      },
      {
        invoiceId: 'INV-2024-12-002',
        dealId: 'DEAL-2024-12-002',
        invoiceAmount: 3000000,
        status: 'issued',
        customerId: 'CUST-002',
        salesRepresentativeId: 'SR-002',
        invoiceNumber: 'INV-002',
        invoiceDate: '2024-12-15',
        dueDate: '2025-01-14',
        taxAmount: 0,
        untaxedAmount: 3000000,
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2024-12-15T00:00:00Z',
        updatedAt: '2024-12-15T00:00:00Z',
        createdBy: 'USER-002',
      },
    ];

    const mockStages = [
      {
        stageId: 'STAGE-01',
        stageName: 'Prospecting',
        isActive: true,
        stageOrder: 1,
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
      {
        stageId: 'STAGE-02',
        stageName: 'Closed Won',
        isActive: true,
        stageOrder: 2,
        contractedStageFlag: true,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
    ];

    const mockRules = [
      {
        validationRuleId: 'RULE-001',
        ruleName: '商談と請求の紐付け確認',
        description: '商談と請求書の dealId が一致すること',
        isActive: true,
        ruleDescription: '商談と請求書の dealId が一致すること',
        targetTable: 'invoices',
        targetColumn: 'dealId',
        validationType: 'foreign_key',
        validationCondition: 'dealId IS NOT NULL',
        errorMessage: 'dealId must match',
        warningLevel: 'error',
        validFlag: true,
        applicationStartDate: '2024-01-01',
        applicationEndDate: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
      {
        validationRuleId: 'RULE-002',
        ruleName: '金額一致確認',
        description: '商談金額と請求金額が一致すること',
        isActive: true,
        ruleDescription: '商談金額と請求金額が一致すること',
        targetTable: 'invoices',
        targetColumn: 'invoiceAmount',
        validationType: 'amount_match',
        validationCondition: 'invoiceAmount = dealAmount',
        errorMessage: 'amounts must match',
        warningLevel: 'error',
        validFlag: true,
        applicationStartDate: '2024-01-01',
        applicationEndDate: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: mockCustomers,
      totalCount: 2,
      fetchedAt: '2025-01-06T10:30:00Z',
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: mockDeals,
      totalCount: 2,
      fetchedAt: '2025-01-06T10:30:00Z',
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: mockInvoices,
      totalCount: 2,
      fetchedAt: '2025-01-06T10:30:00Z',
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: mockStages,
      totalCount: 2,
      fetchedAt: '2025-01-06T10:30:00Z',
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: mockRules,
      totalCount: 2,
      fetchedAt: '2025-01-06T10:30:00Z',
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'INSTR-20250106-001',
      targetMonth: '',
      operatorUserId: 'USER-SALES-ADMIN-001',
      executionTimestamp: new Date('2025-01-06T10:30:00Z'),
    });

    expect(result).toBeDefined();
    expect(result.closingPeriod).toBeDefined();
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-12-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-12-31'));
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBe(2);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);
    expect(result.extractionCriteria).toBeDefined();
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(new Date('2025-01-06T10:30:00Z'));
  });
});
