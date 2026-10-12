import {
  validateActivityRecordForSave,
  InvalidFieldValue,
} from '../../src/logic/activity-record-validation';
import * as dataValidation from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-155: 入力値が営業プロセス標準の形式・範囲に適合していない場合、InvalidFieldValueエラーが発生する', () => {
  it('isValid が false となり、InvalidFieldValue エラーが validationErrors に含まれる', async () => {
    const mockValidationRules = [
      {
        fieldName: 'activityType',
        ruleType: 'enum',
        isRequired: true,
      },
      {
        fieldName: 'durationMinutes',
        ruleType: 'range',
        minValue: 1,
        maxValue: 1440,
        isRequired: true,
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
          fieldName: 'activityType',
          errorCode: 'InvalidFieldValue',
          message:
            '入力値が不正です: activityType。期待値: 訪問/電話/メール/会議のいずれか、実際の値: invalid_type_xyz。',
        },
      ],
      warnings: [],
    });

    const input = {
      inputActivityRecord: {
        salesRepresentativeId: 'USER001',
        customerId: 'CUST001',
        dealId: 'OPP001',
        activityType: 'invalid_type_xyz',
        activityDate: new Date('2024-01-15'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '',
        activityContent: 'Meeting discussion',
        activityResult: '',
        nextAction: null,
        nextFollowUpDate: null,
      },
      currentDateTime: new Date('2024-01-20T10:00:00Z'),
      userId: 'USER001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        fieldName: 'activityType',
        errorCode: 'InvalidFieldValue',
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
