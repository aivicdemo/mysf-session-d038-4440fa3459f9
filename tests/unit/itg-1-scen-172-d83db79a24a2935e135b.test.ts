import { validateActivityRecordForSave } from '../../src/logic/activity-record-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

describe('SCEN-172: ActivityTimeInvalid エラーが発生する', () => {
  it('所要時間が0以下である場合、ActivityTimeInvalid エラーが発生する', async () => {
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    mockDataPersistence.fetchValidationRulesByTable.mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'rule-001',
          ruleName: 'ActivityTimeRange',
          ruleDescription: null,
          targetTable: 'activity_records',
          targetColumn: 'duration_minutes',
          validationType: 'range',
          validationCondition: 'duration_minutes >= 1 AND duration_minutes <= 1440',
          errorMessage: '活動時間が不正です。0以上の値を指定してください。',
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
          activityTypeId: 'ACT001',
          activityTypeName: '訪問',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityTypeId: 'ACT002',
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
          activityResultId: 'RES001',
          activityResultName: '受注',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: currentDateTime.toISOString(),
    });

    mockDataPersistence.fetchAllActivityFrequencies.mockResolvedValue({
      activityFrequencies: [
        {
          activityFrequencyId: 'FREQ001',
          activityFrequencyName: '初回',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: currentDateTime.toISOString(),
    });

    mockDataPersistence.fetchDealById.mockResolvedValue({
      dealId: 'OPP001',
      customerId: 'CUST001',
      salesRepresentativeId: 'USER001',
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
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'SYSTEM',
      updatedBy: 'SYSTEM',
    });

    const input = {
      inputActivityRecord: {
        activityType: '訪問',
        activityDate: new Date('2024-01-15'),
        targetAccountId: 'CUST001',
        targetContactId: 'CONT001',
        activityContent: '営業ヒアリング実施',
        durationMinutes: -30, // 負の値
        relatedOpportunityId: 'OPP001',
        salesPersonId: 'USER001',
        salesRepresentativeId: 'USER001',
        customerId: 'CUST001',
        activityTime: -30,
        activityCount: 1,
        activityResult: '受注',
        activityFrequency: '初回',
        dealId: 'OPP001',
      },
      currentDateTime,
      userId: 'USER001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(1);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        errorCode: expect.stringMatching(/ActivityTimeInvalid|ACTIVITY_TIME_INVALID/),
        message: expect.stringMatching(/-30|0以上/),
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
