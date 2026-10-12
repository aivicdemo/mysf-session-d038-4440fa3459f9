import {
  validateActivityRecordForSave,
  ActivityTypeNotDefined,
} from '../../src/logic/activity-record-validation';
import * as dataValidation from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-156: 入力の活動種別がマスタに定義されていない場合、ActivityTypeNotDefinedエラーが発生する', () => {
  it('isValid が false となり、ActivityTypeNotDefined エラーが validationErrors に含まれる', async () => {
    const mockValidationRules = [
      {
        fieldName: 'activityType',
        required: true,
        type: 'string',
        validationType: 'enumeration',
      },
      {
        fieldName: 'activityDate',
        required: true,
        type: 'date',
        validationType: 'dateRange',
      },
      {
        fieldName: 'targetAccountId',
        required: true,
        type: 'string',
        validationType: 'reference',
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
          fieldName: 'activityType',
          errorCode: 'ActivityTypeNotDefined',
          message: '指定された活動種別は定義されていません: unknown_type_xyz。',
        },
      ],
      warnings: [],
    });

    const input = {
      inputActivityRecord: {
        salesRepresentativeId: 'USER-001',
        customerId: 'ACC-001',
        dealId: null,
        activityType: 'unknown_type_xyz',
        activityDate: new Date('2024-01-15'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '',
        activityContent: '顧客訪問実施',
        activityResult: '',
        nextAction: null,
        nextFollowUpDate: null,
      },
      currentDateTime: new Date('2024-01-20T10:00:00Z'),
      userId: 'USER-001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        fieldName: 'activityType',
        errorCode: 'ActivityTypeNotDefined',
        message: '指定された活動種別は定義されていません: unknown_type_xyz。',
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
