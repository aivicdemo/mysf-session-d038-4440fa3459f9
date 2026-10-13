import { updateMappingDetails, ValidationFailureError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationModule from '../../src/logic/authentication-authorization';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');

describe('SCEN-177: updateMappingDetails - ValidationFailureError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ValidationFailureError when validation fails', async () => {
    const mappingDetailId = 'detail-uuid-001';
    const projectId = 'project-uuid-001';
    const existingFunctionName = '請求書作成';
    const userId = 'user-uuid-updater';
    const operationTimestamp = '2026-01-15T14:30:00Z';
    const mappingMethod = 'ワークアラウンド';
    const implementationPolicy = 'Flow による自動化でSalesforce標準機能を補完';
    const dependencies = '請求明細オブジェクトへの参照関係が循環依存を形成';

    const existingRecord = {
      機能マッピング詳細ID: 'detail-uuid-001',
      移行プロジェクトID: 'project-uuid-001',
      既存機能名: '請求書作成',
      既存機能説明: 'Oracle ERPの請求書作成機能',
      マッピング対象オブジェクトID: 'custom-obj-uuid-001',
      マッピング方式: '標準機能',
      実装方針: 'Salesforce標準のInvoiceカスタムオブジェクトにマッピング',
      移行ステータス: '未開始',
      優先度: 1,
      複雑度: '低',
      依存関係: '顧客マスタとの参照関係あり',
      検証方法: 'ユニットテスト',
      検証ステータス: '未検証',
      備考: '初期マッピング',
      マッピング対象システムID: 'target-system-uuid-001',
      作成日時: '2026-01-01T10:00:00Z',
      作成者: 'user-uuid-creator',
      更新日時: '2026-01-01T10:00:00Z',
      更新者: 'user-uuid-creator',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });
    (authorizationModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
    });
    (validationModule.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      valid: false,
      errors: [
        {
          field: 'dependencies',
          message:
            '計算ロジック依存関係が矛盾しています。請求書オブジェクトと請求明細オブジェクト間に循環参照が検出されました。',
        },
      ],
    });

    await expect(
      updateMappingDetails({
        mappingDetailId,
        projectId,
        existingFunctionName,
        mappingMethod,
        implementationPolicy,
        dependencies,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(ValidationFailureError);

    expect(validationModule.validateStandardFunctionMappings).toHaveBeenCalled();
  });
});
