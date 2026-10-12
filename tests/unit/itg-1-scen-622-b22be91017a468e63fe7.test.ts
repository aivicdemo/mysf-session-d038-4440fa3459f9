import { prepareDistributionPlan } from '../../src/logic/distribution-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchAllSalesRepresentatives: jest.fn(),
}));

describe('SCEN-622: prepareDistributionPlan - 承認済み・有効な設定で配布準備リストが生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate distribution plan with valid inputs', async () => {
    const mockUsers = [
      { userId: 'user001', userName: '佐藤花子', role: 'SalesRepresentative', emailAddress: 'satoh@example.com', loginId: 'satoh', salesRepresentativeId: 'sr001', validFlag: true, lastLoginDateTime: '2025-01-15T09:00:00Z' },
      { userId: 'user002', userName: '鈴木二郎', role: 'SalesRepresentative', emailAddress: 'suzuki@example.com', loginId: 'suzuki', salesRepresentativeId: 'sr002', validFlag: true, lastLoginDateTime: '2025-01-15T08:30:00Z' },
      { userId: 'user003', userName: '田中一郎', role: 'SalesManager', emailAddress: 'tanaka@example.com', loginId: 'tanaka', salesRepresentativeId: 'sr003', validFlag: true, lastLoginDateTime: '2025-01-15T10:00:00Z' },
      { userId: 'user004', userName: '伊藤請求子', role: 'AccountingDepartment', emailAddress: 'itou@example.com', loginId: 'itou', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: '2025-01-14T14:00:00Z' },
    ];

    const mockSalesReps = [
      { salesRepresentativeId: 'sr001', name: '佐藤花子', emailAddress: 'satoh@example.com', phoneNumber: '090-1111-1111', department: '営業部', jobTitle: '営業担当者', supervisorId: 'sr003', status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', createdBy: 'admin', updatedBy: 'admin' },
      { salesRepresentativeId: 'sr002', name: '鈴木二郎', emailAddress: 'suzuki@example.com', phoneNumber: '090-2222-2222', department: '営業部', jobTitle: '営業担当者', supervisorId: 'sr003', status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', createdBy: 'admin', updatedBy: 'admin' },
      { salesRepresentativeId: 'sr003', name: '田中一郎', emailAddress: 'tanaka@example.com', phoneNumber: '090-3333-3333', department: '営業部', jobTitle: '営業部長', supervisorId: null, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', createdBy: 'admin', updatedBy: 'admin' },
    ];

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue({
      users: mockUsers,
      totalCount: 4,
      fetchedAt: '2025-01-15T10:30:00Z',
    });

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: mockSalesReps,
      totalCount: 3,
      fetchedAt: '2025-01-15T10:30:00Z',
    });

    const input: any = {
      approvalStatus: 'approved',
      mediaFormats: ['PDF', 'Web', 'MobileApp'],
      accessControlRules: [
        { role: 'SalesRepresentative' as const, mediaFormats: ['PDF', 'Web'], fieldMaskingLevel: 'partial' as const },
        { role: 'SalesManager' as const, mediaFormats: ['PDF', 'Web', 'MobileApp'], fieldMaskingLevel: 'none' as const },
        { role: 'AccountingDepartment' as const, mediaFormats: ['PDF'], fieldMaskingLevel: 'full' as const },
      ],
      versionManagementRules: {
        trackUpdateDateTime: true,
        trackChangeHistory: true,
        enableDiffDisplay: true,
        retentionDays: 90,
      },
      documentMetadata: {
        documentName: '営業操作ガイド',
        documentVersion: 'v2.1',
        approvalDate: '2025-01-15T10:30:00Z',
        approverName: '山田太郎',
      },
    };

    const result = await prepareDistributionPlan(input);

    expect(result.distributionPlanId).toBeDefined();
    expect(result.distributionPlanId).toBeTruthy();
    expect(typeof result.distributionPlanId).toBe('string');

    expect(result.distributionTargets).toHaveLength(4);

    const user001Target = result.distributionTargets.find(t => t.userId === 'user001');
    expect(user001Target).toBeDefined();
    expect(user001Target?.userName).toBe('佐藤花子');
    expect(user001Target?.role).toBe('SalesRepresentative');
    expect(user001Target?.assignedMediaFormats).toEqual(['PDF', 'Web']);
    expect(user001Target?.fieldMaskingLevel).toBe('partial');
    expect(user001Target?.distributionMethod).toBe('Email');

    const user002Target = result.distributionTargets.find(t => t.userId === 'user002');
    expect(user002Target).toBeDefined();
    expect(user002Target?.assignedMediaFormats).toEqual(['PDF', 'Web']);
    expect(user002Target?.fieldMaskingLevel).toBe('partial');
    expect(user002Target?.distributionMethod).toBe('Email');

    const user003Target = result.distributionTargets.find(t => t.userId === 'user003');
    expect(user003Target).toBeDefined();
    expect(user003Target?.userName).toBe('田中一郎');
    expect(user003Target?.role).toBe('SalesManager');
    expect(user003Target?.assignedMediaFormats).toEqual(['PDF', 'Web', 'MobileApp']);
    expect(user003Target?.fieldMaskingLevel).toBe('none');
    expect(user003Target?.distributionMethod).toBe('Email');

    const user004Target = result.distributionTargets.find(t => t.userId === 'user004');
    expect(user004Target).toBeDefined();
    expect(user004Target?.userName).toBe('伊藤請求子');
    expect(user004Target?.role).toBe('AccountingDepartment');
    expect(user004Target?.assignedMediaFormats).toEqual(['PDF']);
    expect(user004Target?.fieldMaskingLevel).toBe('full');
    expect(user004Target?.distributionMethod).toBe('WebPortal');

    expect(result.versionManagementMetadata.versionNumber).toBe('v2.1');
    expect(result.versionManagementMetadata.releaseDate).toBe('2025-01-15');
    expect(result.versionManagementMetadata.diffAvailable).toBe(true);
    expect(Array.isArray(result.versionManagementMetadata.changeLog)).toBe(true);
    expect(result.versionManagementMetadata.changeLog.length).toBeGreaterThan(0);

    const changeLogEntry = result.versionManagementMetadata.changeLog[0];
    expect(changeLogEntry.date).toBe('2025-01-15');
    expect(changeLogEntry.author).toBe('山田太郎');
    expect(typeof changeLogEntry.change).toBe('string');
    expect(changeLogEntry.change.length).toBeGreaterThan(0);

    expect(result.distributionSchedule.plannedStartDate).toBeDefined();
    expect(result.distributionSchedule.plannedCompletionDate).toBeDefined();
    expect(result.distributionSchedule.estimatedDistributionCount).toBe(4);

    const plannedStart = new Date(result.distributionSchedule.plannedStartDate);
    const plannedCompletion = new Date(result.distributionSchedule.plannedCompletionDate);
    expect(plannedStart).toBeInstanceOf(Date);
    expect(plannedCompletion).toBeInstanceOf(Date);
    expect(plannedCompletion > plannedStart).toBe(true);

    expect(result.validationStatus).toBe('valid');
  });
});
