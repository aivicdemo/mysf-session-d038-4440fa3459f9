import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';

describe('SCEN-367: 複数の参照関係定義に異なるエラーが存在するとき、各エラーが個別に記録される', () => {
  it('複数の異なるエラー条件を持つ7件の参照関係が処理される', async () => {
    const projectContext: any = {
      projectId: 'proj-test-001',
      targetSystemId: 'target-001',
    };

    const referenceRelationships: any[] = [
      // ref-001: targetObjectId が null
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectId: 'Invoice',
        targetObjectId: null as any,
        referenceFieldName: 'account_ref',
        cardinality: '1:N',
        deleteAction: 'CASCADE',
        required: false,
      },
      // ref-002: referenceFieldName が null
      {
        referenceRelationshipId: 'ref-002',
        sourceObjectId: 'InvoiceLineItem',
        targetObjectId: 'Invoice',
        referenceFieldName: null as any,
        cardinality: '1:N',
        deleteAction: 'CASCADE',
        required: false,
      },
      // ref-003: cardinality が INVALID_VALUE
      {
        referenceRelationshipId: 'ref-003',
        sourceObjectId: 'InvoiceLineItem',
        targetObjectId: 'Product',
        referenceFieldName: 'product_ref',
        cardinality: 'INVALID_VALUE',
        deleteAction: 'CASCADE',
        required: false,
      },
      // ref-004: sourceObjectId が UnknownSource
      {
        referenceRelationshipId: 'ref-004',
        sourceObjectId: 'UnknownSource',
        targetObjectId: 'Invoice',
        referenceFieldName: 'invoice_ref',
        cardinality: '1:N',
        deleteAction: 'RESTRICT',
        required: false,
      },
      // ref-005: targetObjectId が UnknownTarget
      {
        referenceRelationshipId: 'ref-005',
        sourceObjectId: 'Invoice',
        targetObjectId: 'UnknownTarget',
        referenceFieldName: 'parent_ref',
        cardinality: '1:1',
        deleteAction: 'SET_NULL',
        required: false,
      },
      // ref-006: referenceFieldName 'nonexistent_field' が InvoiceLineItem に存在しない
      {
        referenceRelationshipId: 'ref-006',
        sourceObjectId: 'InvoiceLineItem',
        targetObjectId: 'Invoice',
        referenceFieldName: 'nonexistent_field',
        cardinality: '1:N',
        deleteAction: 'CASCADE',
        required: false,
      },
      // ref-007: deleteAction が INVALID_BEHAVIOR
      {
        referenceRelationshipId: 'ref-007',
        sourceObjectId: 'Invoice',
        targetObjectId: 'InvoiceLineItem',
        referenceFieldName: 'line_items_ref',
        cardinality: '1:N',
        deleteAction: 'INVALID_BEHAVIOR',
        required: false,
      },
    ];

    const objectDefinitions: any[] = [
      {
        objectName: 'Invoice',
        objectDescription: 'Invoice',
        mappingTargetSalesforceObject: 'Invoice',
        fields: [
          { fieldName: 'id', dataType: 'Text', required: false },
          { fieldName: 'account_ref', dataType: 'Lookup', required: false },
          { fieldName: 'parent_ref', dataType: 'Lookup', required: false },
          { fieldName: 'line_items_ref', dataType: 'Lookup', required: false },
        ],
        recordCount: 0,
      },
      {
        objectName: 'InvoiceLineItem',
        objectDescription: 'InvoiceLineItem',
        mappingTargetSalesforceObject: 'InvoiceLineItem',
        fields: [
          { fieldName: 'id', dataType: 'Text', required: false },
          { fieldName: 'invoice_ref', dataType: 'Lookup', required: false },
          { fieldName: 'product_ref', dataType: 'Lookup', required: false },
        ],
        recordCount: 0,
      },
      {
        objectName: 'Product',
        objectDescription: 'Product',
        mappingTargetSalesforceObject: 'Product',
        fields: [
          { fieldName: 'id', dataType: 'Text', required: false },
        ],
        recordCount: 0,
      },
    ];

    const input: any = {
      projectContext,
      referenceRelationships,
      objectDefinitions,
    };

    const result = await validateObjectReferenceRelationships(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults.length).toBe(7);

    // ref-001: InvalidReferenceRelationshipStructure
    expect(result.validationResults[0].referenceRelationshipId).toBe('ref-001');
    const ref001Error = result.validationResults[0].errors.find(
      e => e.errorCode === 'InvalidReferenceRelationshipStructure'
    );
    expect(ref001Error).toBeDefined();
    expect(ref001Error?.errorMessage).toBe(
      '参照関係定義が不完全です。ソースオブジェクトID、ターゲットオブジェクトID、参照フィールド名、カーディナリティはすべて必須です。'
    );

    // ref-002: InvalidReferenceRelationshipStructure
    expect(result.validationResults[1].referenceRelationshipId).toBe('ref-002');
    const ref002Error = result.validationResults[1].errors.find(
      e => e.errorCode === 'InvalidReferenceRelationshipStructure'
    );
    expect(ref002Error).toBeDefined();

    // ref-003: InvalidCardinality
    expect(result.validationResults[2].referenceRelationshipId).toBe('ref-003');
    const ref003Error = result.validationResults[2].errors.find(
      e => e.errorCode === 'InvalidCardinality'
    );
    expect(ref003Error).toBeDefined();
    expect(ref003Error?.errorMessage).toBe(
      'カーディナリティが無効です。1:1、1:N、N:N のいずれかを指定してください。'
    );

    // ref-004: SourceObjectNotFound
    expect(result.validationResults[3].referenceRelationshipId).toBe('ref-004');
    const ref004Error = result.validationResults[3].errors.find(
      e => e.errorCode === 'SourceObjectNotFound'
    );
    expect(ref004Error).toBeDefined();
    expect(ref004Error?.errorMessage).toBe(
      '参照関係のソースオブジェクトが見つかりません。オブジェクト定義に存在するオブジェクトを指定してください。'
    );

    // ref-005: TargetObjectNotFound
    expect(result.validationResults[4].referenceRelationshipId).toBe('ref-005');
    const ref005Error = result.validationResults[4].errors.find(
      e => e.errorCode === 'TargetObjectNotFound'
    );
    expect(ref005Error).toBeDefined();
    expect(ref005Error?.errorMessage).toBe(
      '参照関係のターゲットオブジェクトが見つかりません。オブジェクト定義に存在するオブジェクトを指定してください。'
    );

    // ref-006: ReferenceFieldNotFoundInSourceObject
    expect(result.validationResults[5].referenceRelationshipId).toBe('ref-006');
    const ref006Error = result.validationResults[5].errors.find(
      e => e.errorCode === 'ReferenceFieldNotFoundInSourceObject'
    );
    expect(ref006Error).toBeDefined();
    expect(ref006Error?.errorMessage).toBe(
      '参照フィールドがソースオブジェクトに見つかりません。ソースオブジェクトのフィールド定義を確認してください。'
    );

    // ref-007: InvalidDeleteBehavior
    expect(result.validationResults[6].referenceRelationshipId).toBe('ref-007');
    const ref007Error = result.validationResults[6].errors.find(
      e => e.errorCode === 'InvalidDeleteBehavior'
    );
    expect(ref007Error).toBeDefined();
    expect(ref007Error?.errorMessage).toBe(
      '削除時の動作が無効です。CASCADE、RESTRICT、SET_NULL のいずれかを指定してください。'
    );

    expect(result.summary.totalObjectsValidated).toBe(7);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(7);
    expect(result.circularDependencies).toEqual([]);
  });
});
