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

describe('SCEN-168: 活動日付が空である場合、RequiredFieldMissingエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return RequiredFieldMissing error when activityDate is empty', async () => {
    const mockValidationRules = [
      {
        fieldName: 'activityDate',
        required: true,
        type: 'date',
      },
    ];

    const mockActivityTypes = [
      { typeCode: '訪問', typeName: '訪問', isActive: true },
      { typeCode: '電話', typeName: '電話', isActive: true },
    ];

    const mockActivityResults = [
      { resultCode: '成功', resultName: '成功', isActive: true },
    ];

    const mockActivityFrequencies = [];

    const mockDeal = {
      dealId: 'OPP001',
      customerId: 'CUST001',
      dealName: '営業商談001',
      stage: '提案',
      amount: 1000000,
    };

    const mockCustomer = {
      customerId: 'CUST001',
      customerName: '株式会社テスト',
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
        salesRepresentativeId: 'USER001',
        customerId: 'CUST001',
        dealId: 'OPP001',
        activityType: '訪問',
        activityDate: new Date(''),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '',
        activityContent: '新規営業提案',
        activityResult: '成功',
        targetAccountId: 'CUST001',
        durationMinutes: 60,
        salesPersonId: 'USER001',
      },
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      userId: 'USER001',
    };

    const result: ValidateActivityRecordForSaveOutput = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(1);
    const activityDateError = result.validationErrors.find(
      (err) => err.fieldName === 'activityDate' && err.errorCode === 'RequiredFieldMissing'
    );
    expect(activityDateError).toBeDefined();
    expect(activityDateError?.message).toBe('必須項目が入力されていません: activityDate。');
    expect(result.warnings).toEqual([]);
  });
});
