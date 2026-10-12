import { monitorInvoiceSLAAndAlert, DealNotFound } from '../../src/logic/invoice-sla-monitoring';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
}));

describe('monitorInvoiceSLAAndAlert - SCEN-181', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DealNotFound error when deal does not exist', async () => {
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(null);

    const dealClosedDate = new Date('2026-10-07T10:00:00Z');
    const currentDateTime = new Date('2026-10-12T10:00:00Z');

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-999999',
        dealStage: '成約',
        dealClosedDate,
        slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
        currentDateTime,
      })
    ).rejects.toThrow(DealNotFound);

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-999999',
        dealStage: '成約',
        dealClosedDate,
        slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
        currentDateTime,
      })
    ).rejects.toThrow('商談が見つかりません。商談ID: DEAL-999999');
  });
});
