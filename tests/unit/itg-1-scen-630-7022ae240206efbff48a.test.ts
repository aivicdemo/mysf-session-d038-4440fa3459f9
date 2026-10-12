import { prepareDistributionPlan, NoDistributionTargetsError, PrepareDistributionPlanInput } from '../../src/logic/distribution-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-630: prepareDistributionPlan - happy path with multiple roles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a distribution plan with correct targets and metadata for multiple roles', async () => {
    const mockUsers = [
      { userId: 'user001', userName: '田中太郎', role: 'SalesRepresentative', loginId: 'login001', emailAddress: 'user001@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' },
      { userId: 'user002', userName: '佐藤花子', role: 'SalesRepresentative', loginId: 'login002', emailAddress: 'user002@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' },
      { userId: 'user003', userName: '鈴木次郎', role: 'SalesManager', loginId: 'login003', emailAddress: 'user003@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' },
      { userId: 'user004', userName: '伊藤経理太', role: 'AccountingDepartment', loginId: 'login004', emailAddress: 'user004@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' }
    ];

    const mockSalesReps = [
      { salesRepresentativeId: 'user001', name: '田中太郎', emailAddress: 'user001@example.com', phoneNumber: null, department: '営業部', jobTitle: null, supervisorId: null, status: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin', updatedBy: null },
      { salesRepresentativeId: 'user002', name: '佐藤花子', emailAddress: 'user002@example.com', phoneNumber: null, department: '営業部', jobTitle: null, supervisorId: null, status: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin', updatedBy: null },
      { salesRepresentativeId: 'user003', name: '鈴木次郎', emailAddress: 'user003@example.com', phoneNumber: null, department: '営業部', jobTitle: null, supervisorId: null, status: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin', updatedBy: null }
    ];

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue({
      users: mockUsers,
      totalCount: 4,
      fetchedAt: '2025-01-15T10:00:00Z'
    });

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: mockSalesReps,
      totalCount: 3,
      fetchedAt: '2025-01-15T10:00:00Z'
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
        documentName: '営業操作ガイド',
        documentVersion: 'v2.0',
        approvalDate: '2025-01-15T10:00:00Z',
        approverName: '山田営業部長'
      }
    };

    const result = await prepareDistributionPlan(input);

    expect(result.distributionPlanId).toBeDefined();
    expect(result.distributionTargets).toHaveLength(4);

    // Verify targets by role
    const salesRepTargets = result.distributionTargets.filter(t => t.role === 'SalesRepresentative');
    expect(salesRepTargets).toHaveLength(2);
    salesRepTargets.forEach(target => {
      expect(target.assignedMediaFormats).toEqual(['PDF', 'Web']);
      expect(target.fieldMaskingLevel).toBe('partial');
      expect(target.distributionMethod).toBe('Email');
    });

    const managerTarget = result.distributionTargets.find(t => t.role === 'SalesManager');
    expect(managerTarget).toBeDefined();
    expect(managerTarget?.assignedMediaFormats).toEqual(['PDF', 'Web', 'MobileApp']);
    expect(managerTarget?.fieldMaskingLevel).toBe('none');
    expect(managerTarget?.distributionMethod).toBe('WebPortal');

    const accountingTarget = result.distributionTargets.find(t => t.role === 'AccountingDepartment');
    expect(accountingTarget).toBeDefined();
    expect(accountingTarget?.assignedMediaFormats).toEqual(['PDF']);
    expect(accountingTarget?.fieldMaskingLevel).toBe('full');
    expect(accountingTarget?.distributionMethod).toBe('Email');

    // Verify version management metadata
    expect(result.versionManagementMetadata.versionNumber).toBe('v2.0');
    expect(result.versionManagementMetadata.releaseDate).toBe('2025-01-15');
    expect(result.versionManagementMetadata.changeLog).toBeDefined();
    expect(result.versionManagementMetadata.diffAvailable).toBe(true);

    // Verify distribution schedule
    expect(result.distributionSchedule.plannedStartDate).toBeDefined();
    expect(result.distributionSchedule.plannedCompletionDate).toBeDefined();
    expect(result.distributionSchedule.estimatedDistributionCount).toBe(4);

    expect(result.validationStatus).toBe('valid');
  });
});
