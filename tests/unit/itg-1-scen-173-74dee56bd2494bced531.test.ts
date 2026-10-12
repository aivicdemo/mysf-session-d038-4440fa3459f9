import { validateActivityRecordForSave } from '../../src/logic/activity-record-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

describe('SCEN-173: 所要時間が1440分を超える場合、警告が返される', () => {
  it('所要時間が1440分を超える場合、警告が返され保存は可能と判定される', async () => {
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
          warningLevel: 'WARNING',
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
          activityTypeId: 'TYPE001',
          activityTypeName: '訪問',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityTypeId: 'TYPE002',
          activityTypeName: '電話',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityTypeId: 'TYPE003',
          activityTypeName: 'メール',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityTypeId: 'TYPE004',
          activityTypeName: '会議',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 4,
      fetchedAt: currentDateTime.toISOString(),
    });

    mockDataPersistence.fetchAllActivityResults.mockResolvedValue({
      activityResults: [
        {
          activityResultId: 'RESULT001',
          activityResultName: '成功',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityResultId: 'RESULT002',
          activityResultName: '失敗',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityResultId: 'RESULT003',
          activityResultName: '保留',
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

    mockDataPersistence.fetchAllActivityFrequencies.mockResolvedValue({
      activityFrequencies: [
        {
          activityFrequencyId: 'FREQ001',
          activityFrequencyName: '日次',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityFrequencyId: 'FREQ002',
          activityFrequencyName: '週次',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityFrequencyId: 'FREQ003',
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
      dealId: 'OPP001',
      customerId: 'CUST001',
      salesRepresentativeId: 'USER001',
      dealName: 'テスト商談',
      dealAmount: 1000000,
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
        activityContent: '営業打ち合わせ実施',
        durationMinutes: 1500, // 1440分を超える
        relatedOpportunityId: 'OPP001',
        salesPersonId: 'USER001',
        salesRepresentativeId: 'USER001',
        customerId: 'CUST001',
        activityTime: 1500,
        activityCount: 1,
        activityResult: '成功',
        activityFrequency: '日次',
        dealId: 'OPP001',
      },
      currentDateTime,
      userId: 'USER001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toEqual([]);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        message: expect.stringMatching(/24時間|1440分|所要時間/),
      })
    );
  });
});
