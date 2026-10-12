import { deduplicateAndIdentifyCustomer } from '../../src/logic/customer-deduplication';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
}));

describe('SCEN-320: fetchAllCustomersの戻り値が空のとき検索結果がマッチしない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchAllCustomersの戻り値が空のとき検索結果がマッチしない', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [],
      totalCount: 0,
      fetchedAt: new Date().toISOString(),
    });

    const result = await deduplicateAndIdentifyCustomer({
      searchKey: '山田太郎',
      searchKeyType: 'name',
    });

    expect(result.status).toBe('no_match');
    expect(result.identifiedCustomer).toBeNull();
    expect(result.deduplicationCandidates).toEqual([]);
  });
});
