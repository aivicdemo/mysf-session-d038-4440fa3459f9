import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1554: 会計年度が暦月の場合、抽出期間は月初から月末として確定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set extraction period from first to last day of month for calendar year', async () => {
    const mockCustomers = [
      {
        customerId: 'CUST-001',
        customerName: '取引先A',
        isActive: true,
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
        dealName: '商談A',
        customerId: 'CUST-001',
        stageId: 'STAGE-001',
        dealAmount: 100000,
        status: '成約済み',
        invoiceDate: '2024-12-10',
        salesRepresentativeId: 'SR-001',
        expectedContractDate: '2024-12-10',
        createdAt: '2024-12-10T00:00:00Z',
        updatedAt: '2024-12-10T00:00:00Z',
        createdBy: 'USER-001',
        invoiceSLAExceededFlag: false,
        contractedDate: '2024-12-10',
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
        invoiceDate: '2024-12-10',
        totalAmount: 100000,
        salesRepresentativeId: 'SR-001',
        invoiceNumber: 'INV-001',
        dueDate: '2025-01-09',
        invoiceAmount: 100000,
        taxAmount: 0,
        untaxedAmount: 100000,
        status: 'issued',
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
    ];

    const mockStages = [
      {
        stageId: 'STAGE-001',
        stageName: '成約済み',
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
      fetchedAt: '2024-12-15T09:00:00Z',
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: mockDeals,
      totalCount: 1,
      fetchedAt: '2024-12-15T09:00:00Z',
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: mockInvoices,
      totalCount: 1,
      fetchedAt: '2024-12-15T09:00:00Z',
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: mockStages,
      totalCount: 1,
      fetchedAt: '2024-12-15T09:00:00Z',
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: mockRules,
      totalCount: 1,
      fetchedAt: '2024-12-15T09:00:00Z',
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'CI-2024-12-001',
      targetMonth: '2024-12',
      operatorUserId: 'USR-SALES-OPS-001',
      executionTimestamp: new Date('2024-12-15T09:00:00Z'),
    });

    expect(result).toBeDefined();
    expect(result.closingPeriod).toBeDefined();
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-12-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-12-31'));
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.totalCustomerCount).toBe(1);
    expect(result.extractionScope.totalDealCount).toBe(1);
    expect(result.extractionScope.totalInvoiceCount).toBe(1);
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(new Date('2024-12-15T09:00:00Z'));
  });
});
