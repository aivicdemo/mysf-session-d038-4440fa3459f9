import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1559: データ整合性チェック項目が抽出スコープに含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include data integrity checkpoints in extraction scope', async () => {
    const mockCustomers = [
      {
        customerId: 'CUST-001',
        customerName: '取引先A',
        isActive: true,
        isTestRecord: false,
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
        customerName: '取引先B',
        isActive: true,
        isTestRecord: false,
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
        dealStatus: 'Closed Won',
        dealAmount: 1000000,
        closeDateStart: '2025-01-01',
        closeDateEnd: '2025-01-31',
        customerId: 'CUST-001',
        salesRepresentativeId: 'SR-001',
        dealName: 'Deal A',
        stageId: 'STAGE-002',
        expectedContractDate: '2025-01-31',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'USER-001',
        invoiceSLAExceededFlag: false,
        contractedDate: '2025-01-31',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
      },
      {
        dealId: 'DEAL-002',
        dealStatus: 'Closed Won',
        dealAmount: 500000,
        closeDateStart: '2025-01-15',
        closeDateEnd: '2025-01-31',
        customerId: 'CUST-002',
        salesRepresentativeId: 'SR-002',
        dealName: 'Deal B',
        stageId: 'STAGE-002',
        expectedContractDate: '2025-01-31',
        createdAt: '2025-01-20T00:00:00Z',
        updatedAt: '2025-01-20T00:00:00Z',
        createdBy: 'USER-002',
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
        invoiceDate: '2025-01-31',
        invoiceAmount: 1000000,
        linkedDealId: 'DEAL-001',
        dealId: 'DEAL-001',
        customerId: 'CUST-001',
        salesRepresentativeId: 'SR-001',
        invoiceNumber: 'INV-001',
        dueDate: '2025-02-28',
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
        createdAt: '2025-01-31T00:00:00Z',
        updatedAt: '2025-01-31T00:00:00Z',
        createdBy: 'USER-001',
      },
      {
        invoiceId: 'INV-002',
        invoiceDate: '2025-01-31',
        invoiceAmount: 500000,
        linkedDealId: 'DEAL-002',
        dealId: 'DEAL-002',
        customerId: 'CUST-002',
        salesRepresentativeId: 'SR-002',
        invoiceNumber: 'INV-002',
        dueDate: '2025-02-28',
        taxAmount: 0,
        untaxedAmount: 500000,
        status: 'issued',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2025-01-31T00:00:00Z',
        updatedAt: '2025-01-31T00:00:00Z',
        createdBy: 'USER-002',
      },
    ];

    const mockStages = [
      {
        stageId: 'STAGE-001',
        stageName: '商談初期段階',
        isActive: true,
        stageOrder: 1,
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
        description: null,
      },
      {
        stageId: 'STAGE-002',
        stageName: '成約済み',
        isActive: true,
        stageOrder: 2,
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
        ruleName: '商談請求書紐付け検証',
        ruleDescription: '商談と請求書の紐付け確認',
        targetTable: 'invoices',
        targetColumn: 'dealId',
        validationType: 'foreign_key',
        validationCondition: 'dealId IS NOT NULL',
        errorMessage: 'deal not found',
        warningLevel: 'error',
        validFlag: true,
        applicationStartDate: '2025-01-01',
        applicationEndDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
      {
        validationRuleId: 'RULE-002',
        ruleName: '金額一致検証',
        ruleDescription: '商談金額と請求金額の一致確認',
        targetTable: 'invoices',
        targetColumn: 'amount',
        validationType: 'amount_match',
        validationCondition: 'amount = dealAmount',
        errorMessage: 'amount mismatch',
        warningLevel: 'error',
        validFlag: true,
        applicationStartDate: '2025-01-01',
        applicationEndDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
      {
        validationRuleId: 'RULE-003',
        ruleName: 'ステータス一貫性検証',
        ruleDescription: '商談とステータスの一貫性確認',
        targetTable: 'deals',
        targetColumn: 'status',
        validationType: 'status_consistency',
        validationCondition: "status IN ('Closed Won', 'Closed Lost')",
        errorMessage: 'status inconsistent',
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
      fetchedAt: '2025-02-01T09:00:00Z',
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: mockDeals,
      totalCount: 2,
      fetchedAt: '2025-02-01T09:00:00Z',
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: mockInvoices,
      totalCount: 2,
      fetchedAt: '2025-02-01T09:00:00Z',
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: mockStages,
      totalCount: 2,
      fetchedAt: '2025-02-01T09:00:00Z',
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: mockRules,
      totalCount: 3,
      fetchedAt: '2025-02-01T09:00:00Z',
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'INSTR-2025-01-001',
      targetMonth: '2025-01',
      operatorUserId: 'USR-SALES-SYS-001',
      executionTimestamp: new Date('2025-02-01T09:00:00Z'),
    });

    expect(result).toBeDefined();
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints.length).toBe(3);
    expect(result.extractionScope.dataIntegrityCheckpoints.some(
      (cp) => cp.checkpoint === '商談請求書紐付け検証'
    )).toBe(true);
    expect(result.extractionScope.dataIntegrityCheckpoints.some(
      (cp) => cp.checkpoint === '金額一致検証'
    )).toBe(true);
    expect(result.extractionScope.dataIntegrityCheckpoints.some(
      (cp) => cp.checkpoint === 'ステータス一貫性検証'
    )).toBe(true);
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt >= new Date('2025-02-01T09:00:00Z')).toBe(true);
  });
});
