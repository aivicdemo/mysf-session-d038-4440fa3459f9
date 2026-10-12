import { validateDealInvoiceLinkAndTransition, DealNotFound } from '../../src/logic/deal-invoice-link-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-302: 指定された商談IDが存在しない場合、DealNotFoundエラーが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談が存在しない場合、DealNotFound エラーがスローされる', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-001';
    const operationTimestamp = new Date('2026-10-07T10:30:00.000Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(null);

    await expect(
      validateDealInvoiceLinkAndTransition({
        dealId,
        targetStage,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(DealNotFound);

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith(dealId);
  });

  it('DealNotFound エラーのメッセージは「商談が見つかりません。商談IDを確認してください。」である', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-001';
    const operationTimestamp = new Date('2026-10-07T10:30:00.000Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(null);

    try {
      await validateDealInvoiceLinkAndTransition({
        dealId,
        targetStage,
        userId,
        operationTimestamp,
      });
      fail('DealNotFound エラーがスローされるはず');
    } catch (error) {
      if (error instanceof DealNotFound) {
        expect(error.message).toBe('商談が見つかりません。商談IDを確認してください。');
      } else {
        throw error;
      }
    }
  });
});
