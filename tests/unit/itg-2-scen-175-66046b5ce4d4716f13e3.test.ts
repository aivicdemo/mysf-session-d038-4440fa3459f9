import { updateMappingDetails, ProjectContextMismatchError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationModule from '../../src/logic/authentication-authorization';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');

describe('SCEN-175: updateMappingDetails - ProjectContextMismatchError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectContextMismatchError when projectId does not match existing record', async () => {
    const mappingDetailId = 'mapping-detail-uuid-001';
    const projectId = 'project-uuid-002';
    const existingFunctionName = '請求書作成_改訂版';
    const userId = 'user-uuid-002';
    const operationTimestamp = '2026-01-20T14:30:00Z';

    const existingRecord = {
      機能マッピング詳細ID: 'mapping-detail-uuid-001',
      移行プロジェクトID: 'project-uuid-001',
      既存機能名: '請求書作成',
      既存機能説明: 'Oracle ERP内の請求書作成機能',
      マッピング対象オブジェクトID: 'custom-object-uuid-001',
      マッピング方式: '標準機能',
      実装方針: 'Salesforce標準請求オブジェクトを活用',
      移行ステータス: '未開始',
      優先度: 1,
      複雑度: '低',
      依存関係: null,
      検証方法: null,
      検証ステータス: '未検証',
      備考: null,
      作成日時: '2026-01-15T10:00:00Z',
      作成者: 'user-uuid-001',
      更新日時: '2026-01-15T10:00:00Z',
      更新者: 'user-uuid-001',
      マッピング対象システムID: 'system-uuid-001',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);

    await expect(
      updateMappingDetails({
        mappingDetailId,
        projectId,
        existingFunctionName,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(ProjectContextMismatchError);

    expect(dataStore.listRecords).toHaveBeenCalledWith(
      '機能マッピング詳細',
      expect.objectContaining({ mappingDetailId })
    );
  });
});
