import { SMALLJOBS_COMPANY } from "../constants/company";
import { COMMISSION_RATE, VAT_ENABLED } from "../constants/sellerMode";

// Auto-generates the public consumer notice for a party that sells via Smalljobs s.r.o.
// (commission mode). Generated from live config rather than hand-authored per store, so it
// can never drift out of sync with SMALLJOBS_COMPANY / VAT_ENABLED. Called by
// commissionaireService.acceptCommissionaireAgreement to (re)create the content_pages row
// at slug SMALLJOBS_SALE_NOTICE_SLUG the moment a party switches into commission mode.
export const SMALLJOBS_SALE_NOTICE_SLUG = "prodej-pres-smalljobs-sro";
export const SMALLJOBS_SALE_NOTICE_TITLE_CS = "Prodej prostřednictvím Smalljobs s.r.o.";
export const SMALLJOBS_SALE_NOTICE_TITLE_EN = "Sale via Smalljobs s.r.o.";

export function buildSmalljobsSaleNoticeMarkdown(lang: "cs" | "en", storeName: string): string {
  const address = `${SMALLJOBS_COMPANY.registeredSeat.line1}, ${SMALLJOBS_COMPANY.registeredSeat.postalCode} ${SMALLJOBS_COMPANY.registeredSeat.city}`;
  const vatLine = VAT_ENABLED && SMALLJOBS_COMPANY.vatPayer
    ? (lang === "cs" ? `Plátce DPH${SMALLJOBS_COMPANY.dic ? `, DIČ ${SMALLJOBS_COMPANY.dic}` : ""}.` : `VAT payer${SMALLJOBS_COMPANY.dic ? `, VAT ID ${SMALLJOBS_COMPANY.dic}` : ""}.`)
    : (lang === "cs" ? "Neplátce DPH podle § 6 zákona o dani z přidané hodnoty." : "Not registered as a VAT payer.");
  const commissionPct = Math.round(COMMISSION_RATE * 100);

  if (lang === "en") {
    return `## Sale via Smalljobs s.r.o.

Some products in the **${storeName}** store are sold by their creator without the creator having their own registered company. For those orders, **Smalljobs s.r.o.** acts as the seller in its own name, on the creator's account, under a commissionaire agreement (§2455 et seq. of the Civil Code).

**Seller of record for these orders:**

- Company: ${SMALLJOBS_COMPANY.name}
- IČO: ${SMALLJOBS_COMPANY.ico}
- Registered seat: ${address}
- Registered with the Regional Court in Ostrava, file no. C 97915/KSOS
- ${vatLine}

### Your rights are unaffected

Because Smalljobs contracts with you directly, Smalljobs — not the creator — is responsible to you for all statutory consumer rights, in particular:

- The right to withdraw from the contract within **14 days** of receiving the goods, without giving a reason.
- The right to have a complaint (reklamace) about defective goods handled within 30 days, under §2161 et seq. of the Civil Code.

The creator may physically handle a return or complaint on Smalljobs' behalf, but this does not reduce or replace your rights against Smalljobs as the seller.

### Commission and payout

Smalljobs deducts a ${commissionPct}% commission (plus VAT, if and when Smalljobs is a registered VAT payer) from the sale price and pays the remainder to the creator no earlier than 60 days after your payment, to ensure funds remain available to cover any withdrawal or complaint you raise.

### Your personal data

To fulfil, ship, and handle any return or complaint for these orders, Smalljobs shares the personal data necessary for that purpose (name, delivery address, order contents) with the creator, in addition to the processing described in the store's Privacy Policy. This does not change who your data controller is for the purposes of the sale contract, which remains Smalljobs s.r.o. for these orders.

*This notice is generated automatically and reflects Smalljobs s.r.o.'s current registration details.*`;
  }

  return `## Prodej prostřednictvím Smalljobs s.r.o.

Některé produkty v obchodě **${storeName}** prodává jejich tvůrce, který nemá vlastní registrovanou firmu. U těchto objednávek vystupuje jako prodávající vlastním jménem, na účet tvůrce, společnost **Smalljobs s.r.o.**, a to na základě komisionářské smlouvy (§ 2455 a násl. občanského zákoníku).

**Prodávající u těchto objednávek:**

- Obchodní firma: ${SMALLJOBS_COMPANY.name}
- IČO: ${SMALLJOBS_COMPANY.ico}
- Sídlo: ${address}
- Zapsaná u Krajského soudu v Ostravě, sp. zn. C 97915/KSOS
- ${vatLine}

### Vaše práva zůstávají nedotčena

Protože Smalljobs jedná vlastním jménem, je vůči vám ve smyslu spotřebitelského práva prodávajícím a odpovídá vám zejména za:

- právo odstoupit od smlouvy do **14 dnů** od převzetí zboží bez udání důvodu,
- právo na vyřízení reklamace vadného zboží do 30 dnů podle § 2161 a násl. občanského zákoníku.

Tvůrce může vrácení zboží nebo reklamaci fyzicky vyřizovat jménem Smalljobs, tím však nejsou nijak omezena vaše práva vůči Smalljobs jakožto prodávajícímu.

### Provize a výplata

Smalljobs si z prodejní ceny strhává ${commissionPct}% provizi (a DPH, pokud a jakmile se Smalljobs stane plátcem DPH) a zbytek vyplácí tvůrci nejdříve 60 dní po vaší platbě, aby měl k dispozici prostředky na pokrytí případného odstoupení od smlouvy nebo reklamace.

### Vaše osobní údaje

Za účelem vyřízení, doručení a případného vrácení nebo reklamace těchto objednávek předává Smalljobs tvůrci osobní údaje potřebné k tomuto účelu (jméno, doručovací adresa, obsah objednávky), a to nad rámec zpracování popsaného v zásadách ochrany osobních údajů obchodu. Správcem vašich osobních údajů pro účely kupní smlouvy u těchto objednávek zůstává Smalljobs s.r.o.

*Toto oznámení je generováno automaticky a odpovídá aktuálním registračním údajům Smalljobs s.r.o.*`;
}
