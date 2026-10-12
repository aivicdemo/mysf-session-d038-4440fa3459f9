import { saveSalesRepresentative, SaveSalesRepresentativeInput, InvalidSupervisorReference } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-752: 上司IDが指定されているが営業担当者テーブルに存在しなければ、InvalidSupervisorReferenceエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規作成フロー（salesRepresentativeId=null）で上司ID（supervisor-999）がテーブルに存在しない場合、InvalidSupervisorReferenceエラーが発生する', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);

    const existingSupervisor = {
      id: 'supervisor-001',
      salesRepresentativeId: 'supervisor-001',
      name: '山田太郎',
      emailAddress: 'yamada@example.com',
      phoneNumber: '090-1234-5678',
      department: '営業部',
      jobTitle: '営業部長',
      supervisorId: null,
      status: '有効',
    };

    mockListRecords.mockResolvedValue([existingSupervisor]);

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: null,
      name: '佐藤次郎',
      emailAddress: 'sato@example.com',
      phoneNumber: '090-9876-5432',
      department: '営業部',
      jobTitle: '営業課長',
      supervisorId: 'supervisor-999',
      status: '有効',
      currentUserId: 'user-001',
      operationTimestamp: '2025-01-15T10:30:00Z',
    };

    await expect(saveSalesRepresentative(input)).rejects.toThrow(InvalidSupervisorReference);
    await expect(saveSalesRepresentative(input)).rejects.toThrow('指定された上司が見つかりません。');
  });
});
