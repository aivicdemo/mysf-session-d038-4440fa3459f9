import {
  validateActivityRecordForSave,
  ActivityTimeInvalid,
} from '../../src/logic/activity-record-validation';
import * as dataValidation from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-163: 活動時間が営業プロセス標準の範囲外（負数、過度に大きい値）である場合、ActivityTimeInvalidエラーが発生する', () => {
  it('isValid が false となり、ActivityTimeInvalid エラーが validationErrors に含まれる', async () => {
    const mockValidationRules = [
      {
        fieldName: 'durationMinutes',
        ruleType: 'range',
        minValue: 0,
        maxValue: 1440,
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
          fieldName: 'durationMinutes',
          errorCode: 'ActivityTimeInvalid',
          message: '活動時間が不正です: -30。0以上の値を指定してください。',
        },
      ],
      warnings: [],
    });

    const input = {
      inputActivityRecord: {
        salesRepresentativeId: 'SP001',
        customerId: 'ACC001',
        dealId: 'OPP001',
        activityType: '訪問',
        activityDate: new Date('2024-01-15'),
        activityTime: -30,
        activityCount: 1,
        activityFrequency: '',
        activityContent: '新製品説明',
        activityResult: '',
        nextAction: null,
        nextFollowUpDate: null,
      },
      currentDateTime: new Date('2024-01-20T10:00:00Z'),
      userId: 'SP001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        fieldName: 'durationMinutes',
        errorCode: 'ActivityTimeInvalid',
        message: '活動時間が不正です: -30。0以上の値を指定してください。',
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
