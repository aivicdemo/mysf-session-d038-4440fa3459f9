import { analyzeReferenceRelationships } from "../../src/logic/reference-relationship-analyzer";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-124: no circular dependencies", () => {
  it("should return empty circularDependencies array when no cycles exist", async () => {
    const mockMappingDetailsForProject = jest.fn().mockResolvedValue({
      customObjectDefinitions: [
        {
          objectId: "obj-invoice-001",
          objectName: "Invoice__c",
          fields: [
            { fieldId: "fld-inv-001", fieldName: "InvoiceNumber__c", dataType: "Text" },
            { fieldId: "fld-inv-002", fieldName: "Amount__c", dataType: "Currency" },
            { fieldId: "fld-inv-003", fieldName: "OpportunityId__c", dataType: "Lookup" }
          ]
        },
        {
          objectId: "obj-invoice-detail-001",
          objectName: "InvoiceLineItem__c",
          fields: [
            { fieldId: "fld-detail-001", fieldName: "LineItemNumber__c", dataType: "Text" },
            { fieldId: "fld-detail-002", fieldName: "Quantity__c", dataType: "Number" },
            { fieldId: "fld-detail-003", fieldName: "InvoiceId__c", dataType: "Lookup" }
          ]
        }
      ],
      objectReferences: [
        { relationshipId: "rel-001", sourceObjectId: "obj-invoice-001", targetObjectId: "obj-invoice-detail-001", referenceFieldName: "InvoiceId__c", cardinality: "1:N", deleteAction: "Cascade" }
      ],
      calculationLogics: [
        { logicId: "calc-001", targetObjectId: "obj-invoice-001", logicType: "RollupSummary", referencedFieldName: "InvoiceId__c", dependentLogicIds: [] }
      ]
    });

    const mockMappingDetailsByTargetSystem = jest.fn().mockResolvedValue([
      { featureId: "feat-oracle-001", featureName: "Invoice Table", supportedReferencePatterns: ["1:N", "Lookup"], supportedCalculationTypes: ["RollupSummary", "Formula"] }
    ]);

    jest.spyOn(mappingPersistence, "retrieveMappingDetailsForProject").mockImplementation(mockMappingDetailsForProject);
    jest.spyOn(mappingPersistence, "retrieveMappingDetailsByTargetSystem").mockImplementation(mockMappingDetailsByTargetSystem);

    const input = {
      projectId: "proj-invoice-001",
      targetSystemId: "target-oracle-erp-01",
      includeCalculationLogicDependencies: true,
      executedAt: new Date("2026-10-15T10:30:00Z"),
      executedByUserId: "user-admin-001"
    };

    const result = await analyzeReferenceRelationships(input);

    expect(result.circularDependencies).toEqual([]);
    expect(Array.isArray(result.circularDependencies)).toBe(true);
  });
});
