import { fetchUserPermissions, UserNotFoundError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-881: ユーザー権限取得 - ユーザーが存在しないエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーIDが存在しない場合、UserNotFoundErrorが発生', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([]);

    await expect(
      fetchUserPermissions({ userId })
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
