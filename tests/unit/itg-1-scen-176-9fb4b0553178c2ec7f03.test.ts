import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { validateActivityRecordForSave, type ValidateActivityRecordForSaveInput, type ActivityRecordInput } from '../../src/logic/activity-record-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-176: エラーも警告もない場合、isValidがtrueで空のvalidationErrorsと空のwarningsが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isValid=true with empty validationErrors and warnings when all inputs are valid', async () => {
    const mockValidationRules = {
      validationRules: [
        {
          validationRuleId: 'rule-001',
          ruleName: 'activityTypeRequired',
          ruleDescription: 'activityType is required',
          targetTable: 'activities',
          targetColumn: 'activityType',
          validationType: 'required',
          validationCondition: 'pattern: ^(訪問|電話|メール|会議)$',
          errorMessage: '活動種別が無効です。',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          validationRuleId: 'rule-002',
          ruleName: 'activityDateRequired',
          ruleDescription: 'activityDate is required and not in future',
          targetTable: 'activities',
          targetColumn: 'activityDate',
          validationType: 'required',
          validationCondition: 'maxDate: today',
          errorMessage: '活動日付が不正です。',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          validationRuleId: 'rule-003',
          ruleName: 'targetAccountIdRequired',
          ruleDescription: 'targetAccountId is required',
          targetTable: 'activities',
          targetColumn: 'targetAccountId',
          validationType: 'required',
          validationCondition: 'notNull',
          errorMessage: '取引先が必須です。',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          validationRuleId: 'rule-004',
          ruleName: 'targetContactIdRequired',
          ruleDescription: 'targetContactId is required',
          targetTable: 'activities',
          targetColumn: 'targetContactId',
          validationType: 'required',
          validationCondition: 'notNull',
          errorMessage: '担当者が必須です。',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          validationRuleId: 'rule-005',
          ruleName: 'activityContentRequired',
          ruleDescription: 'activityContent is required with min length 3',
          targetTable: 'activities',
          targetColumn: 'activityContent',
          validationType: 'required',
          validationCondition: 'minLength: 3',
          errorMessage: '活動内容が必須です。',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          validationRuleId: 'rule-006',
          ruleName: 'durationMinutesRequired',
          ruleDescription: 'durationMinutes is required with range 1-1440',
          targetTable: 'activities',
          targetColumn: 'durationMinutes',
          validationType: 'required',
          validationCondition: 'min: 1, max: 1440',
          errorMessage: '活動時間が不正です。',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          validationRuleId: 'rule-007',
          ruleName: 'activityResultRequired',
          ruleDescription: 'activityResult is required',
          targetTable: 'activities',
          targetColumn: 'activityResult',
          validationType: 'required',
          validationCondition: 'notNull',
          errorMessage: '活動結果が必須です。',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          validationRuleId: 'rule-008',
          ruleName: 'activityFrequencyRequired',
          ruleDescription: 'activityFrequency is required',
          targetTable: 'activities',
          targetColumn: 'activityFrequency',
          validationType: 'required',
          validationCondition: 'notNull',
          errorMessage: '活動頻度が必須です。',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 8,
      fetchedAt: '2025-01-16T10:00:00Z',
    };

    const mockActivityTypes = {
      activityTypes: [
        {
          activityTypeId: 'ACT_TYPE_001',
          activityTypeName: '訪問',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityTypeId: 'ACT_TYPE_002',
          activityTypeName: '電話',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityTypeId: 'ACT_TYPE_003',
          activityTypeName: 'メール',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityTypeId: 'ACT_TYPE_004',
          activityTypeName: '会議',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 4,
      fetchedAt: '2025-01-16T10:00:00Z',
    };

    const mockActivityResults = {
      activityResults: [
        {
          activityResultId: 'ACT_RESULT_001',
          activityResultName: '提案完了',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityResultId: 'ACT_RESULT_002',
          activityResultName: 'ヒアリング実施',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 2,
      fetchedAt: '2025-01-16T10:00:00Z',
    };

    const mockActivityFrequencies = {
      activityFrequencies: [
        {
          activityFrequencyId: 'ACT_FREQ_001',
          activityFrequencyName: '初回接触',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityFrequencyId: 'ACT_FREQ_002',
          activityFrequencyName: 'フォローアップ',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 2,
      fetchedAt: '2025-01-16T10:00:00Z',
    };

    const mockDeal = {
      dealId: 'OPP001',
      customerId: 'CUST001',
      salesRepresentativeId: 'USER001',
      dealName: 'テスト案件',
      dealAmount: 1000000,
      stageId: '提案段階',
      expectedContractDate: '2025-02-01',
      contractedDate: null,
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'SYSTEM',
    };

    const mockCustomer = {
      customerId: 'CUST001',
      customerName: 'テスト会社',
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
      createdBy: 'SYSTEM',
      updatedBy: 'SYSTEM',
    };

    // Set up mocks for dependency calls
    const fetchValidationRulesByTableMock = dataPersistence.fetchValidationRulesByTable as jest.Mock;
    const fetchAllActivityTypesMock = dataPersistence.fetchAllActivityTypes as jest.Mock;
    const fetchAllActivityResultsMock = dataPersistence.fetchAllActivityResults as jest.Mock;
    const fetchAllActivityFrequenciesMock = dataPersistence.fetchAllActivityFrequencies as jest.Mock;
    const fetchDealByIdMock = dataPersistence.fetchDealById as jest.Mock;
    const fetchCustomerByIdMock = dataPersistence.fetchCustomerById as jest.Mock;

    // @ts-expect-error mock setup
    fetchValidationRulesByTableMock.mockResolvedValue(mockValidationRules);
    // @ts-expect-error mock setup
    fetchAllActivityTypesMock.mockResolvedValue(mockActivityTypes);
    // @ts-expect-error mock setup
    fetchAllActivityResultsMock.mockResolvedValue(mockActivityResults);
    // @ts-expect-error mock setup
    fetchAllActivityFrequenciesMock.mockResolvedValue(mockActivityFrequencies);
    // @ts-expect-error mock setup
    fetchDealByIdMock.mockResolvedValue(mockDeal);
    // @ts-expect-error mock setup
    fetchCustomerByIdMock.mockResolvedValue(mockCustomer);

    const inputActivityRecord: ActivityRecordInput = {
      salesRepresentativeId: 'USER001',
      customerId: 'CUST001',
      dealId: 'OPP001',
      activityType: '訪問',
      activityDate: new Date('2025-01-15'),
      activityTime: 60,
      activityCount: 1,
      activityFrequency: '初回接触',
      activityContent: '新規提案の詳細説明を実施',
      activityResult: '提案完了',
      nextAction: null,
      nextFollowUpDate: null,
      targetAccountId: 'ACC001',
      durationMinutes: 60,
      salesPersonId: 'USER001',
    };

    const input: ValidateActivityRecordForSaveInput = {
      inputActivityRecord,
      currentDateTime: new Date('2025-01-16T10:00:00Z'),
      userId: 'USER001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
