import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1556: 有効なオブジェクトが複数選定されると抽出対象として定義される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should define multiple valid objects as extraction targets', async () => {
    const mockCustomers = [
      {
        customerId: 'C001',
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
      {
        customerId: 'C002',
        customerName: '取引先B',
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
        dealId: 'D001',
        dealName: '商談1',
        customerId: 'C001',
        stageId: 'S003',
        dealAmount: 100000,
        status: '成約済み',
        isActive: true,
        salesRepresentativeId: 'SR-001',
        expectedContractDate: '2024-12-01',
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
        createdBy: 'USER-001',
        invoiceSLAExceededFlag: false,
        contractedDate: '2024-12-01',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
      },
      {
        dealId: 'D002',
        dealName: '商談2',
        customerId: 'C002',
        stageId: 'S003',
        dealAmount: 200000,
        status: '成約済み',
        isActive: true,
        salesRepresentativeId: 'SR-002',
        expectedContractDate: '2024-12-10',
        createdAt: '2024-12-10T00:00:00Z',
        updatedAt: '2024-12-10T00:00:00Z',
        createdBy: 'USER-002',
        invoiceSLAExceededFlag: false,
        contractedDate: '2024-12-10',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
      },
      {
        dealId: 'D003',
        dealName: '商談3',
        customerId: 'C001',
        stageId: 'S003',
        dealAmount: 150000,
        status: '成約済み',
        isActive: true,
        salesRepresentativeId: 'SR-003',
        expectedContractDate: '2024-12-15',
        createdAt: '2024-12-15T00:00:00Z',
        updatedAt: '2024-12-15T00:00:00Z',
        createdBy: 'USER-003',
        invoiceSLAExceededFlag: false,
        contractedDate: '2024-12-15',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
      },
    ];

    const mockInvoices = [
      {
        invoiceId: 'INV001',
        dealId: 'D001',
        customerId: 'C001',
        invoiceDate: '2024-12-05',
        isActive: true,
        salesRepresentativeId: 'SR-001',
        invoiceNumber: 'INV-001',
        dueDate: '2025-01-04',
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
        createdAt: '2024-12-05T00:00:00Z',
        updatedAt: '2024-12-05T00:00:00Z',
        createdBy: 'USER-001',
      },
      {
        invoiceId: 'INV002',
        dealId: 'D002',
        customerId: 'C002',
        invoiceDate: '2024-12-15',
        isActive: true,
        salesRepresentativeId: 'SR-002',
        invoiceNumber: 'INV-002',
        dueDate: '2025-01-14',
        invoiceAmount: 200000,
        taxAmount: 0,
        untaxedAmount: 200000,
        status: 'issued',
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
        stageId: 'S001',
        stageName: 'リード',
        isActive: true,
        stageOrder: 1,
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
        description: null,
      },
      {
        stageId: 'S002',
        stageName: '商談',
        isActive: true,
        stageOrder: 2,
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
        description: null,
      },
      {
        stageId: 'S003',
        stageName: '成約済み',
        isActive: true,
        stageOrder: 3,
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
        validationRuleId: 'R001',
        ruleName: '金額チェック',
        isActive: true,
        ruleDescription: '金額チェック',
        targetTable: 'deals',
        targetColumn: 'amount',
        validationType: 'amount',
        validationCondition: 'amount > 0',
        errorMessage: 'invalid amount',
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
        validationRuleId: 'R002',
        ruleName: 'ステータス整合性',
        isActive: true,
        ruleDescription: 'ステータス整合性',
        targetTable: 'deals',
        targetColumn: 'status',
        validationType: 'status',
        validationCondition: "status IN ('成約済み', 'キャンセル済み')",
        errorMessage: 'invalid status',
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
      fetchedAt: '2024-12-10T09:30:00Z',
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: mockDeals,
      totalCount: 3,
      fetchedAt: '2024-12-10T09:30:00Z',
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: mockInvoices,
      totalCount: 2,
      fetchedAt: '2024-12-10T09:30:00Z',
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: mockStages,
      totalCount: 3,
      fetchedAt: '2024-12-10T09:30:00Z',
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: mockRules,
      totalCount: 2,
      fetchedAt: '2024-12-10T09:30:00Z',
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'CI-2024-001',
      targetMonth: '2024-12',
      operatorUserId: 'USR-SALES-ADMIN-001',
      executionTimestamp: new Date('2024-12-10T09:30:00Z'),
    });

    expect(result).toBeDefined();
    expect(result.readyForExtraction).toBe(true);
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.extractionObjects).toBeDefined();
    expect(result.extractionScope.extractionObjects.length).toBeGreaterThan(0);
    expect(result.extractionScope.extractionObjects.every(
      (obj) => obj.objectName && obj.extractionCondition
    )).toBe(true);
    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBe(3);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-12-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-12-31'));
  });
});
