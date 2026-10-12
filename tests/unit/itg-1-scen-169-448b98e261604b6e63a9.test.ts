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

describe('SCEN-169: 対象取引先が未選択である場合、RequiredFieldMissingエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return RequiredFieldMissing error when customerId is null', async () => {
    const mockValidationRules = [
      {
        fieldName: 'targetAccountId',
        isRequired: true,
        fieldType: 'string',
        validationRule: 'required',
      },
      {
        fieldName: 'activityType',
        isRequired: true,
        fieldType: 'string',
        validationRule: 'required',
      },
      {
        fieldName: 'activityDate',
        isRequired: true,
        fieldType: 'date',
        validationRule: 'required',
      },
    ];

    const mockActivityTypes = [
      { id: 'type-001', name: '訪問', isActive: true },
      { id: 'type-002', name: '電話', isActive: true },
    ];

    (dataPersistence.fetchValidationRulesByTable as jest.Mock).mockResolvedValue(mockValidationRules);
    (dataPersistence.fetchAllActivityTypes as jest.Mock).mockResolvedValue(mockActivityTypes);
    (dataPersistence.fetchAllActivityResults as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchAllActivityFrequencies as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(null);
    (dataPersistence.fetchCustomerById as jest.Mock).mockResolvedValue(null);

    const input: ValidateActivityRecordForSaveInput = {
      inputActivityRecord: {
        salesRepresentativeId: 'user-001',
        customerId: null as any,
        dealId: null,
        activityType: '訪問',
        activityDate: new Date('2025-01-15'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '',
        activityContent: '営業打ち合わせ',
        activityResult: '',
        targetAccountId: null,
        durationMinutes: 60,
        salesPersonId: 'user-001',
      },
      currentDateTime: new Date('2025-01-20T10:00:00Z'),
      userId: 'user-001',
    };

    const result: ValidateActivityRecordForSaveOutput = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(1);
    const customerIdError = result.validationErrors.find(
      (err) => err.fieldName === 'customerId' && err.errorCode === 'RequiredFieldMissing'
    );
    expect(customerIdError).toBeDefined();
    expect(customerIdError?.message).toBe('必須項目が入力されていません: customerId。');
    expect(result.warnings).toEqual([]);
  });
});
