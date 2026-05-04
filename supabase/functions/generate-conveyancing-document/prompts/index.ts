export type { DocumentConfig } from "./deed_of_sale.ts";
export { getDeedOfSaleConfig } from "./deed_of_sale.ts";
export { getTransferDutyConfig } from "./transfer_duty.ts";
export { getPowerOfAttorneyConfig } from "./power_of_attorney.ts";
export { getAffidavitConfig } from "./affidavit.ts";
export { getBondRegistrationConfig } from "./bond_registration.ts";
export { getDeclarationOfPurchaseConfig } from "./declaration_of_purchase.ts";
export { getMissingInformationConfig } from "./missing_information.ts";
export { getDeedOfTransferConfig } from "./deed_of_transfer.ts";

import type { DocumentConfig } from "./deed_of_sale.ts";
import { getDeedOfSaleConfig } from "./deed_of_sale.ts";
import { getTransferDutyConfig } from "./transfer_duty.ts";
import { getPowerOfAttorneyConfig } from "./power_of_attorney.ts";
import { getAffidavitConfig } from "./affidavit.ts";
import { getBondRegistrationConfig } from "./bond_registration.ts";
import { getDeclarationOfPurchaseConfig } from "./declaration_of_purchase.ts";
import { getMissingInformationConfig } from "./missing_information.ts";
import { getDeedOfTransferConfig } from "./deed_of_transfer.ts";
import { BOTSWANA_CONVEYANCING_RULES } from "./business_rules.ts";

const configFactories: Record<string, (transactionBlock: string) => DocumentConfig> = {
  deed_of_sale: getDeedOfSaleConfig,
  deed_of_transfer: getDeedOfTransferConfig,
  transfer_duty: getTransferDutyConfig,
  power_of_attorney: getPowerOfAttorneyConfig,
  affidavit: getAffidavitConfig,
  bond_registration: getBondRegistrationConfig,
  declaration_of_purchase: getDeclarationOfPurchaseConfig,
  missing_information: getMissingInformationConfig,
};

/**
 * Returns the document config for a given document type.
 * Injects shared Botswana conveyancing business rules into all configs.
 * Falls back to deed_of_sale if the type is unknown.
 */
export function getDocumentConfig(documentType: string, transactionBlock: string): DocumentConfig {
  const factory = configFactories[documentType] || configFactories.deed_of_sale;
  const config = factory(transactionBlock);
  return {
    ...config,
    instructions: `${config.instructions}\n\n${BOTSWANA_CONVEYANCING_RULES}`,
  };
}
