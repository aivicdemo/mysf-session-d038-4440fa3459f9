import { analyzeReferenceRelationships, DataIntegrityViolation } from "../../src/logic/reference-relationship-analyzer";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-122: DataIntegrityViolation error", () => {
  it("should throw DataIntegrityViolation error when input data has inconsistencies with circular dependencies", async () => {
    const mockMappingDetailsForProject = jest.fn().mockResolvedValue({
      customObjectDefinitions: [
        {
          objectId: "obj-001",
          objectName: "Invoice__c",
          fields: [
            { fieldId: "fld-001", fieldName: "InvoiceNumber__c", dataType: "Text", required: true },
            { fieldId: "fld-002", fieldName: "Opportunity__c", dataType: "Lookup", referenceTo: "Opportunity", required: false }
          ]
        },
        {
          objectId: "obj-002",
          objectName: "InvoiceLineItem__c",
          fields: [
            { fieldId: "fld-003", fieldName: "Invoice__c", dataType: "MasterDetail", referenceTo: "Invoice__c", required: true }
          ]
        }
      ],
      objectReferences: [
        { relationshipId: "rel-001", sourceObject: "Invoice__c", targetObject: "Opportunity", sourceField: "Opportunity__c", cardinality: "Many-to-One", deleteAction: "SetNull" },
        { relationshipId: "rel-002", sourceObject: "InvoiceLineItem__c", targetObject: "Invoice__c", sourceField: "Invoice__c", cardinality: "Many-to-One", deleteAction: "Cascade" },
        { relationshipId: "rel-003", sourceObject: "Invoice__c", targetObject: "InvoiceLineItem__c", sourceField: null, cardinality: "One-to-Many", deleteAction: null, referencedField: "Invoice__c" }
      ],
      calculationLogics: [
        { logicId: "logic-001", targetObject: "Invoice__c", logicType: "RollupSummary", formula: "SUM(InvoiceLineItem__c.Amount__c)", dependsOn: ["InvoiceLineItem__c.Amount__c"], referenceFields: ["InvoiceLineItem__c"] },
        { logicId: "logic-002", targetObject: "InvoiceLineItem__c", logicType: "Formula", formula: "Invoice__r.TotalAmount__c * 0.1", dependsOn: ["Invoice__c.TotalAmount__c"], referenceFields: ["Invoice__c"] }
      ]
    });

    const mockMappingDetailsByTargetSystem = jest.fn().mockResolvedValue({
      systemId: "target-sys-001",
      systemName: "Oracle ERP",
      features: [
        { featureId: "feat-001", featureName: "LookupRelationship", supported: true, constraints: [] },
        { featureId: "feat-002", featureName: "MasterDetailRelationship", supported: false, constraints: ["CascadeDeleteNotSupported"] },
        { featureId: "feat-003", featureName: "RollupSummary", supported: true, constraints: [] }
      ]
    });

    jest.spyOn(mappingPersistence, "retrieveMappingDetailsForProject").mockImplementation(mockMappingDetailsForProject);
    jest.spyOn(mappingPersistence, "retrieveMappingDetailsByTargetSystem").mockImplementation(mockMappingDetailsByTargetSystem);

    const input = {
      projectId: "proj-001",
      targetSystemId: "target-sys-001",
      includeCalculationLogicDependencies: true,
      executedAt: new Date("2026-10-07T10:00:00Z"),
      executedByUserId: "user-123"
    };

    await expect(analyzeReferenceRelationships(input)).rejects.toThrow(DataIntegrityViolation);
    await expect(analyzeReferenceRelationships(input)).rejects.toThrow("入力データの整合性が確認できません。");
  });
});
