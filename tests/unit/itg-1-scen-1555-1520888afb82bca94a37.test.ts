import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1555: 会計年度が会計月の場合、抽出期間は会計月初から会計月末として確定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set extraction period for fiscal month when accounting calendar type is fiscal month', async () => {
    const mockCustomers = [
      {
        customerId: 'CUST-001',
        customerName: '株式会社A',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
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
        customerName: '株式会社B',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
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
        dealName: '案件A',
        customerId: 'CUST-001',
        stageId: 'STAGE-001',
        dealAmount: 500000,
        status: '成約済み',
        expectedCloseDate: '2025-01-31',
        invoicedAmount: 500000,
        salesRepresentativeId: 'SR-001',
        expectedContractDate: '2025-01-31',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'USER-001',
        invoiceSLAExceededFlag: false,
        contractedDate: '2025-01-31',
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
        invoiceDate: '2025-01-10',
        invoiceAmount: 500000,
        status: 'issued',
        salesRepresentativeId: 'SR-001',
        invoiceNumber: 'INV-001',
        dueDate: '2025-02-09',
        taxAmount: 0,
        untaxedAmount: 500000,
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
        createdBy: 'USER-001',
      },
    ];

    const mockStages = [
      {
        stageId: 'STAGE-001',
        stageName: '成約済み',
        stageOrder: 5,
        contractedStageFlag: true,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
        description: null,
      },
    ];

    const mockRules = [
      {
        validationRuleId: 'RULE-001',
        ruleName: 'キャンセル案件除外',
        ruleDescription: 'キャンセル案件除外',
        targetTable: 'deals',
        targetColumn: 'status',
        validationType: 'exclusion',
        validationCondition: "status != 'キャンセル済み'",
        errorMessage: 'cancelled deals excluded',
        warningLevel: 'warning',
        validFlag: true,
        applicationStartDate: '2025-01-01',
        applicationEndDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: mockCustomers,
      totalCount: 2,
      fetchedAt: '2025-01-15T09:00:00Z',
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: mockDeals,
      totalCount: 1,
      fetchedAt: '2025-01-15T09:00:00Z',
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: mockInvoices,
      totalCount: 1,
      fetchedAt: '2025-01-15T09:00:00Z',
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: mockStages,
      totalCount: 1,
      fetchedAt: '2025-01-15T09:00:00Z',
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: mockRules,
      totalCount: 1,
      fetchedAt: '2025-01-15T09:00:00Z',
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'CI-20250115-001',
      targetMonth: '2025-01',
      operatorUserId: 'USR-SALES-OPS-001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    });

    expect(result).toBeDefined();
    expect(result.closingPeriod).toBeDefined();
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2025-01-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2025-01-31'));
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBe(1);
    expect(result.extractionScope.totalInvoiceCount).toBe(1);
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(new Date('2025-01-15T09:00:00Z'));
  });
});
