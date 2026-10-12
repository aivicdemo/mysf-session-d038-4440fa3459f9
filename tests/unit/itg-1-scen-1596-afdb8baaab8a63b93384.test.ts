import { jest } from '@jest/globals';
import type {
  PrepareMonthlyClosingInput,
  PrepareMonthlyClosingOutput,
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

describe('SCEN-1596: 商談商品から期待請求金額が計算され請求金額との差異が算出される', () => {
  const mockFetchAllCustomers = dataPersistence.fetchAllCustomers as jest.Mock;
  const mockFetchDealsForPeriod = dataPersistence.fetchDealsForPeriod as jest.Mock;
  const mockFetchInvoicesForPeriod = dataPersistence.fetchInvoicesForPeriod as jest.Mock;
  const mockFetchAllDealStages = dataPersistence.fetchAllDealStages as jest.Mock;
  const mockFetchAllValidationRules = dataPersistence.fetchAllValidationRules as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFetchAllCustomers.mockImplementation(async () => ({
      customers: [
        { customerId: 'C001', customerName: '取引先A', status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'SYS', updatedBy: 'SYS' },
        { customerId: 'C002', customerName: '取引先B', status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', createdBy: 'SYS', updatedBy: 'SYS' },
      ],
      totalCount: 2,
      fetchedAt: '2024-11-05T10:00:00Z',
    }));

    mockFetchDealsForPeriod.mockImplementation(async () => ({
      deals: [
        {
          dealId: 'D001',
          customerId: 'C001',
          salesRepresentativeId: 'SR001',
          dealName: 'Deal 1',
          dealAmount: 1000000,
          stageId: 'S2',
          expectedContractDate: '2024-11-10',
          contractedDate: '2024-11-10',
          description: 'Closed Won Deal 1',
          lossReason: null,
          invoiceGenerationSLADeadline: '2024-11-20',
          invoiceSLAExceededFlag: false,
          createdAt: '2024-11-01T00:00:00Z',
          updatedAt: '2024-11-10T00:00:00Z',
          createdBy: 'SALES001',
        },
        {
          dealId: 'D002',
          customerId: 'C002',
          salesRepresentativeId: 'SR002',
          dealName: 'Deal 2',
          dealAmount: 500000,
          stageId: 'S2',
          expectedContractDate: '2024-11-15',
          contractedDate: '2024-11-15',
          description: 'Closed Won Deal 2',
          lossReason: null,
          invoiceGenerationSLADeadline: '2024-11-25',
          invoiceSLAExceededFlag: false,
          createdAt: '2024-11-01T00:00:00Z',
          updatedAt: '2024-11-15T00:00:00Z',
          createdBy: 'SALES002',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-11-05T10:00:00Z',
    }));

    mockFetchInvoicesForPeriod.mockImplementation(async () => ({
      invoices: [
        {
          invoiceId: 'IV001',
          dealId: 'D001',
          customerId: 'C001',
          salesRepresentativeId: 'SR001',
          invoiceNumber: 'INV-2024-001',
          invoiceDate: '2024-11-10',
          dueDate: '2024-12-10',
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
          createdAt: '2024-11-10T00:00:00Z',
          updatedAt: '2024-11-10T00:00:00Z',
          createdBy: 'BILLING001',
        },
        {
          invoiceId: 'IV002',
          dealId: 'D002',
          customerId: 'C002',
          salesRepresentativeId: 'SR002',
          invoiceNumber: 'INV-2024-002',
          invoiceDate: '2024-11-15',
          dueDate: '2024-12-15',
          invoiceAmount: 480000,
          taxAmount: 48000,
          untaxedAmount: 432000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-11-15T00:00:00Z',
          updatedAt: '2024-11-15T00:00:00Z',
          createdBy: 'BILLING001',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-11-05T10:00:00Z',
    }));

    mockFetchAllDealStages.mockImplementation(async () => ({
      stages: [
        {
          stageId: 'S1',
          stageName: 'Prospecting',
          stageOrder: 1,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYS',
          updatedBy: 'SYS',
        },
        {
          stageId: 'S2',
          stageName: 'Closed Won',
          stageOrder: 10,
          description: null,
          contractedStageFlag: true,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYS',
          updatedBy: 'SYS',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-11-05T10:00:00Z',
    }));

    mockFetchAllValidationRules.mockImplementation(async () => ({
      validationRules: [
        {
          validationRuleId: 'R1',
          ruleName: '商談と請求の紐付け確認',
          ruleDescription: 'Deal to Invoice linkage verification',
          targetTable: 'Deal',
          targetColumn: 'dealId',
          validationType: 'reference_integrity',
          validationCondition: 'dealId must exist in invoices',
          errorMessage: 'Deal linkage error',
          warningLevel: 'high',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYS',
        },
        {
          validationRuleId: 'R2',
          ruleName: '金額一致確認',
          ruleDescription: 'Amount matching verification',
          targetTable: 'Invoice',
          targetColumn: 'invoiceAmount',
          validationType: 'amount_match',
          validationCondition: 'invoiceAmount should match dealAmount',
          errorMessage: 'Amount mismatch error',
          warningLevel: 'high',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYS',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-11-05T10:00:00Z',
    }));
  });

  it('should prepare monthly closing with expected discrepancies calculated', async () => {
    const input: PrepareMonthlyClosingInput = {
      closingInstructionId: 'CI-2024-001',
      targetMonth: '2024-11',
      operatorUserId: 'USR-SALES-ADMIN-001',
      executionTimestamp: new Date('2024-11-05T10:00:00Z'),
    };

    const result = await prepareMonthlyClosing(input);

    expect(result).toBeDefined();
    expect(result.closingPeriod.targetMonth).toBe('2024-11');
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-11-01T00:00:00Z'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-11-30T23:59:59Z'));

    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.customerIds).toContain('C001');
    expect(result.extractionScope.customerIds).toContain('C002');
    expect(result.extractionScope.dealIds).toContain('D001');
    expect(result.extractionScope.dealIds).toContain('D002');
    expect(result.extractionScope.invoiceIds).toContain('IV001');
    expect(result.extractionScope.invoiceIds).toContain('IV002');
    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBe(2);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);

    expect(result.extractionCriteria).toBeDefined();
    expect(result.extractionCriteria.dealStageFilter).toContain('Closed Won');
    expect(result.extractionCriteria.invoiceStatusFilter).toContain('issued');
    expect(result.extractionCriteria.validationRulesToApply).toContain('R1');
    expect(result.extractionCriteria.validationRulesToApply).toContain('R2');

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(new Date('2024-11-05T10:00:00Z'));

    expect(mockFetchAllCustomers).toHaveBeenCalled();
    expect(mockFetchDealsForPeriod).toHaveBeenCalled();
    expect(mockFetchInvoicesForPeriod).toHaveBeenCalled();
    expect(mockFetchAllDealStages).toHaveBeenCalled();
    expect(mockFetchAllValidationRules).toHaveBeenCalled();
  });
});
