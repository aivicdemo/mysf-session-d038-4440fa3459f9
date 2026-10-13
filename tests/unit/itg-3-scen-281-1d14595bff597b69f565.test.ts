import { retrieveLegacyAndNewSystemSalesData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-281: 抽出実行日時をISO 8601形式で返却する', () => {
  it('extractionTimestampがISO 8601形式（YYYY-MM-DDTHH:mm:ss.sssZ または YYYY-MM-DDTHH:mm:ssZ）で返却される', async () => {
    const result = await retrieveLegacyAndNewSystemSalesData({
      periodStart: '2024-01-01T00:00:00Z',
      periodEnd: '2024-01-31T23:59:59Z',
      dealIdRange: null,
    });

    // extractionTimestampが定義されていること
    expect(result.extractionTimestamp).toBeDefined();

    // ISO 8601形式（YYYY-MM-DDTHH:mm:ss.sssZ または YYYY-MM-DDTHH:mm:ssZ）であること
    const iso8601WithMillisecond = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    const iso8601WithoutMillisecond = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

    const isValidISO8601 =
      iso8601WithMillisecond.test(result.extractionTimestamp) ||
      iso8601WithoutMillisecond.test(result.extractionTimestamp);

    expect(isValidISO8601).toBe(true);

    // ISO 8601形式の文字列として有効な日時であること
    const timestamp = new Date(result.extractionTimestamp);
    expect(!isNaN(timestamp.getTime())).toBe(true);
  });
});
