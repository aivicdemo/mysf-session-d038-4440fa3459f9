import {
  validateActivityRecordForSave,
  RequiredFieldMissing,
} from '../../src/logic/activity-record-validation';
import * as dataValidation from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-154: 必須項目が入力に含まれていない場合、RequiredFieldMissingエラーが発生する', () => {
  it('isValid が false となり、RequiredFieldMissing エラーが validationErrors に含まれる', async () => {
    const mockValidationRules = [
      {
        fieldName: 'activityType',
        isRequired: true,
        dataType: 'string',
        validationRule: '必須項目',
      },
      {
        fieldName: 'activityDate',
        isRequired: true,
        dataType: 'date',
        validationRule: '必須項目',
      },
      {
        fieldName: 'targetAccountId',
        isRequired: true,
        dataType: 'string',
        validationRule: '必須項目',
      },
      {
        fieldName: 'targetContactId',
        isRequired: true,
        dataType: 'string',
        validationRule: '必須項目',
      },
      {
        fieldName: 'activityContent',
        isRequired: true,
        dataType: 'string',
        validationRule: '必須項目',
      },
      {
        fieldName: 'durationMinutes',
        isRequired: true,
        dataType: 'number',
        validationRule: '必須項目',
      },
    ];

    (dataValidation.loadActiveValidationRules as jest.Mock).mockResolvedValue({
      rules: mockValidationRules,
      ruleCount: 6,
    });

    (dataValidation.validateDataAgainstRules as jest.Mock).mockResolvedValue({
      isValid: false,
      errors: [
        {
          fieldName: 'activityType',
          errorCode: 'RequiredFieldMissing',
          message: '必須項目が入力されていません: activityType。',
        },
      ],
      warnings: [],
    });

    const input = {
      inputActivityRecord: {
        salesRepresentativeId: 'USER001',
        customerId: 'CUST001',
        dealId: 'OPP001',
        activityType: '',
        activityDate: new Date('2025-01-15'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '',
        activityContent: '営業ヒアリング',
        activityResult: null,
        nextAction: null,
        nextFollowUpDate: null,
      },
      currentDateTime: new Date('2025-01-20T10:00:00Z'),
      userId: 'USER001',
    };

    const result = await validateActivityRecordForSave(input);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        fieldName: 'activityType',
        errorCode: 'RequiredFieldMissing',
        message: '必須項目が入力されていません: activityType。',
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
