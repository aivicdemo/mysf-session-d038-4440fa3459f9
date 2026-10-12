import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1560: 対象月未指定時、前月自動設定メッセージが表示される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should auto-set previous month and display message when target month is not specified', async () => {
    const mockCustomers = [
      {
        customerId: 'CUST-001',
        customerName: 'A株式会社',
        isActive: true,
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
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
        dealName: 'X案件',
        customerId: 'CUST-001',
        stageId: 'STAGE-001',
        dealAmount: 1000000,
        status: '成約済み',
        closedDate: '2024-10-31',
        salesRepresentativeId: 'SR-001',
        expectedContractDate: '2024-10-31',
        createdAt: '2024-10-31T00:00:00Z',
        updatedAt: '2024-10-31T00:00:00Z',
        createdBy: 'USER-001',
        invoiceSLAExceededFlag: false,
        contractedDate: '2024-10-31',
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
        invoiceDate: '2024-10-31',
        amount: 1000000,
        salesRepresentativeId: 'SR-001',
        invoiceNumber: 'INV-001',
        dueDate: '2024-11-30',
        invoiceAmount: 1000000,
        taxAmount: 0,
        untaxedAmount: 1000000,
        status: 'issued',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2024-10-31T00:00:00Z',
        updatedAt: '2024-10-31T00:00:00Z',
        createdBy: 'USER-001',
      },
    ];

    const mockStages = [
      {
        stageId: 'STAGE-001',
        stageName: '成約済み',
        isActive: true,
        stageOrder: 1,
        contractedStageFlag: true,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
        description: null,
      },
    ];

    const mockRules = [
      {
        validationRuleId: 'RULE-001',
        ruleName: '商談と請求書の紐付け確認',
        isActive: true,
        ruleDescription: '商談と請求書の紐付け確認',
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
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: mockCustomers,
      totalCount: 1,
      fetchedAt: '2024-11-15T10:30:00Z',
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: mockDeals,
      totalCount: 1,
      fetchedAt: '2024-11-15T10:30:00Z',
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: mockInvoices,
      totalCount: 1,
      fetchedAt: '2024-11-15T10:30:00Z',
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: mockStages,
      totalCount: 1,
      fetchedAt: '2024-11-15T10:30:00Z',
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: mockRules,
      totalCount: 1,
      fetchedAt: '2024-11-15T10:30:00Z',
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'CI-2024-001',
      targetMonth: '',
      operatorUserId: 'USR-SALES-OPS-001',
      executionTimestamp: new Date('2024-11-15T10:30:00Z'),
    });

    expect(result).toBeDefined();
    expect(result.closingPeriod).toBeDefined();
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-10-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-10-31'));
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.totalCustomerCount).toBe(1);
    expect(result.extractionScope.totalDealCount).toBe(1);
    expect(result.extractionScope.totalInvoiceCount).toBe(1);
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(new Date('2024-11-15T10:30:00Z'));
  });
});
