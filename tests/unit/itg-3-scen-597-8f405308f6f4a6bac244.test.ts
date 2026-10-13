import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
  type LegacyInvoiceRecord,
} from '../../src/logic/legacy-new-system-data-retrieval';
import type { NewSystemInvoiceRecord } from '../../src/logic/discrepancy-persistence';

describe('SCEN-597: 金額ズレが100万円以上のとき、優先度が「緊急」に設定される', () => {
  it('旧システム金額5,000,000円、新システム金額3,900,000円で金額ズレ1,100,000円のとき、優先度が「緊急」に設定されること', async () => {
    // Preconditions from specs.json
    const periodStart = '2024-10-01';
    const periodEnd = '2024-10-31';

    // Step: Call retrieveLegacyAndNewSystemInvoiceData with periodStart='2024-10-01', periodEnd='2024-10-31', dealIdRange=undefined
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart,
      periodEnd,
      dealIdRange: undefined,
    };

    const result = await retrieveLegacyAndNewSystemInvoiceData(input);

    // Expected Result Verification:
    // - normalizedComparisonData 配列内の該当レコード（dealId='DEAL-100'）に対して、
    //   priority フィールドが '緊急' に設定されていること
    // - legacyAmount=5,000,000、newSystemAmount=3,900,000であり、
    //   金額ズレが1,100,000円（100万円以上）であることが確認できること
    // - extractionTimestamp は ISO 8601 形式の日時文字列が設定されていること

    const output = result as RetrieveLegacyAndNewSystemInvoiceDataOutput;

    // Verify the normalized comparison data contains the target record with dealId='DEAL-100'
    const targetRecord = output.normalizedComparisonData.find(
      (record: any) => record.dealId === 'DEAL-100'
    );
    expect(targetRecord).toBeDefined();

    if (targetRecord) {
      // Verify priority field is set to '緊急'
      expect(targetRecord).toHaveProperty('priority', '緊急');

      // Verify legacyAmount and newSystemAmount values
      expect(targetRecord).toHaveProperty('legacyAmount', 5000000);
      expect(targetRecord).toHaveProperty('newSystemAmount', 3900000);

      // Verify amount difference is 1,100,000 (which is >= 1,000,000)
      const amountDifference = Math.abs(targetRecord.legacyAmount - targetRecord.newSystemAmount);
      expect(amountDifference).toBe(1100000);
      expect(amountDifference).toBeGreaterThanOrEqual(1000000);
    }

    // Verify extractionTimestamp is in ISO 8601 format
    expect(output.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
