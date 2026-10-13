import { analyzeReferenceRelationships } from "../../src/logic/reference-relationship-analyzer";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-126: audit trail metadata", () => {
  it("should record executedAt and executedByUserId in analysisMetadata", async () => {
    const mockMappingDetailsForProject = jest.fn().mockResolvedValue({
      customObjectDefinitions: [
        {
          objectId: "obj-invoice",
          objectName: "Invoice__c",
          fields: [
            { fieldId: "fld-inv-number", fieldName: "InvoiceNumber__c", dataType: "Text", required: true }
          ]
        },
        {
          objectId: "obj-invoice-line",
          objectName: "InvoiceLine__c",
          fields: [
            { fieldId: "fld-line-amount", fieldName: "LineAmount__c", dataType: "Currency", required: false }
          ]
        }
      ],
      objectReferences: [
        { relationshipId: "rel-001", sourceObject: "obj-invoice-line", targetObject: "obj-invoice", referenceFieldName: "Invoice__c", cardinality: "many-to-one", deleteAction: "cascade" }
      ],
      calculationLogics: [
        { logicId: "calc-001", targetObject: "obj-invoice", logicType: "rollup_summary", dependsOnFields: ["fld-line-amount"], dependsOnRelationships: ["rel-001"] }
      ]
    });

    const mockMappingDetailsByTargetSystem = jest.fn().mockResolvedValue({
      targetSystemId: "oracle-erp-2024",
      standardFeatures: [
        { featureId: "feat-master-detail", featureName: "MasterDetailRelationship", supported: true }
      ]
    });

    jest.spyOn(mappingPersistence, "retrieveMappingDetailsForProject").mockImplementation(mockMappingDetailsForProject);
    jest.spyOn(mappingPersistence, "retrieveMappingDetailsByTargetSystem").mockImplementation(mockMappingDetailsByTargetSystem);

    const executedAtDate = new Date("2024-01-15T10:30:45.123Z");
    const input = {
      projectId: "proj-invoice-202401",
      targetSystemId: "oracle-erp-2024",
      executedAt: executedAtDate,
      executedByUserId: "user-admin-001",
      includeCalculationLogicDependencies: true
    };

    const result = await analyzeReferenceRelationships(input);

    expect(result.analysisMetadata).toBeDefined();
    expect(result.analysisMetadata.executedAt).toEqual(executedAtDate);
    expect(result.analysisMetadata.executedByUserId).toBe("user-admin-001");
  });
});
