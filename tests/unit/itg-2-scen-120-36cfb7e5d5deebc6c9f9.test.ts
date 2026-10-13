import { analyzeReferenceRelationships, IncompatibleReferencePatternError } from "../../src/logic/reference-relationship-analyzer";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-120: IncompatibleReferencePattern error", () => {
  it("should throw IncompatibleReferencePatternError when ManyToMany reference is incompatible with target system", async () => {
    const mockMappingDetailsForProject = jest.fn().mockResolvedValue({
      customObjectDefinitions: [
        {
          objectId: "Invoice__c",
          objectName: "請求書",
          fields: [
            { fieldId: "f1", fieldName: "InvoiceNumber", dataType: "Text" },
            { fieldId: "f2", fieldName: "OpportunityLookup", dataType: "Lookup", referenceTargetObject: "Opportunity" }
          ]
        },
        {
          objectId: "InvoiceLineItem__c",
          objectName: "請求明細",
          fields: [
            { fieldId: "f3", fieldName: "LineAmount", dataType: "Currency" },
            { fieldId: "f4", fieldName: "InvoiceMasterDetail", dataType: "MasterDetail", referenceTargetObject: "Invoice__c" }
          ]
        },
        {
          objectId: "CustomLineConfig__c",
          objectName: "請求行カスタム設定",
          fields: [
            { fieldId: "f5", fieldName: "ConfigName", dataType: "Text" }
          ]
        }
      ],
      objectReferences: [
        { relationshipId: "rel-1", sourceObject: "Invoice__c", targetObject: "Opportunity", referenceField: "OpportunityLookup", cardinality: "ManyToOne", referenceType: "Lookup", deleteAction: "SetNull" },
        { relationshipId: "rel-2", sourceObject: "InvoiceLineItem__c", targetObject: "Invoice__c", referenceField: "InvoiceMasterDetail", cardinality: "ManyToOne", referenceType: "MasterDetail", deleteAction: "Cascade" },
        { relationshipId: "rel-3", sourceObject: "InvoiceLineItem__c", targetObject: "CustomLineConfig__c", referenceField: "ConfigLookup", cardinality: "ManyToMany", referenceType: "JunctionObject", deleteAction: "Restrict" }
      ],
      calculationLogics: [
        { logicId: "calc-1", targetObject: "Invoice__c", logicType: "RollupSummary", dependsOnField: "InvoiceLineItem__c.LineAmount", dependsOnLogic: [] }
      ]
    });

    const mockMappingDetailsByTargetSystem = jest.fn().mockResolvedValue({
      systemId: "target-erp-oracle-001",
      supportedReferencePatterns: ["OneToMany", "ManyToOne"],
      unsupportedReferencePatterns: ["ManyToMany", "ConditionalReference"]
    });

    jest.spyOn(mappingPersistence, "retrieveMappingDetailsForProject").mockImplementation(mockMappingDetailsForProject);
    jest.spyOn(mappingPersistence, "retrieveMappingDetailsByTargetSystem").mockImplementation(mockMappingDetailsByTargetSystem);

    const input = {
      projectId: "proj-invoice-migration-001",
      targetSystemId: "target-erp-oracle-001",
      includeCalculationLogicDependencies: true,
      executedAt: new Date("2026-10-15T10:30:00Z"),
      executedByUserId: "user-admin-123"
    };

    await expect(analyzeReferenceRelationships(input)).rejects.toThrow(IncompatibleReferencePatternError);
    await expect(analyzeReferenceRelationships(input)).rejects.toThrow("参照関係パターンが移行対象システムと互換性がありません。");
  });
});
