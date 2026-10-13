import { validateDataIntegrityForMonthlyClose, StatusCorrespondenceViolation } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-065: 商談ステータスと請求ステータスの対応ルール定義がないとき、ステータス対応ルール検証エラーが発生する', () => {
  it('ステータス対応ルール定義が空配列のときステータス対応ルール検証エラーが発生する', async () => {
    const input = {
      dealRecords: [
        {
          dealId: 'DEAL-001',
          accountId: 'ACC-001',
          dealStatus: '成約',
          dealAmount: 100000,
          invoiceIds: ['INV-001'],
        },
      ],
      invoiceRecords: [
        {
          invoiceId: 'INV-001',
          accountId: 'ACC-001',
          dealId: 'DEAL-001',
          invoiceStatus: '請求済み',
          invoiceAmount: 100000,
        },
      ],
      statusCorrespondenceRules: [],
      amountToleranceCriteria: {
        tolerancePercentage: 5,
        toleranceAbsoluteAmount: 1000,
      },
      executionTimestamp: new Date('2025-01-15T10:30:00Z'),
    };

    await expect(validateDataIntegrityForMonthlyClose(input)).rejects.toThrow(
      StatusCorrespondenceViolation
    );
  });
});
