import { prepareMonthlyClosing, ExtractionScopeDefinitionFailed } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1561: 会計年度タイプ未設定でエラーが発生し処理中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ExtractionScopeDefinitionFailed error when accounting calendar type is not set', async () => {
    const mockCustomers = [
      {
        customerId: 'CUST-001',
        customerName: '取引先A',
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
        dealStatus: '成約済み',
        invoicingDate: '2025-01-10',
        stageId: 'STAGE-001',
        dealAmount: 100000,
        customerId: 'CUST-001',
        salesRepresentativeId: 'SR-001',
        dealName: 'Deal',
        expectedContractDate: '2025-01-10',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
        createdBy: 'USER-001',
        invoiceSLAExceededFlag: false,
        contractedDate: '2025-01-10',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
      },
    ];

    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        invoicingDate: '2025-01-10',
        amount: 100000,
        dealId: 'DEAL-001',
        customerId: 'CUST-001',
        salesRepresentativeId: 'SR-001',
        invoiceNumber: 'INV-001',
        invoiceDate: '2025-01-10',
        dueDate: '2025-02-09',
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
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
        createdBy: 'USER-001',
      },
    ];

    const mockStages = [
      {
        stageName: '成約済み',
        stageOrder: 5,
        stageId: 'STAGE-001',
        isActive: true,
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
        ruleName: '金額整合性チェック',
        isActive: true,
        ruleDescription: '金額整合性チェック',
        targetTable: 'invoices',
        targetColumn: 'amount',
        validationType: 'amount',
        validationCondition: 'amount > 0',
        errorMessage: 'invalid amount',
        warningLevel: 'error',
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
      totalCount: 1,
      fetchedAt: '2025-01-15T10:00:00Z',
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: mockDeals,
      totalCount: 1,
      fetchedAt: '2025-01-15T10:00:00Z',
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: mockInvoices,
      totalCount: 1,
      fetchedAt: '2025-01-15T10:00:00Z',
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: mockStages,
      totalCount: 1,
      fetchedAt: '2025-01-15T10:00:00Z',
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: mockRules,
      totalCount: 1,
      fetchedAt: '2025-01-15T10:00:00Z',
    });

    await expect(
      prepareMonthlyClosing({
        closingInstructionId: 'CI-2025-01-001',
        targetMonth: '2025-01',
        operatorUserId: 'OP-USER-001',
        executionTimestamp: new Date('2025-01-15T10:00:00Z'),
      })
    ).rejects.toThrow(ExtractionScopeDefinitionFailed);
  });
});
