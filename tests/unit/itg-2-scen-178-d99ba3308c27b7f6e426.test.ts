import { updateMappingDetails, DataStoreError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationModule from '../../src/logic/authentication-authorization';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');

describe('SCEN-178: updateMappingDetails - DataStoreError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when database update fails', async () => {
    const mappingDetailId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const existingFunctionName = '請求書承認フロー';
    const mappingMethod = '標準機能';
    const userId = '770e8400-e29b-41d4-a716-446655440002';
    const operationTimestamp = '2026-10-07T12:00:00Z';

    const existingRecord = {
      機能マッピング詳細ID: '550e8400-e29b-41d4-a716-446655440000',
      移行プロジェクトID: '660e8400-e29b-41d4-a716-446655440001',
      既存機能名: '請求書承認フロー',
      既存機能説明: 'Oracle請求書の承認ワークフロー',
      マッピング対象オブジェクトID: '880e8400-e29b-41d4-a716-446655440003',
      マッピング方式: 'カスタマイズ',
      実装方針: 'Salesforceフロー利用',
      移行ステータス: '未開始',
      優先度: 2,
      複雑度: '中',
      依存関係: null,
      検証方法: null,
      検証ステータス: '未検証',
      備考: null,
      作成日時: '2026-09-01T10:00:00Z',
      作成者: '880e8400-e29b-41d4-a716-446655440004',
      更新日時: '2026-09-15T14:30:00Z',
      更新者: '880e8400-e29b-41d4-a716-446655440005',
      マッピング対象システムID: '990e8400-e29b-41d4-a716-446655440006',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      isValid: true,
      userHasAccess: true,
    });
    (authorizationModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
      hasUpdatePermission: true,
    });
    (validationModule.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
      validationMessages: [],
    });
    (dataStore.updateRecord as jest.Mock).mockRejectedValue(
      new DataStoreError('データベースの更新に失敗しました。')
    );

    await expect(
      updateMappingDetails({
        mappingDetailId,
        projectId,
        existingFunctionName,
        mappingMethod,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(DataStoreError);

    expect(dataStore.updateRecord).toHaveBeenCalled();
  });
});
