import { saveSalesRepresentative, SaveSalesRepresentativeInput, SaveSalesRepresentativeOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-747: 新規作成時に必須フィールド（名前・メールアドレス・部門）がすべて入力されていれば、営業担当者レコードが正常に保存され、採番されたIDと現在時刻を含む完全なレコードが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('必須フィールドがすべて入力された場合、採番されたIDと完全なレコードが返される', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);
    const mockCreateRecord = jest.mocked(dataStore.createRecord);

    mockListRecords.mockResolvedValue([]);
    mockCreateRecord.mockResolvedValue({
      id: 'rep-new-uuid',
      salesRepresentativeId: 'rep-new-uuid',
      name: '田中太郎',
      emailAddress: 'tanaka.taro@example.com',
      phoneNumber: null,
      department: '営業部',
      jobTitle: null,
      supervisorId: null,
      status: null,
      createdAt: '2026-10-07T10:30:00.000Z',
      updatedAt: '2026-10-07T10:30:00.000Z',
      createdBy: 'user-001',
      updatedBy: null,
    });

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: null,
      name: '田中太郎',
      emailAddress: 'tanaka.taro@example.com',
      phoneNumber: null,
      department: '営業部',
      jobTitle: null,
      supervisorId: null,
      status: null,
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:30:00.000Z',
    };

    const result = await saveSalesRepresentative(input);

    expect(result.salesRepresentativeId).toMatch(/^[a-zA-Z0-9-]+$/);
    expect(result.name).toBe('田中太郎');
    expect(result.emailAddress).toBe('tanaka.taro@example.com');
    expect(result.phoneNumber).toBeNull();
    expect(result.department).toBe('営業部');
    expect(result.jobTitle).toBeNull();
    expect(result.supervisorId).toBeNull();
    expect(result.status).toBeNull();
    expect(result.createdAt).toBe('2026-10-07T10:30:00.000Z');
    expect(result.updatedAt).toBe('2026-10-07T10:30:00.000Z');
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedBy).toBeNull();
  });
});
