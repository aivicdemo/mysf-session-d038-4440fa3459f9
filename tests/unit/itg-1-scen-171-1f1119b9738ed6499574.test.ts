import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { validateActivityRecordForSave, RequiredFieldMissing, type ValidateActivityRecordForSaveInput, type ActivityRecordInput } from '../../src/logic/activity-record-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-171: 活動内容が空である場合、RequiredFieldMissingエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isValid=false with RequiredFieldMissing error when activityContent is empty', async () => {
    const mockValidationRules = [
      {
        validationRuleId: 'rule-001',
        ruleName: 'activityContentRequired',
        ruleDescription: 'activityContent is required',
        targetTable: 'activities',
        targetColumn: 'activityContent',
        validationType: 'required',
        validationCondition: 'length > 0',
        errorMessage: '必須項目が入力されていません: activityContent。',
        warningLevel: 'error',
        validFlag: true,
        applicationStartDate: '2025-01-01',
        applicationEndDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      },
    ];

    const mockActivityTypes = {
      activityTypes: [
        {
          activityTypeId: 'ACT-TYPE-001',
          activityTypeName: '訪問',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-20T10:00:00Z',
    };

    const mockActivityResults = {
      activityResults: [
        {
          activityResultId: 'ACT-RESULT-001',
          activityResultName: '成功',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-20T10:00:00Z',
    };

    const mockActivityFrequencies = {
      activityFrequencies: [
        {
          activityFrequencyId: 'ACT-FREQ-001',
          activityFrequencyName: '初回',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-20T10:00:00Z',
    };

    const mockCustomer = {
      customerId: 'CUST-001',
      customerName: 'ABC株式会社',
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
    const fetchCustomerByIdMock = dataPersistence.fetchCustomerById as jest.Mock;
    const fetchDealByIdMock = dataPersistence.fetchDealById as jest.Mock;

    // @ts-expect-error mock setup
    fetchValidationRulesByTableMock.mockResolvedValue({
      validationRules: mockValidationRules,
      totalCount: 1,
      fetchedAt: '2025-01-20T10:00:00Z',
    });

    // @ts-expect-error mock setup
    fetchAllActivityTypesMock.mockResolvedValue(mockActivityTypes);
    // @ts-expect-error mock setup
    fetchAllActivityResultsMock.mockResolvedValue(mockActivityResults);
    // @ts-expect-error mock setup
    fetchAllActivityFrequenciesMock.mockResolvedValue(mockActivityFrequencies);
    // @ts-expect-error mock setup
    fetchCustomerByIdMock.mockResolvedValue(mockCustomer);
    // @ts-expect-error mock setup
    fetchDealByIdMock.mockResolvedValue(null);

    const inputActivityRecord: ActivityRecordInput = {
      salesRepresentativeId: 'USER-001',
      customerId: 'CUST-001',
      dealId: null,
      activityType: '訪問',
      activityDate: new Date('2025-01-15'),
      activityTime: 30,
      activityCount: 1,
      activityFrequency: '初回',
      activityContent: '',
      activityResult: '成功',
      nextAction: null,
      nextFollowUpDate: null,
      targetAccountId: 'ACC-001',
      durationMinutes: 30,
      salesPersonId: 'USER-001',
    };

    const input: ValidateActivityRecordForSaveInput = {
      inputActivityRecord,
      currentDateTime: new Date('2025-01-20T10:00:00Z'),
      userId: 'USER-001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings).toEqual([]);

    const requiredFieldError = result.validationErrors.find((e) => e.errorCode === 'RequiredFieldMissing' && e.fieldName === 'activityContent');
    expect(requiredFieldError).toBeDefined();
    expect(requiredFieldError?.message).toContain('必須項目が入力されていません: activityContent。');
  });
});
