import { deduplicateAndIdentifyCustomer, SearchKeyEmpty } from '../../src/logic/customer-deduplication';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
}));

describe('SCEN-322: 検索キーが空文字列または空白のみのとき業務ルールの制約1でthrowになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検索キーが空文字列のとき SearchKeyEmpty エラーが throw される', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [],
      totalCount: 0,
      fetchedAt: new Date().toISOString(),
    });

    await expect(deduplicateAndIdentifyCustomer({
      searchKey: '',
      searchKeyType: 'name',
    })).rejects.toThrow(SearchKeyEmpty);
  });
});
