import { analyzeReferenceRelationships, UnsupportedCalculationLogicType } from "../../src/logic/reference-relationship-analyzer";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-121: UnsupportedCalculationLogicType error", () => {
  it("should throw UnsupportedCalculationLogicType error when ProcessBuilder or Flow logic types are unsupported", async () => {
    const mockMappingDetailsForProject = jest.fn().mockResolvedValue({
      customObjectDefinitions: [
        {
          objectId: "obj-invoice",
          objectName: "Invoice__c",
          fields: [
            { fieldId: "f1", fieldName: "InvoiceNumber__c", dataType: "Text" },
            { fieldId: "f2", fieldName: "TotalAmount__c", dataType: "Currency" }
          ]
        },
        {
          objectId: "obj-invoice-line",
          objectName: "InvoiceLine__c",
          fields: [
            { fieldId: "f3", fieldName: "LineAmount__c", dataType: "Currency" },
            { fieldId: "f4", fieldName: "InvoiceRef__c", dataType: "Lookup" }
          ]
        }
      ],
      objectReferences: [
        { relationshipId: "rel-001", sourceObjectId: "obj-invoice", targetObjectId: "obj-invoice-line", referenceField: "f4", cardinality: "1:N", cascadeDelete: true }
      ],
      calculationLogics: [
        { logicId: "logic-pb-001", objectId: "obj-invoice", logicType: "ProcessBuilder", description: "Auto-update invoice total on line item changes", dependsOn: ["f4"] },
        { logicId: "logic-flow-001", objectId: "obj-invoice-line", logicType: "Flow", description: "Validate line amount before save", dependsOn: ["f3"] }
      ]
    });

    const mockMappingDetailsByTargetSystem = jest.fn().mockResolvedValue({
      targetSystemId: "target-oracle-erp",
      supportedCalculationLogicTypes: ["Trigger", "PL/SQL Procedure", "Custom Package"],
      unsupportedCalculationLogicTypes: ["ProcessBuilder", "Flow", "Workflow Rule"],
      supportedReferencePatterns: ["Foreign Key", "One-to-Many"],
      maxCascadeDepth: 5
    });

    jest.spyOn(mappingPersistence, "retrieveMappingDetailsForProject").mockImplementation(mockMappingDetailsForProject);
    jest.spyOn(mappingPersistence, "retrieveMappingDetailsByTargetSystem").mockImplementation(mockMappingDetailsByTargetSystem);

    const input = {
      projectId: "proj-invoice-001",
      targetSystemId: "target-oracle-erp",
      includeCalculationLogicDependencies: true,
      executedAt: new Date("2026-01-15T10:30:00Z"),
      executedByUserId: "user-migration-001"
    };

    await expect(analyzeReferenceRelationships(input)).rejects.toThrow(UnsupportedCalculationLogicType);
    await expect(analyzeReferenceRelationships(input)).rejects.toThrow("計算ロジック種別が移行対象システムでサポートされていません。");
  });
});
