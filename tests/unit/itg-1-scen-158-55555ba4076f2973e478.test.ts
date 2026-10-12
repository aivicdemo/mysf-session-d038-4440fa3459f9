import { validateActivityRecordForSave } from '../../src/logic/activity-record-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

describe('SCEN-158: ActivityFrequencyNotDefined エラーが発生する', () => {
  it('入力の活動頻度がマスタに定義されていない場合、ActivityFrequencyNotDefined エラーが発生する', async () => {
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    mockDataPersistence.fetchValidationRulesByTable.mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'rule-001',
          ruleName: 'ActivityFrequencyValidation',
          ruleDescription: null,
          targetTable: 'activity_records',
          targetColumn: 'activity_frequency',
          validationType: 'ENUM_VALIDATION',
          validationCondition: 'activity_frequency IN (AF-001, AF-002, AF-003)',
          errorMessage: '指定された活動頻度は定義されていません。',
          warningLevel: 'ERROR',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: currentDateTime.toISOString(),
    });

    mockDataPersistence.fetchAllActivityTypes.mockResolvedValue({
      activityTypes: [
        {
          activityTypeId: 'AT-001',
          activityTypeName: '訪問',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityTypeId: 'AT-002',
          activityTypeName: '電話',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 2,
      fetchedAt: currentDateTime.toISOString(),
    });

    mockDataPersistence.fetchAllActivityResults.mockResolvedValue({
      activityResults: [
        {
          activityResultId: 'AR-001',
          activityResultName: '成功',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityResultId: 'AR-002',
          activityResultName: '失敗',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 2,
      fetchedAt: currentDateTime.toISOString(),
    });

    mockDataPersistence.fetchAllActivityFrequencies.mockResolvedValue({
      activityFrequencies: [
        {
          activityFrequencyId: 'AF-001',
          activityFrequencyName: '日次',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityFrequencyId: 'AF-002',
          activityFrequencyName: '週次',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityFrequencyId: 'AF-003',
          activityFrequencyName: '月次',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 3,
      fetchedAt: currentDateTime.toISOString(),
    });

    mockDataPersistence.fetchDealById.mockResolvedValue({
      dealId: 'OPP-001',
      customerId: 'ACC-001',
      salesRepresentativeId: 'USR-12345',
      dealName: 'テスト商談',
      dealAmount: 500000,
      stageId: 'stage-001',
      expectedContractDate: '2024-02-01',
      contractedDate: null,
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'SYSTEM',
    });

    mockDataPersistence.fetchCustomerById.mockResolvedValue({
      customerId: 'ACC-001',
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
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'SYSTEM',
      updatedBy: 'SYSTEM',
    });

    const input = {
      inputActivityRecord: {
        activityType: '訪問',
        activityDate: new Date('2024-01-15'),
        targetAccountId: 'ACC-001',
        targetContactId: 'CON-001',
        activityContent: '営業訪問',
        durationMinutes: 60,
        relatedOpportunityId: 'OPP-001',
        activityFrequency: 'UNDEFINED_FREQUENCY',
        salesRepresentativeId: 'USR-12345',
        customerId: 'ACC-001',
        activityTime: 60,
        activityCount: 1,
        activityResult: '成功',
        dealId: 'OPP-001',
        salesPersonId: 'USR-12345',
      },
      currentDateTime,
      userId: 'USR-12345',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(1);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        errorCode: expect.stringMatching(/ActivityFrequencyNotDefined|ACTIVITY_FREQUENCY_NOT_DEFINED/),
        message: expect.stringMatching(/UNDEFINED_FREQUENCY/),
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
