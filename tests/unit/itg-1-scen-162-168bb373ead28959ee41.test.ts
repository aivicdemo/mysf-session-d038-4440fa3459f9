import {
  validateActivityRecordForSave,
  ActivityDateInvalid,
} from '../../src/logic/activity-record-validation';
import * as dataValidation from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-162: 活動日付が本日より後の未来日である場合、ActivityDateInvalidエラーが発生する', () => {
  it('isValid が false となり、ActivityDateInvalid エラーが validationErrors に含まれる', async () => {
    const mockValidationRules = [
      {
        fieldName: 'activityDate',
        ruleType: 'date_range',
        constraint: 'must_be_today_or_past',
        enabled: true,
      },
      {
        fieldName: 'activityType',
        ruleType: 'required',
        enabled: true,
      },
      {
        fieldName: 'targetAccountId',
        ruleType: 'required',
        enabled: true,
      },
    ];

    (dataValidation.loadActiveValidationRules as jest.Mock).mockResolvedValue({
      rules: mockValidationRules,
      ruleCount: 3,
    });

    (dataValidation.validateDataAgainstRules as jest.Mock).mockResolvedValue({
      isValid: false,
      errors: [
        {
          fieldName: 'activityDate',
          errorCode: 'ActivityDateInvalid',
          message: '活動日付が不正です: 2026-10-09。本日以前の日付を指定してください。',
        },
      ],
      warnings: [],
    });

    const input = {
      inputActivityRecord: {
        salesRepresentativeId: 'USER001',
        customerId: 'CUST001',
        dealId: 'OPP001',
        activityType: '訪問',
        activityDate: new Date('2026-10-09'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '',
        activityContent: '新製品説明会での訪問',
        activityResult: '',
        nextAction: null,
        nextFollowUpDate: null,
      },
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      userId: 'USER001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        fieldName: 'activityDate',
        errorCode: 'ActivityDateInvalid',
        message: '活動日付が不正です: 2026-10-09。本日以前の日付を指定してください。',
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
