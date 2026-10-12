import { prepareDistributionPlan, UserFetchFailureError } from '../../src/logic/distribution-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchAllSalesRepresentatives: jest.fn(),
}));

describe('SCEN-627: UserFetchFailureError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('配布対象ユーザー一覧の取得に失敗したとき UserFetchFailureError が発生する', async () => {
    const input: any = {
      approvalStatus: 'approved',
      mediaFormats: ['PDF', 'Web', 'MobileApp'],
      accessControlRules: [
        {
          role: 'SalesRepresentative' as const,
          mediaFormats: ['PDF', 'Web'],
          fieldMaskingLevel: 'partial' as const,
        },
        {
          role: 'SalesManager' as const,
          mediaFormats: ['PDF', 'Web', 'MobileApp'],
          fieldMaskingLevel: 'none' as const,
        },
      ],
      versionManagementRules: {
        trackUpdateDateTime: true,
        trackChangeHistory: true,
        enableDiffDisplay: true,
        retentionDays: 365,
      },
      documentMetadata: {
        documentName: '操作ガイド_営業プロセス',
        documentVersion: '2.1',
        approvalDate: '2024-01-15T10:30:00Z',
        approverName: '営業部長_太郎',
      },
    };

    (dataPersistence.fetchAllUsers as jest.Mock).mockRejectedValue(
      new UserFetchFailureError('配布対象ユーザー情報の取得に失敗しました。システム管理者に連絡してください。')
    );

    await expect(prepareDistributionPlan(input)).rejects.toThrow(UserFetchFailureError);
    await expect(prepareDistributionPlan(input)).rejects.toThrow(
      '配布対象ユーザー情報の取得に失敗しました。システム管理者に連絡してください。'
    );
    expect(dataPersistence.fetchAllUsers).toHaveBeenCalled();
  });
});
