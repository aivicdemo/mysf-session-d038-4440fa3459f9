import { renderCorrectionTrackingHistory } from '../../src/logic/dashboard-presentation';
import * as dashboardPresentation from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence');

describe('SCEN-306: renderCorrectionTrackingHistory with zero records', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array when no correction tracking records exist for discrepancy', async () => {
    const discrepancyId = 'diff-12345';
    const mockEmptyRecords: unknown[] = [];

    (
      discrepancyPersistence.retrieveCorrectionTrackingByDifferenceId as jest.Mock
    ).mockResolvedValue(mockEmptyRecords);

    const result = await renderCorrectionTrackingHistory({
      discrepancyId,
    });

    expect(result).toEqual([]);
    expect(
      discrepancyPersistence.retrieveCorrectionTrackingByDifferenceId
    ).toHaveBeenCalledWith(discrepancyId);
  });
});
