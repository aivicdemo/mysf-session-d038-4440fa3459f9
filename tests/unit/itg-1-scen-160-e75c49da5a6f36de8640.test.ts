import {
  validateActivityRecordForSave,
  RelatedCustomerNotFound,
} from '../../src/logic/activity-record-validation';
import * as dataValidation from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-160: 入力で指定された取引先IDが存在しない場合、RelatedCustomerNotFoundエラーが発生する', () => {
  it('isValid が false となり、RelatedCustomerNotFound エラーが validationErrors に含まれる', async () => {
    const mockValidationRules = [
      {
        fieldName: 'targetAccountId',
        isRequired: true,
        validationType: 'exists',
        description: '取引先IDは必須で、マスタに存在する必要があります',
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
          fieldName: 'targetAccountId',
          errorCode: 'RelatedCustomerNotFound',
          message: '指定された取引先が見つかりません: CUST-99999。',
        },
      ],
      warnings: [],
    });

    const input = {
      inputActivityRecord: {
        salesRepresentativeId: 'USER-001',
        customerId: 'CUST-99999',
        dealId: null,
        activityType: '訪問',
        activityDate: new Date('2024-01-15'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '',
        activityContent: '初回ヒアリング実施',
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
        errorCode: 'RelatedCustomerNotFound',
        message: '指定された取引先が見つかりません: CUST-99999。',
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
