import { renderDiscrepancyDetailPanel, RenderDiscrepancyDetailPanelInput, UnauthorizedAccessError } from '../../src/logic/dashboard-presentation';

jest.mock('../../src/logic/discrepancy-persistence');

describe('SCEN-293: renderDiscrepancyDetailPanel - ユーザーが権限を持たない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('UnauthorizedAccessError が発生する', async () => {
    const input: RenderDiscrepancyDetailPanelInput = {
      requestUserId: 'user-without-permission',
      discrepancyId: ''
    };

    await expect(renderDiscrepancyDetailPanel(input)).rejects.toThrow(UnauthorizedAccessError);
    await expect(renderDiscrepancyDetailPanel(input)).rejects.toThrow(
      'この操作を実行する権限がありません。'
    );
  });
});
