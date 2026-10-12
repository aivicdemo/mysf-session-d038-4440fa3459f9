import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1553: 対象月指定で開始すると指定月が抽出スコープに反映される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reflect specified target month in extraction scope', async () => {
    const mockCustomers = [
      {
        customerId: 'CUST-001',
        customerName: '取引先A',
        isActive: true,
        status: 'active',
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: null,
        emailAddress: null,
        contactPersonName: null,
        paymentTerms: null,
        invoiceAddress: null,
        invoiceEmailAddress: null,
      },
      {
        customerId: 'CUST-002',
        customerName: '取引先B',
        isActive: true,
        status: 'active',
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: null,
        emailAddress: null,
        contactPersonName: null,
        paymentTerms: null,
        invoiceAddress: null,
        invoiceEmailAddress: null,
      },
    ];

    const mockDeals = [
      {
        dealId: 'DEAL-001',
        dealName: '商談α',
        customerId: 'CUST-001',
        stageId: 'STAGE-001',
        dealAmount: 100000,
        status: 'closed_won',
        closedDate: '2024-12-15',
        salesRepresentativeId: 'SR-001',
        expectedContractDate: '2024-12-15',
        createdAt: '2024-12-15T00:00:00Z',
        updatedAt: '2024-12-15T00:00:00Z',
        createdBy: 'USER-001',
        invoiceSLAExceededFlag: false,
        contractedDate: '2024-12-15',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
      },
      {
        dealId: 'DEAL-002',
        dealName: '商談β',
        customerId: 'CUST-002',
        stageId: 'STAGE-001',
        dealAmount: 150000,
        status: 'closed_won',
        closedDate: '2024-12-20',
        salesRepresentativeId: 'SR-002',
        expectedContractDate: '2024-12-20',
        createdAt: '2024-12-20T00:00:00Z',
        updatedAt: '2024-12-20T00:00:00Z',
        createdBy: 'USER-002',
        invoiceSLAExceededFlag: false,
        contractedDate: '2024-12-20',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
      },
    ];

    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        dealId: 'DEAL-001',
        customerId: 'CUST-001',
        invoiceDate: '2024-12-16',
        amount: 100000,
        status: 'issued',
        salesRepresentativeId: 'SR-001',
        invoiceNumber: 'INV-001',
        dueDate: '2025-01-15',
        taxAmount: 0,
        untaxedAmount: 100000,
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2024-12-16T00:00:00Z',
        updatedAt: '2024-12-16T00:00:00Z',
        createdBy: 'USER-001',
      },
      {
        invoiceId: 'INV-002',
        dealId: 'DEAL-002',
        customerId: 'CUST-002',
        invoiceDate: '2024-12-21',
        amount: 150000,
        status: 'issued',
        salesRepresentativeId: 'SR-002',
        invoiceNumber: 'INV-002',
        dueDate: '2025-01-20',
        taxAmount: 0,
        untaxedAmount: 150000,
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2024-12-21T00:00:00Z',
        updatedAt: '2024-12-21T00:00:00Z',
        createdBy: 'USER-002',
      },
    ];

    const mockStages = [
      {
        stageId: 'STAGE-001',
        stageName: 'closed_won',
        isActive: true,
        stageOrder: 1,
        contractedStageFlag: true,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
      {
        stageId: 'STAGE-002',
        stageName: 'closed_lost',
        isActive: true,
        stageOrder: 2,
        contractedStageFlag: false,
        lossStageFlag: true,
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
        ruleName: '商談請求紐付け確認',
        description: '成約済み商談と請求書の紐付け一致確認',
        ruleDescription: '成約済み商談と請求書の紐付け一致確認',
        targetTable: 'invoices',
        targetColumn: 'dealId',
        validationType: 'foreign_key',
        validationCondition: 'dealId IS NOT NULL',
        errorMessage: 'deal not found',
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
        description: '商談金額と請求書金額の一致確認',
        ruleDescription: '商談金額と請求書金額の一致確認',
        targetTable: 'invoices',
        targetColumn: 'amount',
        validationType: 'amount_match',
        validationCondition: 'amount = dealAmount',
        errorMessage: 'amount mismatch',
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
      fetchedAt: '2024-12-20T09:00:00Z',
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: mockDeals,
      totalCount: 2,
      fetchedAt: '2024-12-20T09:00:00Z',
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: mockInvoices,
      totalCount: 2,
      fetchedAt: '2024-12-20T09:00:00Z',
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: mockStages,
      totalCount: 2,
      fetchedAt: '2024-12-20T09:00:00Z',
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: mockRules,
      totalCount: 2,
      fetchedAt: '2024-12-20T09:00:00Z',
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'CI-2024-12-001',
      targetMonth: '2024-12',
      operatorUserId: 'USR-SALES-OPS-001',
      executionTimestamp: new Date('2024-12-20T09:00:00Z'),
    });

    expect(result).toBeDefined();
    expect(result.closingPeriod).toBeDefined();
    expect(result.closingPeriod.targetMonth).toBe('2024-12');
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-12-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-12-31'));
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBe(2);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt >= new Date('2024-12-20T09:00:00Z')).toBe(true);
  });
});
