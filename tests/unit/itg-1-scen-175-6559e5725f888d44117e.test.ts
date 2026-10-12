import { validateActivityRecordForSave } from '../../src/logic/activity-record-validation';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchValidationRulesByTable: jest.fn(),
  fetchAllActivityTypes: jest.fn(),
  fetchAllActivityResults: jest.fn(),
  fetchAllActivityFrequencies: jest.fn(),
  fetchDealById: jest.fn(),
  fetchCustomerById: jest.fn(),
}));

jest.mock('../../src/logic/validation-rule-engine', () => ({
  ...jest.requireActual<typeof import('../../src/logic/validation-rule-engine')>('../../src/logic/validation-rule-engine'),
  validateDataAgainstRules: jest.fn(),
}));

import * as dataPersistence from '../../src/logic/data-persistence';
import * as validationRuleEngine from '../../src/logic/validation-rule-engine';

describe('SCEN-175: エラーなく警告がある場合、isValidがtrueで1件以上のwarningsが返される', () => {
  it('出力型ValidateActivityRecordForSaveOutputのisValidがtrue、validationErrorsが空配列、warningsが1件以上のActivityValidationWarningを含む配列を返す', async () => {

    const currentDateTime = new Date('2024-01-20T10:00:00Z');
    const activityDate = new Date('2024-01-15');

    const validationRules = [
      { fieldName: 'activityContent', ruleType: 'minLength', ruleValue: 3, severity: 'warning' },
      { fieldName: 'durationMinutes', ruleType: 'range', minValue: 1, maxValue: 1440, severity: 'warning' },
    ];

    const activityTypes = [
      { id: 'TYPE001', name: '訪問', isActive: true },
      { id: 'TYPE002', name: '電話', isActive: true },
    ];

    const activityResults = [
      { id: 'RESULT001', name: '成功', isActive: true },
    ];

    const activityFrequencies = [
      { id: 'FREQ001', name: '初回', isActive: true },
    ];

    const relatedDeal = {
      id: 'OPP001',
      customerId: 'CUST001',
      stage: '提案段階',
      amount: 500000,
      ownerId: 'USER001',
    };

    const relatedCustomer = {
      id: 'CUST001',
      name: '株式会社ABC',
      status: 'active',
    };

    (dataPersistence.fetchValidationRulesByTable as jest.Mock).mockResolvedValue(validationRules);
    (dataPersistence.fetchAllActivityTypes as jest.Mock).mockResolvedValue(activityTypes);
    (dataPersistence.fetchAllActivityResults as jest.Mock).mockResolvedValue(activityResults);
    (dataPersistence.fetchAllActivityFrequencies as jest.Mock).mockResolvedValue(activityFrequencies);
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(relatedDeal);
    (dataPersistence.fetchCustomerById as jest.Mock).mockResolvedValue(relatedCustomer);

    (validationRuleEngine.validateDataAgainstRules as jest.Mock).mockResolvedValue({
      validationErrors: [],
      warnings: [
        { fieldName: 'activityResult', message: '活動結果が指定されていません', severity: 'warning' },
        { fieldName: 'nextFollowUpDate', message: '次回フォローアップ予定日が指定されていません', severity: 'warning' },
      ],
    });

    const input = {
      inputActivityRecord: {
        activityType: '訪問',
        activityDate: activityDate,
        targetAccountId: 'CUST001',
        targetContactId: 'CONT001',
        activityContent: '製品説明会実施',
        durationMinutes: 60,
        relatedOpportunityId: 'OPP001',
        salesPersonId: 'USER001',
        salesRepresentativeId: 'USER001',
        customerId: 'CUST001',
        dealId: 'OPP001',
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '初回',
        activityResult: '',
        nextFollowUpDate: undefined,
      },
      currentDateTime: currentDateTime,
      userId: 'USER001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toEqual([]);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        fieldName: 'activityResult',
        message: '活動結果が指定されていません',
      })
    );
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        fieldName: 'nextFollowUpDate',
        message: '次回フォローアップ予定日が指定されていません',
      })
    );
  });
});
