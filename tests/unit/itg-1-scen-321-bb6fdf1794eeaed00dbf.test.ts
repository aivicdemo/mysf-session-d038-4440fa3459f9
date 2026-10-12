import { deduplicateAndIdentifyCustomer, DuplicateCandidatesDetected } from '../../src/logic/customer-deduplication';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
}));

describe('SCEN-321: 業務ルールの計算式が検索キーワードに対して正確に類似度を計算し候補を抽出する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('業務ルールの計算式が検索キーワードに対して正確に類似度を計算し候補を抽出する', async () => {
    const mockCustomers = [
      {
        customerId: 'C001',
        customerName: '田中太郎',
        phoneNumber: '090-1234-5678',
        emailAddress: 'tanaka@example.com',
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
        customerId: 'C002',
        customerName: '田中太郎様',
        phoneNumber: '090-1234-5679',
        emailAddress: 'tanaka2@example.com',
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
        customerId: 'C003',
        customerName: '田中次郎',
        phoneNumber: '090-9876-5432',
        emailAddress: 'tanaka.jiro@example.com',
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

    await expect(deduplicateAndIdentifyCustomer({
      searchKey: '田中太郎',
      searchKeyType: 'name',
    })).rejects.toThrow(DuplicateCandidatesDetected);
  });
});
