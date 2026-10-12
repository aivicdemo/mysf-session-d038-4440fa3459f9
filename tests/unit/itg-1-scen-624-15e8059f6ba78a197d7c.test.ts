import { prepareDistributionPlan, InvalidMediaFormatError } from '../../src/logic/distribution-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchAllSalesRepresentatives: jest.fn(),
}));

describe('SCEN-624: prepareDistributionPlan - 無効な媒体形式でエラーが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidMediaFormatError when mediaFormats contains invalid format', async () => {
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue({
      users: [
        { userId: 'U001', userName: '営業太郎', role: 'SalesRepresentative', emailAddress: 'user@example.com', loginId: 'user', salesRepresentativeId: 'sr001', validFlag: true, lastLoginDateTime: '2025-01-15T10:00:00Z' },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-15T10:30:00Z',
    });

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: [
        { salesRepresentativeId: 'sr001', name: '営業太郎', emailAddress: 'user@example.com', phoneNumber: '090-0000-0000', department: '営業部', jobTitle: '営業担当者', supervisorId: null, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', createdBy: 'admin', updatedBy: 'admin' },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-15T10:30:00Z',
    });

    const input: any = {
      approvalStatus: 'approved',
      mediaFormats: ['PDF', 'Web', 'MobileApp', 'Paper'] as any,
      accessControlRules: [
        { role: 'SalesRepresentative' as const, mediaFormats: ['PDF', 'Web'], fieldMaskingLevel: 'partial' as const },
      ],
      versionManagementRules: {
        trackUpdateDateTime: true,
        trackChangeHistory: true,
        enableDiffDisplay: true,
        retentionDays: 90,
      },
      documentMetadata: {
        documentName: '操作ガイド',
        documentVersion: '1.0',
        approvalDate: '2024-01-15',
        approverName: '営業部長',
      },
    };

    await expect(prepareDistributionPlan(input)).rejects.toThrow(InvalidMediaFormatError);
    await expect(prepareDistributionPlan(input)).rejects.toThrow('指定された媒体形式は無効です。PDF、Web、モバイルアプリから選択してください。');
  });
});
