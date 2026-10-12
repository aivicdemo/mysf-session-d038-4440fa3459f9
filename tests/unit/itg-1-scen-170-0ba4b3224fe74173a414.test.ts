import { validateActivityRecordForSave } from '../../src/logic/activity-record-validation';
import type {
  ValidateActivityRecordForSaveInput,
  ValidateActivityRecordForSaveOutput,
} from '../../src/logic/activity-record-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchValidationRulesByTable: jest.fn(),
  fetchAllActivityTypes: jest.fn(),
  fetchAllActivityResults: jest.fn(),
  fetchAllActivityFrequencies: jest.fn(),
  fetchDealById: jest.fn(),
  fetchCustomerById: jest.fn(),
}));

describe('SCEN-170: 対象責任者が未選択である場合、RequiredFieldMissingエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return RequiredFieldMissing error when targetContactId is null', async () => {
    const mockValidationRules = [
      {
        fieldName: 'targetContactId',
        isRequired: true,
        dataType: 'string',
        errorMessage: '必須項目が入力されていません: {fieldName}。',
      },
      {
        fieldName: 'activityType',
        isRequired: true,
        dataType: 'string',
      },
      {
        fieldName: 'activityDate',
        isRequired: true,
        dataType: 'date',
      },
      {
        fieldName: 'targetAccountId',
        isRequired: true,
        dataType: 'string',
      },
    ];

    const mockActivityTypes = [
      { typeId: 'TYPE001', typeName: '訪問', isActive: true },
      { typeId: 'TYPE002', typeName: '電話', isActive: true },
      { typeId: 'TYPE003', typeName: 'メール', isActive: true },
    ];

    const mockActivityResults = [
      { resultId: 'RES001', resultName: '成功', isActive: true },
      { resultId: 'RES002', resultName: '失敗', isActive: true },
    ];

    const mockActivityFrequencies = [
      { frequencyId: 'FREQ001', frequencyName: '日次', isActive: true },
      { frequencyId: 'FREQ002', frequencyName: '週次', isActive: true },
    ];

    const mockDeal = {
      dealId: 'OPP001',
      dealName: '案件A',
      customerId: 'ACC001',
      stage: '提案',
      amount: 1000000,
    };

    const mockCustomer = {
      customerId: 'ACC001',
      customerName: '顧客A',
      status: 'active',
    };

    (dataPersistence.fetchValidationRulesByTable as jest.Mock).mockResolvedValue(mockValidationRules);
    (dataPersistence.fetchAllActivityTypes as jest.Mock).mockResolvedValue(mockActivityTypes);
    (dataPersistence.fetchAllActivityResults as jest.Mock).mockResolvedValue(mockActivityResults);
    (dataPersistence.fetchAllActivityFrequencies as jest.Mock).mockResolvedValue(mockActivityFrequencies);
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDeal);
    (dataPersistence.fetchCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

    const input: ValidateActivityRecordForSaveInput = {
      inputActivityRecord: {
        salesRepresentativeId: 'USR001',
        customerId: 'ACC001',
        dealId: 'OPP001',
        activityType: '訪問',
        activityDate: new Date('2024-01-15'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '日次',
        activityContent: '営業活動記録',
        activityResult: '成功',
        targetAccountId: 'ACC001',
        durationMinutes: 60,
        salesPersonId: 'USR001',
      },
      currentDateTime: new Date('2024-01-20T10:00:00Z'),
      userId: 'USR001',
    };

    const result: ValidateActivityRecordForSaveOutput = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(1);
    const targetContactIdError = result.validationErrors.find(
      (err) => err.fieldName === 'targetContactId' && err.errorCode === 'RequiredFieldMissing'
    );
    expect(targetContactIdError).toBeDefined();
    expect(targetContactIdError?.message).toBe('必須項目が入力されていません: targetContactId。');
    expect(result.warnings).toEqual([]);
  });
});
