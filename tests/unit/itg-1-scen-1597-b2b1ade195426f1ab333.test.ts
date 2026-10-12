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

describe('SCEN-1597: 差異額が許容範囲以内なら一致判定が真で返される', () => {
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
      fetchedAt: '2024-02-01T09:00:00Z',
    }));

    mockFetchDealsForPeriod.mockImplementation(async () => ({
      deals: [
        {
          dealId: 'D001',
          customerId: 'C001',
          salesRepresentativeId: 'SR001',
          dealName: '商談1',
          dealAmount: 1000000,
          stageId: 'S5',
          expectedContractDate: '2024-01-15',
          contractedDate: '2024-01-15',
          description: 'Closed Won Deal',
          lossReason: null,
          invoiceGenerationSLADeadline: '2024-01-25',
          invoiceSLAExceededFlag: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          createdBy: 'SALES001',
        },
        {
          dealId: 'D002',
          customerId: 'C002',
          salesRepresentativeId: 'SR002',
          dealName: '商談2',
          dealAmount: 500000,
          stageId: 'S5',
          expectedContractDate: '2024-01-25',
          contractedDate: '2024-01-25',
          description: 'Closed Won Deal',
          lossReason: null,
          invoiceGenerationSLADeadline: '2024-02-05',
          invoiceSLAExceededFlag: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-25T00:00:00Z',
          createdBy: 'SALES002',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-02-01T09:00:00Z',
    }));

    mockFetchInvoicesForPeriod.mockImplementation(async () => ({
      invoices: [
        {
          invoiceId: 'INV001',
          dealId: 'D001',
          customerId: 'C001',
          salesRepresentativeId: 'SR001',
          invoiceNumber: 'INV-2024-001',
          invoiceDate: '2024-01-16',
          dueDate: '2024-02-16',
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
          createdAt: '2024-01-16T00:00:00Z',
          updatedAt: '2024-01-16T00:00:00Z',
          createdBy: 'BILLING001',
        },
        {
          invoiceId: 'INV002',
          dealId: 'D002',
          customerId: 'C002',
          salesRepresentativeId: 'SR002',
          invoiceNumber: 'INV-2024-002',
          invoiceDate: '2024-01-26',
          dueDate: '2024-02-26',
          invoiceAmount: 500000,
          taxAmount: 50000,
          untaxedAmount: 450000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-01-26T00:00:00Z',
          updatedAt: '2024-01-26T00:00:00Z',
          createdBy: 'BILLING001',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-02-01T09:00:00Z',
    }));

    mockFetchAllDealStages.mockImplementation(async () => ({
      stages: [
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
          createdBy: 'SYS',
          updatedBy: 'SYS',
        },
        {
          stageId: 'STAGE-05',
          stageName: '成約',
          stageOrder: 5,
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
      fetchedAt: '2024-02-01T09:00:00Z',
    }));

    mockFetchAllValidationRules.mockImplementation(async () => ({
      validationRules: [
        {
          validationRuleId: 'VR001',
          ruleName: '金額一致確認',
          ruleDescription: '商談金額と請求金額の差異が許容範囲内であること',
          targetTable: 'Invoice',
          targetColumn: 'invoiceAmount',
          validationType: 'amount_match',
          validationCondition: 'tolerance: 5%',
          errorMessage: 'Amount difference exceeds tolerance',
          warningLevel: 'high',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYS',
        },
        {
          validationRuleId: 'VR002',
          ruleName: 'ステータス整合性',
          ruleDescription: '商談ステータスと請求ステータスが整合していること',
          targetTable: 'Invoice',
          targetColumn: 'invoiceStatus',
          validationType: 'status_match',
          validationCondition: 'dealStatus matches invoiceStatus',
          errorMessage: 'Status mismatch',
          warningLevel: 'medium',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYS',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-02-01T09:00:00Z',
    }));
  });

  it('should return readyForExtraction=true when all amount differences are within tolerance', async () => {
    const input: PrepareMonthlyClosingInput = {
      closingInstructionId: 'CI-2024-001',
      targetMonth: '2024-01',
      operatorUserId: 'USER-SYS-001',
      executionTimestamp: new Date('2024-02-01T09:00:00Z'),
    };

    const result = await prepareMonthlyClosing(input);

    expect(result).toBeDefined();
    expect(result.closingPeriod.targetMonth).toBe('2024-01');
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-01-31T23:59:59Z'));

    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBe(2);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);

    expect(result.extractionCriteria.validationRulesToApply).toContain('VR001');
    expect(result.extractionCriteria.validationRulesToApply).toContain('VR002');

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(new Date('2024-02-01T09:00:00Z'));
  });
});
