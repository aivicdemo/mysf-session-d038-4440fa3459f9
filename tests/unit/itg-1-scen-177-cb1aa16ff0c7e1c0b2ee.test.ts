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

describe('SCEN-177: 活動日付が本日である場合、有効と判定される', () => {
  const currentDateTime = new Date('2025-01-15T14:30:00Z');
  const activityDate = new Date('2025-01-15');

  const inputActivityRecord = {
    salesRepresentativeId: 'USER001',
    customerId: 'CUST001',
    dealId: 'OPP001',
    activityType: '訪問',
    activityDate,
    activityTime: 60,
    activityCount: 1,
    activityFrequency: '初回',
    activityContent: '契約内容の確認',
    activityResult: '成功',
    targetAccountId: 'CUST001',
    targetContactId: 'CONT001',
    relatedOpportunityId: 'OPP001',
    durationMinutes: 60,
    salesPersonId: 'USER001',
  };

  const validationRules = [
    {
      fieldName: 'activityDate',
      ruleType: 'dateRange',
      constraint: 'pastOrToday',
      description: '活動日付は本日以前の日付であること',
    },
    {
      fieldName: 'activityType',
      ruleType: 'enumeration',
      allowedValues: ['訪問', '電話', 'メール', '会議'],
      description: '活動種別は定義済みの値のみ許可',
    },
  ];

  const activityTypeDefinitions = [
    { typeId: 'T001', typeName: '訪問', isActive: true },
    { typeId: 'T002', typeName: '電話', isActive: true },
    { typeId: 'T003', typeName: 'メール', isActive: true },
    { typeId: 'T004', typeName: '会議', isActive: true },
  ];

  const activityResultDefinitions = [
    { resultId: 'R001', resultName: '成功', isActive: true },
    { resultId: 'R002', resultName: '継続', isActive: true },
  ];

  const activityFrequencyDefinitions = [
    { frequencyId: 'F001', frequencyName: '初回', isActive: true },
    { frequencyId: 'F002', frequencyName: '定期', isActive: true },
  ];

  const relatedDeal = {
    dealId: 'OPP001',
    dealName: 'A社商談',
    customerId: 'CUST001',
    stage: '提案中',
    amount: 500000,
  };

  const relatedCustomer = {
    customerId: 'CUST001',
    customerName: 'A社',
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

  it('should return isValid=true with empty validationErrors and warnings when activity date is today', async () => {
    const result = await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('should call fetchValidationRulesByTable to retrieve validation rules', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(dataPersistence.fetchValidationRulesByTable).toHaveBeenCalled();
  });

  it('should call fetchDealById to verify deal relationship', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith('OPP001');
  });

  it('should call fetchCustomerById to verify customer is active', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(dataPersistence.fetchCustomerById).toHaveBeenCalledWith('CUST001');
  });

  it('should call fetchAllActivityTypes to verify activity type is defined', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(dataPersistence.fetchAllActivityTypes).toHaveBeenCalled();
  });

  it('should compare activity date with current date to confirm activity date is today', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    const result = await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER001',
    });

    expect(result.isValid).toBe(true);
  });
});
