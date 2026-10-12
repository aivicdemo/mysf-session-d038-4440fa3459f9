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

describe('SCEN-167: 活動種別が空である場合、RequiredFieldMissingエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return RequiredFieldMissing error when activityType is empty', async () => {
    const mockValidationRules = [
      {
        fieldName: 'activityType',
        isRequired: true,
        dataType: 'string',
        validationRule: 'must_not_be_empty',
      },
      {
        fieldName: 'activityDate',
        isRequired: true,
        dataType: 'date',
        validationRule: 'must_be_past_or_today',
      },
    ];

    const mockActivityTypes = [
      { id: 'TYPE-001', name: '訪問', isActive: true },
      { id: 'TYPE-002', name: '電話', isActive: true },
      { id: 'TYPE-003', name: 'メール', isActive: true },
    ];

    const mockActivityResults = [
      { id: 'RESULT-001', name: '成功', isActive: true },
      { id: 'RESULT-002', name: '継続中', isActive: true },
    ];

    const mockActivityFrequencies = [
      { id: 'FREQ-001', name: '初回', isActive: true },
      { id: 'FREQ-002', name: 'フォローアップ', isActive: true },
    ];

    const mockDeal = {
      id: 'OPP-001',
      customerId: 'CUST-001',
      dealName: '案件A',
      dealStage: '提案中',
      dealAmount: 500000,
      isActive: true,
    };

    const mockCustomer = {
      id: 'CUST-001',
      customerName: '株式会社サンプル',
      status: 'active',
      industry: '製造業',
    };

    (dataPersistence.fetchValidationRulesByTable as jest.Mock).mockResolvedValue(mockValidationRules);
    (dataPersistence.fetchAllActivityTypes as jest.Mock).mockResolvedValue(mockActivityTypes);
    (dataPersistence.fetchAllActivityResults as jest.Mock).mockResolvedValue(mockActivityResults);
    (dataPersistence.fetchAllActivityFrequencies as jest.Mock).mockResolvedValue(mockActivityFrequencies);
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDeal);
    (dataPersistence.fetchCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

    const input: ValidateActivityRecordForSaveInput = {
      inputActivityRecord: {
        salesRepresentativeId: 'USER-001',
        customerId: 'CUST-001',
        dealId: 'OPP-001',
        activityType: '',
        activityDate: new Date('2025-06-15'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '初回',
        activityContent: '顧客との打ち合わせ内容',
        activityResult: '成功',
        targetAccountId: 'CUST-001',
        durationMinutes: 60,
        salesPersonId: 'USER-001',
      },
      currentDateTime: new Date('2025-06-20T10:00:00Z'),
      userId: 'USER-001',
    };

    const result: ValidateActivityRecordForSaveOutput = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(1);
    const activityTypeError = result.validationErrors.find(
      (err) => err.fieldName === 'activityType' && err.errorCode === 'RequiredFieldMissing'
    );
    expect(activityTypeError).toBeDefined();
    expect(activityTypeError?.message).toBe('必須項目が入力されていません: activityType。');
    expect(result.warnings).toEqual([]);
  });
});
