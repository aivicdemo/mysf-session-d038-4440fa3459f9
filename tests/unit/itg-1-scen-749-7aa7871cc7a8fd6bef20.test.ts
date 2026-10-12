import { saveSalesRepresentative, SaveSalesRepresentativeInput, InvalidSalesRepresentativeData } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-749: 新規作成時に必須フィールド（名前・メールアドレス・部門）のいずれかが不足または形式が不正であれば、InvalidSalesRepresentativeDataエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('必須フィールドの「名前」が空文字列の場合、InvalidSalesRepresentativeDataエラーが発生する', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);
    mockListRecords.mockResolvedValue([]);

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: null,
      name: '',
      emailAddress: 'sales@example.com',
      phoneNumber: null,
      department: '営業部',
      jobTitle: null,
      supervisorId: null,
      status: null,
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:00:00Z',
    };

    await expect(saveSalesRepresentative(input)).rejects.toThrow(InvalidSalesRepresentativeData);
    await expect(saveSalesRepresentative(input)).rejects.toThrow(
      '営業担当者情報が不完全です。名前、メールアドレス、部門は必須です。'
    );
  });
});
