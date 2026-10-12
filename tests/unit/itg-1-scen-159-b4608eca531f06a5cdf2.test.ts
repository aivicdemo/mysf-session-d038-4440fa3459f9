import {
  validateActivityRecordForSave,
  RelatedDealNotFound,
} from '../../src/logic/activity-record-validation';
import * as dataValidation from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-159: 入力で指定された商談IDが存在しない場合、RelatedDealNotFoundエラーが発生する', () => {
  it('isValid が false となり、RelatedDealNotFound エラーが validationErrors に含まれる', async () => {
    const mockValidationRules = [
      {
        fieldName: 'relatedOpportunityId',
        isRequired: false,
        validationType: 'dealExists',
        ruleId: 'RULE-DEAL-001',
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
          fieldName: 'relatedOpportunityId',
          errorCode: 'RelatedDealNotFound',
          message: '指定された商談が見つかりません: OPP-999。',
        },
      ],
      warnings: [],
    });

    const input = {
      inputActivityRecord: {
        salesRepresentativeId: 'USER-001',
        customerId: 'ACC-001',
        dealId: 'OPP-999',
        activityType: '訪問',
        activityDate: new Date('2024-01-15'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '',
        activityContent: '新規営業訪問',
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
        errorCode: 'RelatedDealNotFound',
        message: '指定された商談が見つかりません: OPP-999。',
      })
    );
    expect(result.warnings).toEqual([]);
  });
});
