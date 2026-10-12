import { saveSalesRepresentative } from '../../src/logic/data-persistence';
import type { SaveSalesRepresentativeInput, SaveSalesRepresentativeOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-756: saveSalesRepresentative - null/undefined を含む新規作成時に完全なレコードが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規作成時に電話番号・役職・ステータスが指定されずnull/undefinedの場合、それらを含む完全なレコードが返される', async () => {
    const mockOutput: SaveSalesRepresentativeOutput = {
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
      name: '山田太郎',
      emailAddress: 'yamada.taro@example.com',
      phoneNumber: '',
      department: '営業部',
      jobTitle: '',
      supervisorId: null,
      status: '',
      createdAt: '2026-10-07T10:30:00.000Z',
      updatedAt: '2026-10-07T10:30:00.000Z',
      createdBy: 'user-001',
      updatedBy: null,
    };

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockOutput);

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: null,
      name: '山田太郎',
      emailAddress: 'yamada.taro@example.com',
      phoneNumber: null,
      department: '営業部',
      jobTitle: null,
      supervisorId: null,
      status: null,
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:30:00.000Z',
    };

    const result = await saveSalesRepresentative(input);

    expect(result).toBeDefined();
    expect(result.salesRepresentativeId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.name).toBe('山田太郎');
    expect(result.emailAddress).toBe('yamada.taro@example.com');
    expect(result.phoneNumber).not.toBeUndefined();
    expect(result.department).toBe('営業部');
    expect(result.jobTitle).not.toBeUndefined();
    expect(result.supervisorId).toBeNull();
    expect(result.status).not.toBeUndefined();
    expect(result.createdAt).toBe('2026-10-07T10:30:00.000Z');
    expect(result.updatedAt).toBe('2026-10-07T10:30:00.000Z');
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedBy).toBeNull();
  });
});
