import {
  validateActivityRecordForSave,
  ActivityValidationError,
  ActivityValidationWarning,
  ValidateActivityRecordForSaveOutput,
} from '../../src/logic/activity-record-validation';
import * as dataValidation from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-152: すべての検証ルールが取得でき、入力値が営業プロセス標準に適合している場合、保存可能と判定される', () => {
  it('isValid が true を返し、validationErrors と warnings が空配列である', async () => {
    const mockValidationRules = [
      {
        fieldName: 'activityType',
        ruleType: 'required',
        isActive: true,
      },
      {
        fieldName: 'activityDate',
        ruleType: 'required',
        isActive: true,
      },
      {
        fieldName: 'activityDate',
        ruleType: 'dateRange',
        maxDate: 'today',
        isActive: true,
      },
      {
        fieldName: 'durationMinutes',
        ruleType: 'range',
        minValue: 0,
        maxValue: 1440,
        isActive: true,
      },
      {
        fieldName: 'targetAccountId',
        ruleType: 'required',
        isActive: true,
      },
      {
        fieldName: 'targetContactId',
        ruleType: 'required',
        isActive: true,
      },
      {
        fieldName: 'activityContent',
        ruleType: 'required',
        isActive: true,
      },
    ];

    (dataValidation.loadActiveValidationRules as jest.Mock).mockResolvedValue({
      rules: mockValidationRules,
      ruleCount: 7,
    });

    (dataValidation.validateDataAgainstRules as jest.Mock).mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
    });

    const input = {
      inputActivityRecord: {
        salesRepresentativeId: 'SALES001',
        customerId: 'CUST001',
        dealId: 'OPP001',
        activityType: '訪問',
        activityDate: new Date('2024-01-15'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '初回',
        activityContent: '営業戦略についてのヒアリング実施',
        activityResult: '',
        nextAction: null,
        nextFollowUpDate: null,
      },
      currentDateTime: new Date('2024-01-16T10:00:00Z'),
      userId: 'SALES001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result).toEqual(
      expect.objectContaining({
        isValid: true,
        validationErrors: [],
        warnings: [],
      })
    );

    expect(dataValidation.loadActiveValidationRules).toHaveBeenCalled();
    expect(dataValidation.validateDataAgainstRules).toHaveBeenCalled();
  });
});
