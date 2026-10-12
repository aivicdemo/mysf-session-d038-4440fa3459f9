import {
  validateActivityRecordForSave,
  ActivityResultNotDefined,
} from '../../src/logic/activity-record-validation';
import * as dataValidation from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-157: 入力の活動結果がマスタに定義されていない場合、ActivityResultNotDefinedエラーが発生する', () => {
  it('isValid が false となり、ActivityResultNotDefined エラーが validationErrors に含まれる', async () => {
    const mockValidationRules = [
      {
        fieldName: 'activityResult',
        ruleType: 'enum',
        required: true,
        validValues: ['completed', 'pending', 'cancelled'],
      },
      {
        fieldName: 'activityType',
        ruleType: 'enum',
        required: true,
        validValues: ['訪問', '電話', 'メール', '会議'],
      },
    ];

    (dataValidation.loadActiveValidationRules as jest.Mock).mockResolvedValue({
      rules: mockValidationRules,
      ruleCount: 2,
    });

    (dataValidation.validateDataAgainstRules as jest.Mock).mockResolvedValue({
      isValid: false,
      errors: [
        {
          fieldName: 'activityResult',
          errorCode: 'ActivityResultNotDefined',
          message: '指定された活動結果は定義されていません: undefined_result。',
        },
      ],
      warnings: [],
    });

    const input = {
      inputActivityRecord: {
        salesRepresentativeId: 'USER123',
        customerId: 'CUST001',
        dealId: 'OPP001',
        activityType: '訪問',
        activityDate: new Date('2025-01-15'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: 'weekly',
        activityContent: '製品説明会実施',
        activityResult: 'undefined_result',
        nextAction: null,
        nextFollowUpDate: new Date('2025-01-22'),
      },
      currentDateTime: new Date('2025-01-20T10:00:00Z'),
      userId: 'USER123',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        fieldName: 'activityResult',
        errorCode: 'ActivityResultNotDefined',
        message: '指定された活動結果は定義されていません: undefined_result。',
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
