import { jest } from '@jest/globals';
import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import type {
  FetchAllCustomersOutput,
  FetchDealsForPeriodOutput,
  FetchInvoicesForPeriodOutput,
  FetchAllDealStagesOutput,
  FetchAllValidationRulesOutput,
} from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1599: 商談含有・請求明細漏れ商品がなければ漏れ商品リスト空で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const dataPersistence = require('../../src/logic/data-persistence');
    dataPersistence.fetchAllCustomers = jest.fn();
    dataPersistence.fetchDealsForPeriod = jest.fn();
    dataPersistence.fetchInvoicesForPeriod = jest.fn();
    dataPersistence.fetchAllDealStages = jest.fn();
    dataPersistence.fetchAllValidationRules = jest.fn();
  });

  it('前提条件を全て満たす場合、漏れ商品リストが空で正常に完了する', async () => {
    // 前提条件の値
    const closingInstructionId = 'INST-202411-001';
    const targetMonth = '2024-11';
    const operatorUserId = 'USR-SALES-SYS-001';
    const executionTimestamp = new Date('2024-11-05T10:30:00Z');

    // モック値の設定
    const mockCustomers = [
      {
        customerId: 'CUST-A001',
        customerName: '顧客A',
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
        status: 'active',
        createdAt: '2024-11-01T00:00:00Z',
        updatedAt: '2024-11-05T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
      {
        customerId: 'CUST-B001',
        customerName: '顧客B',
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
        status: 'active',
        createdAt: '2024-11-01T00:00:00Z',
        updatedAt: '2024-11-05T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
    ];

    const mockDeals = [
      {
        dealId: 'DEAL-2024-001',
        dealName: '案件A',
        customerId: 'CUST-A001',
        salesRepresentativeId: 'SR-001',
        dealAmount: 500000,
        stageId: 'STAGE-05',
        expectedContractDate: '2024-11-10',
        contractedDate: '2024-11-15',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdAt: '2024-11-01T00:00:00Z',
        updatedAt: '2024-11-15T00:00:00Z',
        createdBy: 'SR-001',
      },
      {
        dealId: 'DEAL-2024-002',
        dealName: '案件B',
        customerId: 'CUST-B001',
        salesRepresentativeId: 'SR-002',
        dealAmount: 300000,
        stageId: 'STAGE-05',
        expectedContractDate: '2024-11-15',
        contractedDate: '2024-11-20',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdAt: '2024-11-01T00:00:00Z',
        updatedAt: '2024-11-20T00:00:00Z',
        createdBy: 'SR-002',
      },
    ];

    const mockInvoices = [
      {
        invoiceId: 'INV-2024-001',
        dealId: 'DEAL-2024-001',
        customerId: 'CUST-A001',
        salesRepresentativeId: 'SR-001',
        invoiceNumber: 'INV-001',
        invoiceDate: '2024-11-16',
        dueDate: '2024-12-16',
        invoiceAmount: 500000,
        taxAmount: 0,
        untaxedAmount: 500000,
        invoiceStatus: '発行済み',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2024-11-16T00:00:00Z',
        updatedAt: '2024-11-16T00:00:00Z',
        createdBy: 'SR-001',
      },
      {
        invoiceId: 'INV-2024-002',
        dealId: 'DEAL-2024-002',
        customerId: 'CUST-B001',
        salesRepresentativeId: 'SR-002',
        invoiceNumber: 'INV-002',
        invoiceDate: '2024-11-21',
        dueDate: '2024-12-21',
        invoiceAmount: 300000,
        taxAmount: 0,
        untaxedAmount: 300000,
        invoiceStatus: '発行済み',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2024-11-21T00:00:00Z',
        updatedAt: '2024-11-21T00:00:00Z',
        createdBy: 'SR-002',
      },
    ];

    const mockDealStages = [
      {
        stageId: 'STAGE-01',
        stageName: '初期接触',
        stageOrder: 1,
        description: null,
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
      {
        stageId: 'STAGE-05',
        stageName: '成約済み',
        stageOrder: 5,
        description: null,
        contractedStageFlag: true,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
    ];

    const mockValidationRules = [
      {
        validationRuleId: 'RULE-001',
        ruleName: '商談と請求の紐付け確認',
        ruleDescription: '商談と請求の紐付けを確認',
        targetTable: 'invoices',
        targetColumn: 'dealId',
        validationType: 'INTEGRITY_CHECK',
        validationCondition: 'dealId IS NOT NULL',
        errorMessage: '商談との紐付けが必要です',
        warningLevel: 'ERROR',
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
        ruleDescription: '請求額が商談額と一致していることを確認',
        targetTable: 'invoices',
        targetColumn: 'invoiceAmount',
        validationType: 'INTEGRITY_CHECK',
        validationCondition: 'invoiceAmount = dealAmount',
        errorMessage: '請求額が商談額と一致していません',
        warningLevel: 'ERROR',
        validFlag: true,
        applicationStartDate: '2024-01-01',
        applicationEndDate: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'ADMIN',
        updatedBy: 'ADMIN',
      },
    ];

    const dataPersistence = require('../../src/logic/data-persistence');

    dataPersistence.fetchAllCustomers.mockResolvedValue({
      customers: mockCustomers,
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    } as FetchAllCustomersOutput);

    dataPersistence.fetchDealsForPeriod.mockResolvedValue({
      deals: mockDeals,
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    } as FetchDealsForPeriodOutput);

    dataPersistence.fetchInvoicesForPeriod.mockResolvedValue({
      invoices: mockInvoices,
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    } as FetchInvoicesForPeriodOutput);

    dataPersistence.fetchAllDealStages.mockResolvedValue({
      stages: mockDealStages,
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    } as FetchAllDealStagesOutput);

    dataPersistence.fetchAllValidationRules.mockResolvedValue({
      validationRules: mockValidationRules,
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    } as FetchAllValidationRulesOutput);

    // 関数を呼び出す
    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    // 検証
    expect(result).toBeDefined();
    expect(result.closingPeriod).toBeDefined();
    expect(result.closingPeriod.targetMonth).toBe('2024-11');
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-11-01T00:00:00Z'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-11-30T23:59:59Z'));

    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.customerIds).toContain('CUST-A001');
    expect(result.extractionScope.customerIds).toContain('CUST-B001');
    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.dealIds).toContain('DEAL-2024-001');
    expect(result.extractionScope.dealIds).toContain('DEAL-2024-002');
    expect(result.extractionScope.totalDealCount).toBe(2);
    expect(result.extractionScope.invoiceIds).toContain('INV-2024-001');
    expect(result.extractionScope.invoiceIds).toContain('INV-2024-002');
    expect(result.extractionScope.totalInvoiceCount).toBe(2);

    expect(result.extractionCriteria).toBeDefined();
    expect(result.extractionCriteria.dealStageFilter).toContain('STAGE-05');
    expect(result.extractionCriteria.validationRulesToApply).toContain('RULE-001');
    expect(result.extractionCriteria.validationRulesToApply).toContain('RULE-002');

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toBeDefined();

    // 外部関数の呼び出しを確認
    expect(dataPersistence.fetchAllCustomers).toHaveBeenCalled();
    expect(dataPersistence.fetchDealsForPeriod).toHaveBeenCalled();
    expect(dataPersistence.fetchInvoicesForPeriod).toHaveBeenCalled();
    expect(dataPersistence.fetchAllDealStages).toHaveBeenCalled();
    expect(dataPersistence.fetchAllValidationRules).toHaveBeenCalled();
  });
});
