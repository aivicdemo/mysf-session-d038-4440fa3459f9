import { jest } from '@jest/globals';
import type {
  PrepareMonthlyClosingInput,
} from '../../src/logic/monthly-closing-preparation';
import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-1598: 差異額が許容範囲超過なら一致判定が偽で差異原因分類される', () => {
  const mockFetchAllCustomers = dataPersistence.fetchAllCustomers as jest.Mock;
  const mockFetchDealsForPeriod = dataPersistence.fetchDealsForPeriod as jest.Mock;
  const mockFetchInvoicesForPeriod = dataPersistence.fetchInvoicesForPeriod as jest.Mock;
  const mockFetchAllDealStages = dataPersistence.fetchAllDealStages as jest.Mock;
  const mockFetchAllValidationRules = dataPersistence.fetchAllValidationRules as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFetchAllCustomers.mockImplementation(async () => ({
      customers: [
        { customerId: 'CUST-001', customerName: '顧客A', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', createdBy: 'SYS', updatedBy: 'SYS' },
        { customerId: 'CUST-002', customerName: '顧客B', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', createdBy: 'SYS', updatedBy: 'SYS' },
      ],
      totalCount: 2,
      fetchedAt: '2025-02-01T09:00:00Z',
    }));

    mockFetchDealsForPeriod.mockImplementation(async () => ({
      deals: [
        {
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'SR001',
          dealName: '商談A',
          dealAmount: 1000000,
          stageId: 'STAGE-003',
          expectedContractDate: '2025-01-15',
          contractedDate: '2025-01-15',
          description: 'Closed Won Deal A',
          lossReason: null,
          invoiceGenerationSLADeadline: '2025-01-25',
          invoiceSLAExceededFlag: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
          createdBy: 'SALES001',
        },
        {
          dealId: 'DEAL-002',
          customerId: 'CUST-002',
          salesRepresentativeId: 'SR002',
          dealName: '商談B',
          dealAmount: 500000,
          stageId: 'STAGE-004',
          expectedContractDate: '2025-01-10',
          contractedDate: null,
          description: 'Cancelled Deal B',
          lossReason: 'Customer request',
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-10T00:00:00Z',
          createdBy: 'SALES002',
        },
        {
          dealId: 'DEAL-003',
          customerId: 'CUST-001',
          salesRepresentativeId: 'SR001',
          dealName: '商談C',
          dealAmount: 800000,
          stageId: 'STAGE-002',
          expectedContractDate: '2025-01-25',
          contractedDate: null,
          description: 'Pending Deal C',
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-25T00:00:00Z',
          createdBy: 'SALES001',
        },
      ],
      totalCount: 3,
      fetchedAt: '2025-02-01T09:00:00Z',
    }));

    mockFetchInvoicesForPeriod.mockImplementation(async () => ({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'SR001',
          invoiceNumber: 'INV-2025-001',
          invoiceDate: '2025-01-20',
          dueDate: '2025-02-20',
          invoiceAmount: 1000000,
          taxAmount: 100000,
          untaxedAmount: 900000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2025-01-20T00:00:00Z',
          updatedAt: '2025-01-20T00:00:00Z',
          createdBy: 'BILLING001',
        },
        {
          invoiceId: 'INV-002',
          dealId: 'DEAL-003',
          customerId: 'CUST-001',
          salesRepresentativeId: 'SR001',
          invoiceNumber: 'INV-2025-002',
          invoiceDate: '2025-01-28',
          dueDate: '2025-02-28',
          invoiceAmount: 800000,
          taxAmount: 80000,
          untaxedAmount: 720000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2025-01-28T00:00:00Z',
          updatedAt: '2025-01-28T00:00:00Z',
          createdBy: 'BILLING001',
        },
        {
          invoiceId: 'INV-003',
          dealId: 'DEAL-999',
          customerId: 'CUST-001',
          salesRepresentativeId: 'SR001',
          invoiceNumber: 'INV-2025-003',
          invoiceDate: '2025-01-22',
          dueDate: '2025-02-22',
          invoiceAmount: 300000,
          taxAmount: 30000,
          untaxedAmount: 270000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'unverified',
          createdAt: '2025-01-22T00:00:00Z',
          updatedAt: '2025-01-22T00:00:00Z',
          createdBy: 'BILLING001',
        },
      ],
      totalCount: 3,
      fetchedAt: '2025-02-01T09:00:00Z',
    }));

    mockFetchAllDealStages.mockImplementation(async () => ({
      stages: [
        {
          stageId: 'STAGE-001',
          stageName: '初期接触',
          stageOrder: 1,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYS',
          updatedBy: 'SYS',
        },
        {
          stageId: 'STAGE-002',
          stageName: '提案',
          stageOrder: 2,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYS',
          updatedBy: 'SYS',
        },
        {
          stageId: 'STAGE-003',
          stageName: '成約済み',
          stageOrder: 3,
          description: null,
          contractedStageFlag: true,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYS',
          updatedBy: 'SYS',
        },
        {
          stageId: 'STAGE-004',
          stageName: 'キャンセル済み',
          stageOrder: 4,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: true,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYS',
          updatedBy: 'SYS',
        },
      ],
      totalCount: 4,
      fetchedAt: '2025-02-01T09:00:00Z',
    }));

    mockFetchAllValidationRules.mockImplementation(async () => ({
      validationRules: [
        {
          validationRuleId: 'RULE-001',
          ruleName: '商談と請求書の金額一致',
          ruleDescription: null,
          targetTable: 'Invoice',
          targetColumn: 'invoiceAmount',
          validationType: 'amount_match',
          validationCondition: 'tolerance: 5%',
          errorMessage: 'Amount difference exceeds 5% tolerance',
          warningLevel: 'high',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYS',
        },
        {
          validationRuleId: 'RULE-002',
          ruleName: '請求日が対象期間内',
          ruleDescription: null,
          targetTable: 'Invoice',
          targetColumn: 'invoiceDate',
          validationType: 'date_range',
          validationCondition: 'invoiceDate within period',
          errorMessage: 'Invoice date outside period',
          warningLevel: 'medium',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYS',
        },
        {
          validationRuleId: 'RULE-003',
          ruleName: 'キャンセル済み商談の除外',
          ruleDescription: null,
          targetTable: 'Deal',
          targetColumn: 'stageId',
          validationType: 'exclusion',
          validationCondition: 'STAGE-004 excluded',
          errorMessage: 'Cancelled deals must be excluded',
          warningLevel: 'high',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYS',
        },
      ],
      totalCount: 3,
      fetchedAt: '2025-02-01T09:00:00Z',
    }));
  });

  it('should return readyForExtraction=false when discrepancies exceed tolerance and classify issues', async () => {
    const input: PrepareMonthlyClosingInput = {
      closingInstructionId: 'CI-2025-01-001',
      targetMonth: '2025-01',
      operatorUserId: 'USR-SALES-SYS-001',
      executionTimestamp: new Date('2025-02-01T09:00:00Z'),
    };

    const result = await prepareMonthlyClosing(input);

    expect(result).toBeDefined();
    expect(result.closingPeriod.targetMonth).toBe('2025-01');

    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.customerIds).toContain('CUST-001');
    expect(result.extractionScope.customerIds).toContain('CUST-002');

    expect(result.extractionScope.exclusionRules).toBeDefined();
    expect(result.extractionScope.exclusionRules.length).toBeGreaterThan(0);

    expect(result.extractionCriteria).toBeDefined();
    expect(result.extractionCriteria.validationRulesToApply).toContain('RULE-001');
    expect(result.extractionCriteria.validationRulesToApply).toContain('RULE-002');
    expect(result.extractionCriteria.validationRulesToApply).toContain('RULE-003');

    expect(result.readyForExtraction).toBe(false);

    expect(mockFetchAllCustomers).toHaveBeenCalled();
    expect(mockFetchDealsForPeriod).toHaveBeenCalled();
    expect(mockFetchInvoicesForPeriod).toHaveBeenCalled();
    expect(mockFetchAllDealStages).toHaveBeenCalled();
    expect(mockFetchAllValidationRules).toHaveBeenCalled();
  });
});
