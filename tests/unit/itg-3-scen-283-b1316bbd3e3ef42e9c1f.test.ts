import { renderDashboardWithLatestData, RenderDashboardWithLatestDataInput, UnauthorizedUserError } from '../../src/logic/dashboard-presentation';

jest.mock('../../src/logic/discrepancy-persistence');

describe('SCEN-283: renderDashboardWithLatestData - ユーザーがダッシュボード表示権限を持たない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('UnauthorizedUserError が発生する', async () => {
    const input: RenderDashboardWithLatestDataInput = {
      requestUserId: 'user-without-dashboard-access',
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-01-31T23:59:59Z')
    };

    await expect(renderDashboardWithLatestData(input)).rejects.toThrow(UnauthorizedUserError);
    await expect(renderDashboardWithLatestData(input)).rejects.toThrow(
      'ユーザーはデータ整合性検証ダッシュボードへのアクセス権限がありません。'
    );
  });
});
