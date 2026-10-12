import { prepareDistributionPlan, PrepareDistributionPlanInput } from '../../src/logic/distribution-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-633: prepareDistributionPlan - future approval date error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when approval date is in the future', async () => {
    const mockUsers = [
      { userId: 'U001', userName: '営業担当者 A', role: 'SalesRepresentative', loginId: 'login001', emailAddress: 'user001@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' },
      { userId: 'U002', userName: '営業部長 B', role: 'SalesManager', loginId: 'login002', emailAddress: 'user002@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' },
      { userId: 'U003', userName: '経理 C', role: 'AccountingDepartment', loginId: 'login003', emailAddress: 'user003@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' }
    ];

    const mockSalesReps = [
      { salesRepresentativeId: 'R001', name: '営業担当者 A', emailAddress: 'user001@example.com', phoneNumber: null, department: 'Sales', jobTitle: null, supervisorId: null, status: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin', updatedBy: null },
      { salesRepresentativeId: 'R002', name: '営業部長 B', emailAddress: 'user002@example.com', phoneNumber: null, department: 'Sales', jobTitle: null, supervisorId: null, status: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin', updatedBy: null }
    ];

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue({
      users: mockUsers,
      totalCount: 3,
      fetchedAt: '2026-10-12T00:00:00Z'
    });

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: mockSalesReps,
      totalCount: 2,
      fetchedAt: '2026-10-12T00:00:00Z'
    });

    const input: PrepareDistributionPlanInput = {
      approvalStatus: 'approved',
      mediaFormats: ['PDF', 'Web', 'MobileApp'],
      accessControlRules: [
        { role: 'SalesRepresentative', mediaFormats: ['PDF', 'Web'], fieldMaskingLevel: 'partial' },
        { role: 'SalesManager', mediaFormats: ['PDF', 'Web', 'MobileApp'], fieldMaskingLevel: 'none' },
        { role: 'AccountingDepartment', mediaFormats: ['PDF'], fieldMaskingLevel: 'full' }
      ],
      versionManagementRules: {
        trackUpdateDateTime: true,
        trackChangeHistory: true,
        enableDiffDisplay: true,
        retentionDays: 365
      },
      documentMetadata: {
        documentName: '営業プロセスガイド v2.1',
        documentVersion: '2.1',
        approvalDate: '2026-12-25T15:30:00Z',
        approverName: '営業部長 田中太郎'
      }
    };

    await expect(prepareDistributionPlan(input)).rejects.toThrow('承認日時が不正です。営業部長の承認日時を確認してください');
  });
});
