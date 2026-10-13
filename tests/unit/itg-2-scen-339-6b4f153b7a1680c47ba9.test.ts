import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';
import type { ValidateSalesforceObjectDefinitionsInput } from '../../src/logic/data-validation-rules';

describe('SCEN-339: Multiple validation errors with comprehensive error reporting', () => {
  it('should report all validation errors for multiple object definition issues', async () => {
    const input: ValidateSalesforceObjectDefinitionsInput = {
      objectDefinitions: [
        {
          objectName: 'Invoice',
          objectDescription: '請求書オブジェクト',
          mappingTargetSalesforceObject: 'Invoice__c',
          fields: [
            { fieldName: 'invoice_number', dataType: 'String', required: true },
            { fieldName: 'customer_id', dataType: 'String', required: true },
            { fieldName: 'billing_amount', dataType: 'Decimal', required: true },
          ],
          recordCount: 100,
        },
        {
          objectName: 'Invoice',
          objectDescription: '請求書オブジェクト（重複）',
          mappingTargetSalesforceObject: 'Invoice__c',
          fields: [
            { fieldName: 'invoice_number', dataType: 'String', required: true },
          ],
          recordCount: 50,
        },
        {
          objectName: 'LineItem',
          objectDescription: '',
          mappingTargetSalesforceObject: '',
          fields: [
            { fieldName: 'product@code', dataType: 'String', required: true },
            { fieldName: 'quantity', dataType: 'Integer', required: true },
          ],
          recordCount: -10,
        },
      ],
      projectContext: {
        projectId: 'PROJ-2026-001',
        sourceSystemId: 'SOURCE-SYS-001',
      },
    };

    const result = await validateSalesforceObjectDefinitions(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(3);

    // First object: should pass
    expect(result.validationResults[0].objectName).toBe('Invoice');
    expect(result.validationResults[0].isValid).toBe(true);
    expect(result.validationResults[0].errors).toHaveLength(0);

    // Second object: should have DuplicateObjectDefinitionError
    expect(result.validationResults[1].objectName).toBe('Invoice');
    expect(result.validationResults[1].isValid).toBe(false);
    expect(result.validationResults[1].errors).toContainEqual(
      expect.objectContaining({
        errorCode: 'DuplicateObjectDefinitionError',
        errorMessage:
          '同一プロジェクト内に同じオブジェクト名の定義が既に存在します。オブジェクト名を変更するか、既存の定義を確認してください。',
      })
    );

    // Third object: should have multiple errors
    expect(result.validationResults[2].objectName).toBe('LineItem');
    expect(result.validationResults[2].isValid).toBe(false);
    const thirdObjectErrors = result.validationResults[2].errors;
    expect(thirdObjectErrors.length).toBeGreaterThanOrEqual(4);

    expect(thirdObjectErrors).toContainEqual(
      expect.objectContaining({
        errorCode: 'InvalidObjectStructureError',
        errorMessage:
          'Salesforceオブジェクト定義の必須フィールドが不足しています。オブジェクト名、説明、マッピング対象Salesforceオブジェクトを確認してください。',
      })
    );

    expect(thirdObjectErrors).toContainEqual(
      expect.objectContaining({
        errorCode: 'InvalidFieldNameFormatError',
        errorMessage: 'フィールド名の形式が不正です。英数字とアンダースコアのみを使用し、予約語を避けてください。',
      })
    );

    expect(thirdObjectErrors).toContainEqual(
      expect.objectContaining({
        errorCode: 'InvalidRecordCountError',
        errorMessage: 'レコード件数が不正です。0以上の整数を指定してください。',
      })
    );

    expect(thirdObjectErrors).toContainEqual(
      expect.objectContaining({
        errorCode: 'MissingFieldDefinitionError',
        errorMessage:
          '移行に必須のフィールドが定義されていません。請求書オブジェクトには請求書番号・顧客ID・請求金額、請求明細オブジェクトには商品コード・数量・単価が必要です。',
      })
    );

    expect(result.summary.totalObjectsValidated).toBe(3);
    expect(result.summary.successCount).toBe(1);
    expect(result.summary.errorCount).toBe(2);
  });
});
