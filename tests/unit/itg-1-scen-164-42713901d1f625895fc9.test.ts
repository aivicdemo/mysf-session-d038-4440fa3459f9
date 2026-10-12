import {
  validateActivityRecordForSave,
  ActivityCountInvalid,
} from '../../src/logic/activity-record-validation';
import * as dataValidation from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-164: 活動件数が営業プロセス標準の範囲外（負数、0）である場合、ActivityCountInvalidエラーが発生する', () => {
  it('isValid が false となり、ActivityCountInvalid エラーが validationErrors に含まれる', async () => {
    const mockValidationRules = [
      {
        fieldName: 'activityCount',
        ruleName: 'ActivityCountRangeRule',
        expectedValue: '1以上の整数',
        isRequired: true,
      },
    ];

    (dataValidation.loadActiveValidationRules as jest.Mock).mockResolvedValue({
      rules: mockValidationRules,
      ruleCount: 1,
    });

    (dataValidation.validateDataAgainstRules as jest.Mock).mockResolvedValue({
      isValid: false,
      errors: [
        {
          fieldName: 'activityCount',
          errorCode: 'ActivityCountInvalid',
          message: '活動件数が不正です: -1。1以上の値を指定してください。',
        },
      ],
      warnings: [],
    });

    const input = {
      inputActivityRecord: {
        salesRepresentativeId: 'USER001',
        customerId: 'ACC001',
        dealId: 'OPP001',
        activityType: '訪問',
        activityDate: new Date('2025-01-15'),
        activityTime: 60,
        activityCount: -1,
        activityFrequency: '',
        activityContent: '新製品説明',
        activityResult: '',
        nextAction: null,
        nextFollowUpDate: new Date('2025-01-20'),
      },
      currentDateTime: new Date('2025-01-16T10:00:00Z'),
      userId: 'USER001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        fieldName: 'activityCount',
        errorCode: 'ActivityCountInvalid',
        message: '活動件数が不正です: -1。1以上の値を指定してください。',
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
