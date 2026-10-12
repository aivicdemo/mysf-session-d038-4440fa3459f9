import { validateActivityRecordForSave, NextFollowUpDateInvalid } from '../../src/logic/activity-record-validation';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as validationRuleEngine from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-165: NextFollowUpDateInvalid error when next follow-up date is before activity date', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;
  const mockValidationRuleEngine = validationRuleEngine as jest.Mocked<typeof validationRuleEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should raise NextFollowUpDateInvalid error when nextFollowUpDate is before activityDate', async () => {
    const inputActivityRecord = {
      salesRepresentativeId: 'USER001',
      customerId: 'CUST001',
      dealId: 'OPP001',
      activityType: '訪問',
      activityDate: new Date('2025-01-15'),
      activityTime: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityContent: '商品説明会を実施',
      activityResult: '完了',
      nextFollowUpDate: new Date('2025-01-14'),
      nextAction: null,
    };

    const currentDateTime = new Date('2025-01-20T10:00:00Z');
    const userId = 'USER001';

    const activeValidationRules = {
      validationRules: [
        {
          validationRuleId: 'RULE001',
          ruleName: 'ActivityDateValidation',
          ruleDescription: 'Activity date validation rule',
          targetTable: 'activity_record',
          targetColumn: 'activityDate',
          validationType: 'dateRange',
          validationCondition: 'date must be in the past',
          errorMessage: 'Activity date must be in the past',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
        {
          validationRuleId: 'RULE002',
          ruleName: 'NextFollowUpDateValidation',
          ruleDescription: 'Next follow up date validation rule',
          targetTable: 'activity_record',
          targetColumn: 'nextFollowUpDate',
          validationType: 'dateComparison',
          validationCondition: 'nextFollowUpDate >= activityDate',
          errorMessage: 'Next follow up date must be after activity date',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 2,
      fetchedAt: '2025-01-20T10:00:00Z',
    };

    const relatedDeal = {
      dealId: 'OPP001',
      customerId: 'CUST001',
      salesRepresentativeId: 'USER001',
      dealName: 'Test Deal',
      dealAmount: 500000,
      stageId: 'STAGE001',
      expectedContractDate: '2025-02-15',
      contractedDate: null,
      description: 'Test deal description',
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
      createdBy: 'admin',
    };

    const relatedCustomer = {
      customerId: 'CUST001',
      customerName: 'テスト取引先',
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
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin',
      updatedBy: 'admin',
    };

    const activityTypeDefinitions = {
      activityTypes: [
        {
          activityTypeId: 'TYPE001',
          activityTypeName: '訪問',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
        {
          activityTypeId: 'TYPE002',
          activityTypeName: '電話',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 2,
      fetchedAt: '2025-01-20T10:00:00Z',
    };

    const activityResultDefinitions = {
      activityResults: [
        {
          activityResultId: 'RES001',
          activityResultName: '完了',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-20T10:00:00Z',
    };

    const activityFrequencyDefinitions = {
      activityFrequencies: [
        {
          activityFrequencyId: 'FREQ001',
          activityFrequencyName: '初回',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-20T10:00:00Z',
    };

    mockDataPersistence.fetchValidationRulesByTable.mockResolvedValue(activeValidationRules);
    mockDataPersistence.fetchDealById.mockResolvedValue(relatedDeal);
    mockDataPersistence.fetchCustomerById.mockResolvedValue(relatedCustomer);
    mockDataPersistence.fetchAllActivityTypes.mockResolvedValue(activityTypeDefinitions);
    mockDataPersistence.fetchAllActivityResults.mockResolvedValue(activityResultDefinitions);
    mockDataPersistence.fetchAllActivityFrequencies.mockResolvedValue(activityFrequencyDefinitions);

    // Simulate successful validation rules application
    mockValidationRuleEngine.validateDataAgainstRules.mockResolvedValue({
      isValid: true,
      validationResults: [],
      errorSummary: null,
    });

    const result = await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId,
    });

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        errorCode: 'NextFollowUpDateInvalid',
        message: '次回フォローアップ予定日は活動日付以降の日付を指定してください。',
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
