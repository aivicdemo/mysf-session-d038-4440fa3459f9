import {
  validateActivityRecordForSave,
  ValidationRuleNotFound,
} from '../../src/logic/activity-record-validation';
import * as dataValidation from '../../src/logic/validation-rule-engine';

jest.mock('../../src/logic/validation-rule-engine');

describe('SCEN-153: 検証ルール定義が取得できない場合、ValidationRuleNotFoundエラーが発生する', () => {
  it('ValidationRuleNotFound エラーが発生する', async () => {
    (dataValidation.loadActiveValidationRules as jest.Mock).mockResolvedValue(null);

    const input = {
      inputActivityRecord: {
        salesRepresentativeId: 'USER001',
        customerId: 'CUST001',
        dealId: 'OPP001',
        activityType: '訪問',
        activityDate: new Date('2025-01-15'),
        activityTime: 60,
        activityCount: 1,
        activityFrequency: '',
        activityContent: '顧客訪問',
        activityResult: '',
        nextAction: null,
        nextFollowUpDate: null,
      },
      currentDateTime: new Date('2025-01-20T10:00:00Z'),
      userId: 'USER001',
    };

    await expect(validateActivityRecordForSave(input)).rejects.toThrow(
      ValidationRuleNotFound
    );
  });
});
