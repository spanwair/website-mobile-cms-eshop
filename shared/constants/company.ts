// SINGLE SOURCE OF TRUTH for Smalljobs s.r.o.'s legal identity — the company that becomes
// seller-of-record on consumer-facing documents for smalljobs_commission orders. Sourced
// from the public obchodní rejstřík (justice.cz / ARES), spisová značka C 97915/KSOS,
// Krajský soud v Ostravě.
//
// VAT_PAYER is false because Smalljobs' DIČ/VAT-payer status is not yet confirmed — keep
// this in sync with shared/constants/sellerMode.ts VAT_ENABLED (both flip together once
// confirmed). While false, documents must show "neplátce DPH podle §6 zákona o DPH".

export const SMALLJOBS_COMPANY = {
  name: "Smalljobs s.r.o.",
  ico: "22312846",
  dic: null as string | null,
  vatPayer: false,
  registeredSeat: {
    line1: "U parčíku 47/24, Topolany",
    postalCode: "779 00",
    city: "Olomouc",
    countryCode: "CZ",
  },
  courtRegistration: "C 97915/KSOS, Krajský soud v Ostravě",
  incorporatedOn: "2024-11-28",
  statutoryRepresentative: "Jan Gabriel, jednatel",
} as const;

// Consumer-facing seller-of-record block for smalljobs_commission orders — Smalljobs
// contracts with the customer in its own name (§2455 ObčZ), so it must be named as the
// seller on invoices/confirmations, not the creator's party.
export function sellerOfRecordInfo(lang: "cs" | "en" = "cs") {
  const address = `${SMALLJOBS_COMPANY.registeredSeat.line1}, ${SMALLJOBS_COMPANY.registeredSeat.postalCode} ${SMALLJOBS_COMPANY.registeredSeat.city}`;
  const vatNote = SMALLJOBS_COMPANY.vatPayer
    ? (SMALLJOBS_COMPANY.dic ? `DIČ ${SMALLJOBS_COMPANY.dic}` : "")
    : lang === "cs"
      ? "Neplátce DPH podle §6 zákona o DPH."
      : "Not registered as a VAT payer.";
  return { name: SMALLJOBS_COMPANY.name, ico: SMALLJOBS_COMPANY.ico, address, vatNote };
}
