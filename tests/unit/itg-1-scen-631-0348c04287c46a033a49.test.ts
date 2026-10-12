import { prepareDistributionPlan, NoDistributionTargetsError, PrepareDistributionPlanInput } from '../../src/logic/distribution-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-631: prepareDistributionPlan - no distribution targets error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoDistributionTargetsError when no users are available', async () => {
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue({
      users: [],
      totalCount: 0,
      fetchedAt: '2025-01-15T10:00:00Z'
    });

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: [],
      totalCount: 0,
      fetchedAt: '2025-01-15T10:00:00Z'
    });

    const input: PrepareDistributionPlanInput = {
      approvalStatus: 'approved',
      mediaFormats: ['PDF', 'Web'],
      accessControlRules: [
        { role: 'SalesRepresentative', mediaFormats: ['PDF', 'Web'], fieldMaskingLevel: 'partial' },
        { role: 'SalesManager', mediaFormats: ['PDF', 'Web'], fieldMaskingLevel: 'none' }
      ],
      versionManagementRules: {
        trackUpdateDateTime: true,
        trackChangeHistory: true,
        enableDiffDisplay: true,
        retentionDays: 365
      },
      documentMetadata: {
        documentName: '操作ガイド_2024',
        documentVersion: '1.0',
        approvalDate: '2024-01-15',
        approverName: '営業部長 山田太郎'
      }
    };

    await expect(prepareDistributionPlan(input)).rejects.toThrow(NoDistributionTargetsError);
    await expect(prepareDistributionPlan(input)).rejects.toThrow('配布対象者を最低1名以上指定してください');
  });
});
