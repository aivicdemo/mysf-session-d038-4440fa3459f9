import { prepareDistributionPlan, SalesRepresentativeFetchFailureError } from '../../src/logic/distribution-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchAllSalesRepresentatives: jest.fn(),
}));

describe('SCEN-628: SalesRepresentativeFetchFailureError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者マスタの取得に失敗したとき SalesRepresentativeFetchFailureError が発生する', async () => {
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
        retentionDays: 90,
      },
      documentMetadata: {
        documentName: '営業プロセス操作ガイド',
        documentVersion: '1.0',
        approvalDate: '2024-01-15T10:00:00Z',
        approverName: '山田営業部長',
      },
    };

    const mockUsers = [
      {
        userId: 'user001',
        userName: '佐藤太郎',
        role: 'SalesRepresentative' as const,
        department: 'SalesDepartment',
      },
      {
        userId: 'user002',
        userName: '鈴木次郎',
        role: 'SalesManager' as const,
        department: 'SalesDepartment',
      },
    ];

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue(mockUsers);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockRejectedValue(
      new SalesRepresentativeFetchFailureError('営業担当者情報の取得に失敗しました。システム管理者に連絡してください。')
    );

    await expect(prepareDistributionPlan(input)).rejects.toThrow(SalesRepresentativeFetchFailureError);
    await expect(prepareDistributionPlan(input)).rejects.toThrow(
      '営業担当者情報の取得に失敗しました。システム管理者に連絡してください。'
    );
    expect(dataPersistence.fetchAllUsers).toHaveBeenCalled();
    expect(dataPersistence.fetchAllSalesRepresentatives).toHaveBeenCalled();
  });
});
