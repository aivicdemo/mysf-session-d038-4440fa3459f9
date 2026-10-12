import { fetchDealById, DealNotFoundError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-831: fetchDealById - DealNotFoundError when record does not exist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DealNotFoundError with correct message when deal is not found', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    await expect(fetchDealById({ dealId })).rejects.toThrow(DealNotFoundError);
    await expect(fetchDealById({ dealId })).rejects.toThrow(
      '指定された商談IDのレコードが見つかりません。'
    );
  });
});
