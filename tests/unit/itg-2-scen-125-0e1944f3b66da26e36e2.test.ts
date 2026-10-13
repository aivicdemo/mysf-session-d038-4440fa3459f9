import { analyzeReferenceRelationships } from "../../src/logic/reference-relationship-analyzer";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-125: reference graph with nodes and edges", () => {
  it("should return reference graph with nodes, edges, and proper metadata", async () => {
    const mockMappingDetailsForProject = jest.fn().mockResolvedValue({
      customObjectDefinitions: [
        {
          objectId: "obj-invoice-001",
          objectName: "Invoice__c",
          fields: [
            { fieldId: "fld-inv-number", fieldName: "InvoiceNumber__c", dataType: "Text" },
            { fieldId: "fld-inv-amount", fieldName: "TotalAmount__c", dataType: "Currency" },
            { fieldId: "fld-inv-opportunity-ref", fieldName: "Opportunity__c", dataType: "Lookup", referencedObject: "Opportunity" }
          ]
        },
        {
          objectId: "obj-invoice-line-001",
          objectName: "InvoiceLine__c",
          fields: [
            { fieldId: "fld-line-description", fieldName: "Description__c", dataType: "Text" },
            { fieldId: "fld-line-amount", fieldName: "LineAmount__c", dataType: "Currency" },
            { fieldId: "fld-line-invoice-ref", fieldName: "Invoice__c", dataType: "MasterDetail", referencedObject: "Invoice__c" }
          ]
        }
      ],
      objectReferences: [
        { relationshipId: "rel-inv-opp", sourceObject: "Invoice__c", targetObject: "Opportunity", referenceField: "Opportunity__c", cardinality: "N:1", onDeleteAction: "Restrict" },
        { relationshipId: "rel-line-inv", sourceObject: "InvoiceLine__c", targetObject: "Invoice__c", referenceField: "Invoice__c", cardinality: "N:1", onDeleteAction: "Cascade" }
      ],
      calculationLogics: [
        { logicId: "calc-inv-total", objectName: "Invoice__c", logicType: "RollupSummary", dependsOn: ["InvoiceLine__c.LineAmount__c"], targetField: "TotalAmount__c" }
      ]
    });

    const mockMappingDetailsByTargetSystem = jest.fn().mockResolvedValue([
      { systemId: "target-oracle-erp-001", featureId: "feat-1to1-ref", featureName: "1対1参照関係", supported: true, dependencies: [] },
      { systemId: "target-oracle-erp-001", featureId: "feat-n2n-ref", featureName: "多対多参照関係", supported: false, dependencies: [] },
      { systemId: "target-oracle-erp-001", featureId: "feat-rollup", featureName: "ロールアップ集計", supported: true, dependencies: [] }
    ]);

    jest.spyOn(mappingPersistence, "retrieveMappingDetailsForProject").mockImplementation(mockMappingDetailsForProject);
    jest.spyOn(mappingPersistence, "retrieveMappingDetailsByTargetSystem").mockImplementation(mockMappingDetailsByTargetSystem);

    const input = {
      projectId: "proj-invoice-migration-001",
      targetSystemId: "target-oracle-erp-001",
      includeCalculationLogicDependencies: true,
      executedAt: new Date("2026-01-15T10:30:00.000Z"),
      executedByUserId: "user-admin-001"
    };

    const result = await analyzeReferenceRelationships(input);

    expect(result.referenceGraph).toBeDefined();
    expect(result.referenceGraph.nodes).toHaveLength(3);
    expect(result.referenceGraph.edges).toHaveLength(2);
    expect(result.referenceGraph.nodes[0]).toHaveProperty("objectName");
    expect(result.referenceGraph.edges[0]).toHaveProperty("cardinality");
    expect(result.circularDependencies).toEqual([]);
    expect(result.calculationLogicDependencies).toBeDefined();
    expect(result.targetSystemCompatibility).toBeDefined();
    expect(result.analysisMetadata).toBeDefined();
    expect(result.analysisMetadata.executedAt).toEqual(new Date("2026-01-15T10:30:00.000Z"));
    expect(result.analysisMetadata.executedByUserId).toBe("user-admin-001");
  });
});
