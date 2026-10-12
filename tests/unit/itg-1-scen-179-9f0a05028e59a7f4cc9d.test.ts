import { validateActivityRecordForSave } from '../../src/logic/activity-record-validation';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as validationRuleEngine from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchValidationRulesByTable: jest.fn(),
  fetchDealById: jest.fn(),
  fetchCustomerById: jest.fn(),
  fetchAllActivityTypes: jest.fn(),
  fetchAllActivityResults: jest.fn(),
  fetchAllActivityFrequencies: jest.fn(),
}));
jest.mock('../../src/logic/validation-rule-engine', () => ({
  ...jest.requireActual<typeof import('../../src/logic/validation-rule-engine')>('../../src/logic/validation-rule-engine'),
  validateDataAgainstRules: jest.fn(),
}));

describe('SCEN-179: 所要時間が1440分である場合、有効と判定される', () => {
  const currentDateTime = new Date('2025-01-16T10:00:00Z');
  const activityDate = new Date('2025-01-15');

  const inputActivityRecord = {
    salesRepresentativeId: 'USER001',
    customerId: 'CUST001',
    dealId: 'OPP001',
    activityType: '訪問',
    activityDate,
    activityTime: 1440,
    activityCount: 1,
    activityFrequency: '初回',
    activityContent: '顧客訪問による営業活動',
    activityResult: '受注',
    targetAccountId: 'CUST001',
    targetContactId: 'CONT001',
    relatedOpportunityId: 'OPP001',
    durationMinutes: 1440,
    salesPersonId: 'USER001',
  };

  const validationRules = [
    {
      fieldName: 'durationMinutes',
      ruleType: 'range',
      minValue: 0,
      maxValue: 1440,
      isRequired: true,
      errorMessage: '活動時間が不正です: {activityTime}。0以上の値を指定してください。',
    },
    {
      fieldName: 'activityType',
      ruleType: 'required',
      isRequired: true,
    },
    {
      fieldName: 'activityDate',
      ruleType: 'required',
      isRequired: true,
    },
    {
      fieldName: 'targetAccountId',
      ruleType: 'required',
      isRequired: true,
    },
  ];

  const activityTypeDefinitions = [
    { typeId: 'TYPE001', typeName: '訪問', isActive: true },
    { typeId: 'TYPE002', typeName: '電話', isActive: true },
  ];

  const activityResultDefinitions = [
    { resultId: 'RESULT001', resultName: '受注', isActive: true },
  ];

  const activityFrequencyDefinitions = [
    { frequencyId: 'FREQ001', frequencyName: '初回', isActive: true },
  ];

  const relatedDeal = {
    dealId: 'OPP001',
    dealName: '案件A',
    customerId: 'CUST001',
    stage: '提案中',
    amount: 500000,
    assignedUserId: 'USER001',
  };

  const relatedCustomer = {
    customerId: 'CUST001',
    customerName: '株式会社テスト',
    status: 'active',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (dataPersistence.fetchValidationRulesByTable as jest.Mock).mockResolvedValue(validationRules);
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(relatedDeal);
    (dataPersistence.fetchCustomerById as jest.Mock).mockResolvedValue(relatedCustomer);
    (dataPersistence.fetchAllActivityTypes as jest.Mock).mockResolvedValue(activityTypeDefinitions);
    (dataPersistence.fetchAllActivityResults as jest.Mock).mockResolvedValue(activityResultDefinitions);
    (dataPersistence.fetchAllActivityFrequencies as jest.Mock).mockResolvedValue(activityFrequencyDefinitions);
    (validationRuleEngine.validateDataAgainstRules as jest.Mock).mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
    });
  });

  it('should return isValid=true with empty validationErrors when duration is 1440 minutes', async () => {
    const result = await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toEqual([]);
  });

  it('should call fetchValidationRulesByTable to retrieve validation rules', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(dataPersistence.fetchValidationRulesByTable).toHaveBeenCalled();
  });

  it('should call fetchDealById to retrieve related deal', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith('OPP001');
  });

  it('should call fetchCustomerById to retrieve related customer', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(dataPersistence.fetchCustomerById).toHaveBeenCalledWith('CUST001');
  });

  it('should call fetchAllActivityTypes to retrieve activity type definitions', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(dataPersistence.fetchAllActivityTypes).toHaveBeenCalled();
  });

  it('should call fetchAllActivityResults to retrieve activity result definitions', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(dataPersistence.fetchAllActivityResults).toHaveBeenCalled();
  });

  it('should call fetchAllActivityFrequencies to retrieve activity frequency definitions', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(dataPersistence.fetchAllActivityFrequencies).toHaveBeenCalled();
  });

  it('should call validateDataAgainstRules to evaluate duration is within range', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(validationRuleEngine.validateDataAgainstRules).toHaveBeenCalled();
  });

  it('should verify durationMinutes=1440 is within range constraint (minValue=0, maxValue=1440)', async () => {
    const result = await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('should return output with isValid=true, validationErrors=[], and warnings=[]', async () => {
    const result = await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(result).toEqual({
      isValid: true,
      validationErrors: [],
      warnings: [],
    });
  });
});
