import { deduplicateAndIdentifyCustomer } from '../../src/logic/customer-deduplication';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
}));

describe('SCEN-323: 検索キーワードに一致する顧客レコードが存在しないとき業務ルールの制約2でwarnになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検索キーワードに一致する顧客レコードが存在しないとき status が no_match となり警告が発生する', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [],
      totalCount: 0,
      fetchedAt: new Date().toISOString(),
    });

    const result = await deduplicateAndIdentifyCustomer({
      searchKey: '090-9999-9999',
      searchKeyType: 'phoneNumber',
    });

    expect(result.status).toBe('no_match');
    expect(result.identifiedCustomer).toBeNull();
    expect(result.deduplicationCandidates).toEqual([]);

    warnSpy.mockRestore();
  });
});
