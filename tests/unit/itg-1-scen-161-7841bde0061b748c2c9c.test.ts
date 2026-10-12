import { validateActivityRecordForSave } from '../../src/logic/activity-record-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

describe('SCEN-161: ActivityDealMismatch エラーが発生する', () => {
  it('入力の取引先IDと商談IDが対応していない場合、ActivityDealMismatch エラーが発生する', async () => {
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    mockDataPersistence.fetchValidationRulesByTable.mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'rule-001',
          ruleName: 'DealAccountValidation',
          ruleDescription: null,
          targetTable: 'activity_records',
          targetColumn: 'target_account_id',
          validationType: 'REFERENCE_VALIDATION',
          validationCondition: 'deal.account_id = target_account_id',
          errorMessage: '指定された商談は指定された取引先に属していません。',
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
          activityTypeId: 'call',
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
      ],
      totalCount: 3,
      fetchedAt: currentDateTime.toISOString(),
    });

    mockDataPersistence.fetchAllActivityResults.mockResolvedValue({
      activityResults: [
        {
          activityResultId: 'positive',
          activityResultName: '前向き',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          activityResultId: 'negative',
          activityResultName: '後向き',
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
          activityFrequencyId: 'twice',
          activityFrequencyName: '2回',
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

    // 商談の accountId (CUST-002) が入力の targetAccountId (CUST-001) と一致しない
    mockDataPersistence.fetchDealById.mockResolvedValue({
      dealId: 'DEAL-999',
      customerId: 'CUST-002', // targetAccountId と異なる
      salesRepresentativeId: 'USER-123',
      dealName: 'Project Alpha',
      dealAmount: 50000,
      stageId: 'negotiation',
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
      customerId: 'CUST-001',
      customerName: 'ABC Corporation',
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
        targetAccountId: 'CUST-001',
        relatedOpportunityId: 'DEAL-999',
        activityType: 'visit',
        activityDate: new Date('2024-01-15'),
        activityContent: 'Initial meeting',
        durationMinutes: 60,
        activityResult: 'positive',
        activityFrequency: 'once',
        targetContactId: 'CONT-001',
        salesPersonId: 'USER-123',
        salesRepresentativeId: 'USER-123',
        customerId: 'CUST-001',
        activityTime: 60,
        activityCount: 1,
        dealId: 'DEAL-999',
      },
      currentDateTime,
      userId: 'USER-123',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(1);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        errorCode: expect.stringMatching(/ActivityDealMismatch|ACTIVITY_DEAL_MISMATCH/),
        message: expect.stringMatching(/指定された商談は指定された取引先に属していません/),
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
