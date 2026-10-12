import { validateActivityRecordForSave, ValidationRuleEvaluationFailed } from '../../src/logic/activity-record-validation';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as validationRuleEngine from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-166: ValidationRuleEvaluationFailed error when validation rule engine fails', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;
  const mockValidationRuleEngine = validationRuleEngine as jest.Mocked<typeof validationRuleEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should raise ValidationRuleEvaluationFailed error when validateDataAgainstRules throws', async () => {
    const inputActivityRecord = {
      salesRepresentativeId: 'USR001',
      customerId: 'ACC001',
      dealId: 'OPP001',
      activityType: '訪問',
      activityDate: new Date('2024-01-15'),
      activityTime: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityContent: '営業訪問',
      activityResult: '商談進展',
      nextFollowUpDate: null,
      nextAction: null,
    };

    const currentDateTime = new Date('2024-01-20T10:00:00Z');
    const userId = 'USR001';

    const activeValidationRules = {
      validationRules: [
        {
          validationRuleId: 'RULE001',
          ruleName: 'ActivityTypeRequired',
          ruleDescription: 'Activity type is required',
          targetTable: 'activity_record',
          targetColumn: 'activityType',
          validationType: 'required',
          validationCondition: 'value must not be empty',
          errorMessage: 'Activity type is required',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
        {
          validationRuleId: 'RULE002',
          ruleName: 'ActivityDateValidation',
          ruleDescription: 'Activity date must be in the past',
          targetTable: 'activity_record',
          targetColumn: 'activityDate',
          validationType: 'dateRange',
          validationCondition: 'date must be before or equal to today',
          errorMessage: 'Activity date must be in the past',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
        {
          validationRuleId: 'RULE003',
          ruleName: 'DurationMinutesValidation',
          ruleDescription: 'Duration must be between 1 and 1440 minutes',
          targetTable: 'activity_record',
          targetColumn: 'activityTime',
          validationType: 'numericRange',
          validationCondition: 'value >= 1 AND value <= 1440',
          errorMessage: 'Duration must be between 1 and 1440 minutes',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 3,
      fetchedAt: '2024-01-20T10:00:00Z',
    };

    const relatedDeal = {
      dealId: 'OPP001',
      customerId: 'ACC001',
      salesRepresentativeId: 'USR001',
      dealName: '案件A',
      dealAmount: 1000000,
      stageId: 'STAGE002',
      expectedContractDate: '2024-02-15',
      contractedDate: null,
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      createdBy: 'admin',
    };

    const relatedCustomer = {
      customerId: 'ACC001',
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
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin',
      updatedBy: 'admin',
    };

    const activityTypeDefinitions = {
      activityTypes: [
        {
          activityTypeId: 'AT001',
          activityTypeName: '訪問',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
        {
          activityTypeId: 'AT002',
          activityTypeName: '電話',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-20T10:00:00Z',
    };

    const activityResultDefinitions = {
      activityResults: [
        {
          activityResultId: 'AR001',
          activityResultName: '商談進展',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
        {
          activityResultId: 'AR002',
          activityResultName: '継続検討',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-20T10:00:00Z',
    };

    const activityFrequencyDefinitions = {
      activityFrequencies: [
        {
          activityFrequencyId: 'AF001',
          activityFrequencyName: '初回',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
        {
          activityFrequencyId: 'AF002',
          activityFrequencyName: 'フォローアップ',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-20T10:00:00Z',
    };

    mockDataPersistence.fetchValidationRulesByTable.mockResolvedValue(activeValidationRules);
    mockDataPersistence.fetchDealById.mockResolvedValue(relatedDeal);
    mockDataPersistence.fetchCustomerById.mockResolvedValue(relatedCustomer);
    mockDataPersistence.fetchAllActivityTypes.mockResolvedValue(activityTypeDefinitions);
    mockDataPersistence.fetchAllActivityResults.mockResolvedValue(activityResultDefinitions);
    mockDataPersistence.fetchAllActivityFrequencies.mockResolvedValue(activityFrequencyDefinitions);

    // Simulate error in validation rule engine
    mockValidationRuleEngine.validateDataAgainstRules.mockRejectedValue(
      new Error('検証ルールエンジンでシステムエラーが発生')
    );

    await expect(
      validateActivityRecordForSave({
        inputActivityRecord,
        currentDateTime,
        userId,
      })
    ).rejects.toThrow(ValidationRuleEvaluationFailed);

    // Verify the error message
    try {
      await validateActivityRecordForSave({
        inputActivityRecord,
        currentDateTime,
        userId,
      });
    } catch (error) {
      if (error instanceof ValidationRuleEvaluationFailed) {
        expect(error.message).toBe('検証ルールの評価に失敗しました。システム管理者に確認してください。');
      } else {
        throw error;
      }
    }
  });
});
