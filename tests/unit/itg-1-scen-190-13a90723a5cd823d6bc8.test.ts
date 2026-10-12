import { monitorInvoiceSLAAndAlert } from '../../src/logic/invoice-sla-monitoring';

describe('monitorInvoiceSLAAndAlert - SCEN-190', () => {
  it('should throw error when dealClosedDate is null/undefined', async () => {
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-001',
        dealStage: '成約',
        dealClosedDate: null as any,
        slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
        currentDateTime,
      })
    ).rejects.toThrow();

    try {
      await monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-001',
        dealStage: '成約',
        dealClosedDate: null as any,
        slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
        currentDateTime,
      });
      fail('Should have thrown an error');
    } catch (e: any) {
      expect(e.message).toContain('商談クローズ日が必須です');
    }
  });
});
