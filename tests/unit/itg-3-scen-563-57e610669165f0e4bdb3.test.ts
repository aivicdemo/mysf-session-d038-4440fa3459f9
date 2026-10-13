import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('retrieveLegacyAndNewSystemInvoiceData - 差異件数が1000件を超える場合の警告', () => {
  let logWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    logWarnSpy = jest.spyOn(console, 'warn');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('差異件数が1000件を超える場合、警告が記録される', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: null,
    });

    // 警告ログが記録されていることを確認
    expect(logWarnSpy).toHaveBeenCalled();
    const warnCall = logWarnSpy.mock.calls.find(call =>
      typeof call[0] === 'string' &&
      call[0].includes('差異件数が1000件を超えます') &&
      call[0].includes('2025-01-01') &&
      call[0].includes('2025-01-31') &&
      call[0].includes('1001')
    );
    expect(warnCall).toBeDefined();

    // 結果が返ることを確認
    expect(result).toBeDefined();
    expect(result.extractionTimestamp).toBeDefined();
  });
});
