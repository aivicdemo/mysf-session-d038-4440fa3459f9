import { validateActivityRecordForSave } from '../../src/logic/activity-record-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

describe('SCEN-174: エラーが1件以上ある場合、isValid が false で 1 件以上の validationErrors が返される', () => {
  it('入力の活動種別がマスタに定義されていない場合、ActivityTypeNotDefined エラーが返される', async () => {
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    mockDataPersistence.fetchValidationRulesByTable.mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'rule-001',
          ruleName: 'ActivityTypeValidation',
          ruleDescription: null,
          targetTable: 'activity_records',
          targetColumn: 'activity_type',
          validationType: 'enum',
          validationCondition: 'activity_type IN (visit, phone, email, meeting)',
          errorMessage: '指定された活動種別は定義されていません。',
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
          activityTypeId: 'visit',
          activityTypeName: '訪問',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityTypeId: 'phone',
          activityTypeName: '電話',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityTypeId: 'email',
          activityTypeName: 'メール',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityTypeId: 'meeting',
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
          activityResultId: 'success',
          activityResultName: '成功',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityResultId: 'failure',
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
          activityFrequencyId: 'once',
          activityFrequencyName: '1回',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityFrequencyId: 'weekly',
          activityFrequencyName: '週1回',
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

    mockDataPersistence.fetchCustomerById.mockResolvedValue({
      customerId: 'cust_001',
      customerName: 'Customer A',
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

    mockDataPersistence.fetchDealById.mockResolvedValue({
      dealId: 'opp_001',
      customerId: 'cust_001',
      salesRepresentativeId: 'user_001',
      dealName: 'Test Deal',
      dealAmount: 50000,
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

    const input = {
      inputActivityRecord: {
        activityType: 'invalid_type_xyz', // 定義されていない活動種別
        activityDate: new Date('2024-01-15'),
        targetAccountId: 'cust_001',
        targetContactId: 'contact_001',
        activityContent: 'Initial meeting',
        durationMinutes: 60,
        relatedOpportunityId: 'opp_001',
        salesPersonId: 'user_001',
        salesRepresentativeId: 'user_001',
        customerId: 'cust_001',
        activityTime: 60,
        activityCount: 1,
        activityResult: 'success',
        activityFrequency: 'once',
        dealId: 'opp_001',
      },
      currentDateTime,
      userId: 'user_001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(1);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        errorCode: expect.stringMatching(/ActivityTypeNotDefined|ACTIVITY_TYPE_NOT_DEFINED/),
        message: expect.stringMatching(/invalid_type_xyz/),
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
