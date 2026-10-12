import { saveSalesRepresentative, SaveSalesRepresentativeInput, DuplicateEmailAddress } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-750: 新規作成時に入力メールアドレスが既存の営業担当者レコードと重複していれば、DuplicateEmailAddressエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規作成フロー（salesRepresentativeId=null）でメールアドレスが既に存在する場合、DuplicateEmailAddressエラーが発生する', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);

    const existingRecord = {
      id: 'rep-001',
      salesRepresentativeId: 'rep-001',
      name: '山田太郎',
      emailAddress: 'yamada@example.com',
      phoneNumber: '09012345678',
      department: '営業部',
      jobTitle: '営業課長',
      supervisorId: null,
      status: '有効',
    };

    mockListRecords.mockResolvedValue([existingRecord]);

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: null,
      name: '鈴木花子',
      emailAddress: 'yamada@example.com',
      phoneNumber: '09087654321',
      department: '営業部',
      jobTitle: '営業担当者',
      supervisorId: null,
      status: '有効',
      currentUserId: 'user-100',
      operationTimestamp: '2026-10-07T10:00:00.000Z',
    };

    await expect(saveSalesRepresentative(input)).rejects.toThrow(DuplicateEmailAddress);
    await expect(saveSalesRepresentative(input)).rejects.toThrow('このメールアドレスは既に登録されています。');
  });
});
