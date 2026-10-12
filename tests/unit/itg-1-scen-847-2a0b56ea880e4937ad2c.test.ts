import { fetchAllDealStages } from '../../src/logic/data-persistence';
import * as DataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-847: 商談ステージマスタが複数件存在するとき', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return deal stages sorted by stageOrder in ascending order', async () => {
    const mockStages = [
      {
        id: 'uuid-001',
        stageId: 'uuid-001',
        stageName: '初期接触',
        stageOrder: 1,
        description: '顧客との初回接触',
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: 'uuid-003',
        stageId: 'uuid-003',
        stageName: '成約',
        stageOrder: 3,
        description: '契約締結済み',
        contractedStageFlag: true,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: 'uuid-002',
        stageId: 'uuid-002',
        stageName: '提案',
        stageOrder: 2,
        description: '顧客へ提案実施',
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: 'uuid-004',
        stageId: 'uuid-004',
        stageName: '失注',
        stageOrder: 4,
        description: '商談喪失',
        contractedStageFlag: false,
        lossStageFlag: true,
        validFlag: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
    ];

    (DataStore.listRecords as jest.Mock).mockResolvedValue(mockStages);

    const result = await fetchAllDealStages({});

    expect(result.stages).toHaveLength(4);
    expect(result.totalCount).toBe(4);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result.stages[0].stageOrder).toBe(1);
    expect(result.stages[0].stageName).toBe('初期接触');
    expect(result.stages[1].stageOrder).toBe(2);
    expect(result.stages[1].stageName).toBe('提案');
    expect(result.stages[2].stageOrder).toBe(3);
    expect(result.stages[2].stageName).toBe('成約');
    expect(result.stages[3].stageOrder).toBe(4);
    expect(result.stages[3].stageName).toBe('失注');
  });
});
