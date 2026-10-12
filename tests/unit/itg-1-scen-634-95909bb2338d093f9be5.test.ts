import { prepareDistributionPlan, PrepareDistributionPlanInput } from '../../src/logic/distribution-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-634: prepareDistributionPlan - duplicate version error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when version number is duplicated', async () => {
    const mockUsers = [
      { userId: 'user001', userName: '田中花子', role: 'SalesRepresentative', loginId: 'login001', emailAddress: 'user001@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' },
      { userId: 'user002', userName: '佐藤次郎', role: 'SalesManager', loginId: 'login002', emailAddress: 'user002@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' }
    ];

    const mockSalesReps = [
      { salesRepresentativeId: 'sr001', name: '田中花子', emailAddress: 'user001@example.com', phoneNumber: null, department: '営業部', jobTitle: null, supervisorId: null, status: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin', updatedBy: null }
    ];

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue({
      users: mockUsers,
      totalCount: 2,
      fetchedAt: '2026-10-07T00:00:00Z'
    });

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: mockSalesReps,
      totalCount: 1,
      fetchedAt: '2026-10-07T00:00:00Z'
    });

    const input: PrepareDistributionPlanInput = {
      approvalStatus: 'approved',
      mediaFormats: ['PDF', 'Web', 'MobileApp'],
      accessControlRules: [
        { role: 'SalesRepresentative', mediaFormats: ['PDF', 'Web'], fieldMaskingLevel: 'partial' },
        { role: 'SalesManager', mediaFormats: ['PDF', 'Web', 'MobileApp'], fieldMaskingLevel: 'none' }
      ],
      versionManagementRules: {
        trackUpdateDateTime: true,
        trackChangeHistory: true,
        enableDiffDisplay: true,
        retentionDays: 365
      },
      documentMetadata: {
        documentName: '営業プロセス操作ガイド',
        documentVersion: 'v1.0',
        approvalDate: '2026-10-07',
        approverName: '営業部長 山田太郎'
      }
    };

    await expect(prepareDistributionPlan(input)).rejects.toThrow('バージョン番号が重複しています。新しいバージョン番号を生成してください');
  });
});
