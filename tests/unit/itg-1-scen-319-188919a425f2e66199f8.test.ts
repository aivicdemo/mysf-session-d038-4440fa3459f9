import { deduplicateAndIdentifyCustomer, DuplicateCandidatesDetected } from '../../src/logic/customer-deduplication';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
}));

describe('SCEN-319: DuplicateCandidatesDetected エラーが発生し統合候補が提示される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検索キーに部分一致する顧客が複数存在するときDuplicateCandidatesDetectedエラーが発生し統合候補が提示される', async () => {
    const mockCustomers = [
      {
        customerId: 'C001',
        customerName: '山田太郎',
        phoneNumber: '090-1234-5678',
        emailAddress: 'yamada.taro@example.com',
        customerNameKana: null,
        customerType: null,
        address: null,
        status: null,
        createdAt: '',
        updatedAt: '',
        createdBy: '',
        updatedBy: '',
      },
      {
        customerId: 'C002',
        customerName: '山田花子',
        phoneNumber: '090-9876-5432',
        emailAddress: 'yamada.hanako@example.com',
        customerNameKana: null,
        customerType: null,
        address: null,
        status: null,
        createdAt: '',
        updatedAt: '',
        createdBy: '',
        updatedBy: '',
      },
      {
        customerId: 'C003',
        customerName: '山田次郎',
        phoneNumber: '090-5555-5555',
        emailAddress: 'yamada.jiro@example.com',
        customerNameKana: null,
        customerType: null,
        address: null,
        status: null,
        createdAt: '',
        updatedAt: '',
        createdBy: '',
        updatedBy: '',
      },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: mockCustomers,
      totalCount: 3,
      fetchedAt: new Date().toISOString(),
    });

    await expect(deduplicateAndIdentifyCustomer({
      searchKey: '山田',
      searchKeyType: 'name',
    })).rejects.toThrow(DuplicateCandidatesDetected);
  });
});
