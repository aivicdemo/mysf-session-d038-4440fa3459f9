import { renderDiscrepancyDetailPanel, DiscrepancyNotFoundError } from '../../src/logic/dashboard-presentation';
import * as persistenceModule from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
}));

describe('SCEN-295: 指定されたdiscrepancyIdに対応する差異レコードが存在しない場合、DiscrepancyNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DiscrepancyNotFoundError when discrepancyDetail is null', async () => {
    const mockRetrieve = persistenceModule.retrieveDiscrepancyDetailsForConfirmation as jest.Mock;
    mockRetrieve.mockResolvedValue(null);

    const input = {
      requestUserId: 'user-001',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    await expect(renderDiscrepancyDetailPanel(input)).rejects.toThrow(DiscrepancyNotFoundError);
  });

  it('should include error message "指定された差異レコードが見つかりません。" in the thrown error', async () => {
    const mockRetrieve = persistenceModule.retrieveDiscrepancyDetailsForConfirmation as jest.Mock;
    mockRetrieve.mockResolvedValue(null);

    const input = {
      requestUserId: 'user-001',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    try {
      await renderDiscrepancyDetailPanel(input);
      fail('Should have thrown DiscrepancyNotFoundError');
    } catch (error) {
      if (error instanceof DiscrepancyNotFoundError) {
        expect(error.message).toBe('指定された差異レコードが見つかりません。');
      } else {
        throw error;
      }
    }
  });
});
