import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-555: 旧新システムのデータ抽出時刻が5分以上異なるとき、警告が記録される', () => {
  const mockLegacyInvoices = [
    {
      invoiceId: 'LEGACY-001',
      dealId: 'DEAL-100',
      invoiceAmount: 150000,
      invoiceStatus: '確定',
      generatedDateTime: '2024-01-15T09:30:00Z',
      extractionTimestamp: '2024-01-15T10:00:00Z',
    },
  ];

  const mockNewSystemInvoices = [
    {
      invoiceId: 'NEW-001',
      dealId: 'DEAL-100',
      invoiceAmount: 150000,
      invoiceStatus: '確定',
      generatedDateTime: '2024-01-15T14:35:00Z',
      extractionTimestamp: '2024-01-15T15:05:00Z',
    },
  ];

  const mockNormalizedData = [
    {
      legacyInvoiceId: 'LEGACY-001',
      newSystemInvoiceId: 'NEW-001',
      dealId: 'DEAL-100',
      legacyGeneratedDateTime: '2024-01-15T09:30:00Z',
      newSystemGeneratedDateTime: '2024-01-15T14:35:00Z',
      timeDifferenceMinutes: 305,
      legacyAmount: 150000,
      newSystemAmount: 150000,
      amountMatch: true,
      extractionTimeWarning: 'データ抽出時刻が5分以上異なります',
    },
  ];


  it('should include extraction time warning in normalized data', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    const normalizedData = result.normalizedComparisonData;
    expect(normalizedData.length).toBe(1);

    const record = normalizedData[0];
    expect(record.extractionTimeWarning).toBe('データ抽出時刻が5分以上異なります');
    expect(record.timeDifferenceMinutes).toBe(305);
  });

  it('should process successfully despite time difference warning', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toEqual(mockLegacyInvoices);
    expect(result.newSystemInvoices).toEqual(mockNewSystemInvoices);
    expect(result.extractionTimestamp).toBeDefined();

    const timestamp = new Date(result.extractionTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
  });

  it('should record extraction timestamps from both systems', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    const record = result.normalizedComparisonData[0];
    expect(record.legacyGeneratedDateTime).toBe('2024-01-15T09:30:00Z');
    expect(record.newSystemGeneratedDateTime).toBe('2024-01-15T14:35:00Z');
  });
});
