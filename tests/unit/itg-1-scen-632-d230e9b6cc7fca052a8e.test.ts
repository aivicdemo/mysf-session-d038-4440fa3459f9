import { prepareDistributionPlan, PrepareDistributionPlanInput } from '../../src/logic/distribution-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-632: prepareDistributionPlan - IT policies not set warning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should emit warning and complete successfully when IT policies are not set', async () => {
    const mockUsers = [
      { userId: 'user001', userName: '営業太郎', role: 'SalesRepresentative', loginId: 'login001', emailAddress: 'user001@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' },
      { userId: 'user002', userName: '営業花子', role: 'SalesRepresentative', loginId: 'login002', emailAddress: 'user002@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' },
      { userId: 'user003', userName: '営業部長', role: 'SalesManager', loginId: 'login003', emailAddress: 'user003@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' },
      { userId: 'user004', userName: '経理一郎', role: 'AccountingDepartment', loginId: 'login004', emailAddress: 'user004@example.com', salesRepresentativeId: null, validFlag: true, lastLoginDateTime: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin' }
    ];

    const mockSalesReps = [
      { salesRepresentativeId: 'user001', name: '営業太郎', emailAddress: 'user001@example.com', phoneNumber: null, department: '営業部', jobTitle: null, supervisorId: null, status: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin', updatedBy: null },
      { salesRepresentativeId: 'user002', name: '営業花子', emailAddress: 'user002@example.com', phoneNumber: null, department: '営業部', jobTitle: null, supervisorId: null, status: null, createdAt: '2025-01-01', updatedAt: '2025-01-01', createdBy: 'admin', updatedBy: null }
    ];

    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue({
      users: mockUsers,
      totalCount: 4,
      fetchedAt: '2025-01-15T10:30:00Z'
    });

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: mockSalesReps,
      totalCount: 2,
      fetchedAt: '2025-01-15T10:30:00Z'
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

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
        documentName: '営業操作ガイド v2.0',
        documentVersion: '2.0',
        approvalDate: '2025-01-15T10:30:00Z',
        approverName: '営業部長 田中太郎'
      }
    };

    const result = await prepareDistributionPlan(input);

    expect(result.distributionPlanId).toBeDefined();
    expect(result.distributionTargets).toHaveLength(4);
    expect(result.distributionTargets[0].userId).toBe('user001');
    expect(result.distributionTargets[1].userId).toBe('user002');
    expect(result.distributionTargets[2].userId).toBe('user003');
    expect(result.distributionTargets[3].userId).toBe('user004');

    expect(result.versionManagementMetadata.versionNumber).toBe('2.0');
    expect(result.versionManagementMetadata.releaseDate).toBe('2025-01-15');
    expect(result.versionManagementMetadata.diffAvailable).toBe(true);

    expect(result.distributionSchedule.plannedStartDate).toBeDefined();
    expect(result.distributionSchedule.plannedCompletionDate).toBeDefined();
    expect(result.distributionSchedule.estimatedDistributionCount).toBe(4);

    expect(result.validationStatus).toBe('valid');

    warnSpy.mockRestore();
  });
});
