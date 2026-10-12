import { prepareDistributionPlan, NoDistributionTargetsError } from '../../src/logic/distribution-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchAllSalesRepresentatives: jest.fn(),
}));

describe('SCEN-629: NoDistributionTargetsError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('アクセス権限ルールに該当する配布対象者が存在しないとき NoDistributionTargetsError が発生する', async () => {
    const input: any = {
      approvalStatus: 'approved',
      mediaFormats: ['PDF', 'Web', 'MobileApp'],
      accessControlRules: [
        {
          role: 'SalesRepresentative' as const,
          mediaFormats: ['PDF', 'Web'],
          fieldMaskingLevel: 'partial' as const,
        },
      ],
      versionManagementRules: {
        trackUpdateDateTime: true,
        trackChangeHistory: true,
        enableDiffDisplay: true,
        retentionDays: 90,
      },
      documentMetadata: {
        documentName: '営業プロセス操作ガイド',
        documentVersion: '1.0',
        approvalDate: '2024-01-15T10:00:00Z',
        approverName: '営業部長太郎',
      },
    };

    const mockSalesRepresentatives = [
      {
        userId: 'SR001',
        userName: '営業担当者A',
        role: 'SalesRepresentative' as const,
      },
      {
        userId: 'SR002',
        userName: '営業担当者B',
        role: 'SalesRepresentative' as const,
      },
    ];

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(mockSalesRepresentatives);

    await expect(prepareDistributionPlan(input)).rejects.toThrow(NoDistributionTargetsError);
    await expect(prepareDistributionPlan(input)).rejects.toThrow(
      '指定されたアクセス権限に該当する配布対象者が見つかりません。アクセス権限ルールを確認してください。'
    );
    expect(dataPersistence.fetchAllUsers).toHaveBeenCalled();
    expect(dataPersistence.fetchAllSalesRepresentatives).toHaveBeenCalled();
  });
});
