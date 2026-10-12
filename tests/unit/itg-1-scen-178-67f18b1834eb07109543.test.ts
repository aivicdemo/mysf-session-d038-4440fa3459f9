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

describe('SCEN-178: 所要時間が1分である場合、有効と判定される', () => {
  const currentDateTime = new Date('2025-01-16T10:00:00Z');
  const activityDate = new Date('2025-01-15');

  const inputActivityRecord = {
    salesRepresentativeId: 'USER-001',
    customerId: 'CUST-001',
    dealId: 'OPP-001',
    activityType: '訪問',
    activityDate,
    activityTime: 1,
    activityCount: 1,
    activityFrequency: '初回',
    activityContent: '提案ヒアリング実施',
    activityResult: '成功',
    targetAccountId: 'CUST-001',
    targetContactId: 'CONT-001',
    relatedOpportunityId: 'OPP-001',
    durationMinutes: 1,
    salesPersonId: 'USER-001',
  };

  const validationRules = [
    {
      fieldName: 'durationMinutes',
      ruleName: 'duration_range',
      description: '活動に要した時間は1分以上1440分以下',
    },
    {
      fieldName: 'activityContent',
      ruleName: 'content_minimum_length',
      description: '活動内容は3文字以上',
    },
  ];

  const activityTypeDefinitions = [
    { id: 'TYPE-001', name: '訪問', isActive: true },
    { id: 'TYPE-002', name: '電話', isActive: true },
    { id: 'TYPE-003', name: 'メール', isActive: true },
  ];

  const activityResultDefinitions = [
    { id: 'RESULT-001', name: '成功', isActive: true },
    { id: 'RESULT-002', name: '未決定', isActive: true },
  ];

  const activityFrequencyDefinitions = [
    { id: 'FREQ-001', name: '初回', isActive: true },
    { id: 'FREQ-002', name: '継続', isActive: true },
  ];

  const relatedDeal = {
    id: 'OPP-001',
    customerId: 'CUST-001',
    stage: '提案中',
    amount: 500000,
    assignedUserId: 'USER-001',
  };

  const relatedCustomer = {
    id: 'CUST-001',
    name: '株式会社ABC',
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

  it('should return isValid=true with empty validationErrors when duration is 1 minute', async () => {
    const result = await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER-001',
    });

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toEqual([]);
  });

  it('should call fetchValidationRulesByTable to retrieve durationMinutes validation rule', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER-001',
    });

    expect(dataPersistence.fetchValidationRulesByTable).toHaveBeenCalled();
  });

  it('should call fetchDealById to verify deal exists and is assigned to the user', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER-001',
    });

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith('OPP-001');
  });

  it('should call fetchCustomerById to verify customer is active', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER-001',
    });

    expect(dataPersistence.fetchCustomerById).toHaveBeenCalledWith('CUST-001');
  });

  it('should call fetchAllActivityTypes to verify activity type is defined and active', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER-001',
    });

    expect(dataPersistence.fetchAllActivityTypes).toHaveBeenCalled();
  });

  it('should call validateDataAgainstRules to evaluate duration is within range', async () => {
    await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER-001',
    });

    expect(validationRuleEngine.validateDataAgainstRules).toHaveBeenCalled();
  });

  it('should confirm all validation checks pass without errors or warnings', async () => {
    const result = await validateActivityRecordForSave({
      inputActivityRecord,
      currentDateTime,
      userId: 'USER-001',
    });

    expect(result.isValid).toBe(true);
    expect(result.validationErrors.length).toBe(0);
    expect(result.warnings.length).toEqual(0);
  });
});
