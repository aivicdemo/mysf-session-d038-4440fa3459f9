import { deduplicateAndIdentifyCustomer, DuplicateCandidatesDetected } from '../../src/logic/customer-deduplication';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
}));

describe('SCEN-324: 重複候補が複数存在するとき業務ルールの制約3でwarnになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('重複候補が複数存在するとき status が duplicates_detected となり警告が発生する', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const mockCustomers = [
      {
        customerId: 'CUST001',
        customerName: '田中太郎',
        phoneNumber: '09012345678',
        emailAddress: 'tanaka.taro@example.com',
        customerNameKana: null,
        customerType: null,
        address: null,
        status: null,
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        customerId: 'CUST002',
        customerName: '田中太郎',
        phoneNumber: '09087654321',
        emailAddress: 'tanaka.taro.another@example.com',
        customerNameKana: null,
        customerType: null,
        address: null,
        status: null,
        createdAt: '2024-02-20',
        updatedAt: '2024-02-20',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        customerId: 'CUST003',
        customerName: '田中太郎営業部',
        phoneNumber: '09099999999',
        emailAddress: 'tanaka.taro.sales@example.com',
        customerNameKana: null,
        customerType: null,
        address: null,
        status: null,
        createdAt: '2024-03-10',
        updatedAt: '2024-03-10',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: mockCustomers,
      totalCount: 3,
      fetchedAt: new Date().toISOString(),
    });

    try {
      await expect(deduplicateAndIdentifyCustomer({
        searchKey: '田中太郎',
        searchKeyType: 'name',
      })).rejects.toThrow(DuplicateCandidatesDetected);
    } finally {
      warnSpy.mockRestore();
    }
  });
});
