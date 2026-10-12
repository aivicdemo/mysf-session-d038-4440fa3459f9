import { saveSalesRepresentative, SaveSalesRepresentativeInput, DuplicateEmailAddress } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
}));

describe('SCEN-751: 更新時に入力メールアドレスが同一レコード以外の既存営業担当者と重複していれば、DuplicateEmailAddressエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('更新フロー（salesRepresentativeId=rep-002）でメールアドレスが他の営業担当者（rep-001）と重複する場合、DuplicateEmailAddressエラーが発生する', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);

    const record1 = {
      id: 'rep-001',
      salesRepresentativeId: 'rep-001',
      name: '田中太郎',
      emailAddress: 'tanaka@example.com',
      phoneNumber: '090-1234-5678',
      department: '営業部',
      jobTitle: '営業課長',
      supervisorId: null,
      status: '有効',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      createdBy: 'user-001',
    };

    const record2 = {
      id: 'rep-002',
      salesRepresentativeId: 'rep-002',
      name: '鈴木花子',
      emailAddress: 'suzuki@example.com',
      phoneNumber: '090-2345-6789',
      department: '営業部',
      jobTitle: null,
      supervisorId: 'rep-001',
      status: '有効',
      createdAt: '2024-01-02T10:00:00Z',
      updatedAt: '2024-01-02T10:00:00Z',
      createdBy: 'user-001',
    };

    mockListRecords.mockResolvedValue([record1, record2]);

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: 'rep-002',
      name: '鈴木花子',
      emailAddress: 'tanaka@example.com',
      phoneNumber: '090-9999-9999',
      department: '営業部',
      jobTitle: '営業係長',
      supervisorId: 'rep-001',
      status: '有効',
      currentUserId: 'user-002',
      operationTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(saveSalesRepresentative(input)).rejects.toThrow(DuplicateEmailAddress);
    await expect(saveSalesRepresentative(input)).rejects.toThrow('このメールアドレスは既に登録されています。');
  });
});
