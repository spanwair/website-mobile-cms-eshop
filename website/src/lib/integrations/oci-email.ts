// Transactional email via OCI Email Delivery HTTPS submission API.
// Edge-native: signs the request with WebCrypto (OCI request signing, RSA-SHA256),
// so it runs on the Cloudflare Workers runtime where raw SMTP sockets are unavailable.
// Endpoint: POST https://cell0.submit.email.<region>.oci.oraclecloud.com/20220926/actions/submitEmail
//
// Required env (see .env.production.example):
//   OCI_REGION, OCI_TENANCY_OCID, OCI_USER_OCID, OCI_KEY_FINGERPRINT,
//   OCI_PRIVATE_KEY (PKCS#8 PEM), OCI_COMPARTMENT_OCID, EMAIL_FROM
// Optional: EMAIL_FROM_NAME

const SUBMIT_PATH = "/20220926/actions/submitEmail";

interface OciConfig {
  region: string;
  tenancy: string;
  user: string;
  fingerprint: string;
  privateKeyPem: string;
  compartment: string;
  from: string;
  fromName: string | null;
}

function readConfig(): OciConfig | null {
  const region = import.meta.env.OCI_REGION;
  const tenancy = import.meta.env.OCI_TENANCY_OCID;
  const user = import.meta.env.OCI_USER_OCID;
  const fingerprint = import.meta.env.OCI_KEY_FINGERPRINT;
  const privateKeyPem = import.meta.env.OCI_PRIVATE_KEY;
  const compartment = import.meta.env.OCI_COMPARTMENT_OCID;
  const from = import.meta.env.EMAIL_FROM;
  if (!region || !tenancy || !user || !fingerprint || !privateKeyPem || !compartment || !from) return null;
  return {
    region, tenancy, user, fingerprint,
    // Env vars often carry the PEM with escaped newlines — normalise to real ones.
    privateKeyPem: String(privateKeyPem).replace(/\\n/g, "\n"),
    compartment, from,
    fromName: import.meta.env.EMAIL_FROM_NAME ?? null,
  };
}

export function ociConfigured(): boolean {
  return readConfig() !== null;
}

function base64(bytes: ArrayBuffer): string {
  const b = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const der = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i);
  return der.buffer;
}

async function importKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    pemToDer(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sha256B64(input: BufferSource): Promise<string> {
  return base64(await crypto.subtle.digest("SHA-256", input));
}

// Builds the OCI "Signature" Authorization header per the request-signing spec.
async function authorization(cfg: OciConfig, host: string, date: string, bodySha: string, len: number): Promise<string> {
  const signed = [
    `(request-target): post ${SUBMIT_PATH}`,
    `host: ${host}`,
    `date: ${date}`,
    `x-content-sha256: ${bodySha}`,
    `content-type: application/json`,
    `content-length: ${len}`,
  ].join("\n");
  const key = await importKey(cfg.privateKeyPem);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signed));
  const keyId = `${cfg.tenancy}/${cfg.user}/${cfg.fingerprint}`;
  const headers = "(request-target) host date x-content-sha256 content-type content-length";
  return `Signature version="1",keyId="${keyId}",algorithm="rsa-sha256",headers="${headers}",signature="${base64(sig)}"`;
}

interface Addr { email: string; name?: string }

export interface OciEmailInput {
  to: string | Addr | Array<string | Addr>;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

function toAddr(a: string | Addr): Addr {
  return typeof a === "string" ? { email: a } : a;
}

export async function sendEmail(input: OciEmailInput): Promise<void> {
  const cfg = readConfig();
  if (!cfg) throw new Error("OCI Email is not configured — set OCI_* vars in .env.production");

  const host = `cell0.submit.email.${cfg.region}.oci.oraclecloud.com`;
  const toList = (Array.isArray(input.to) ? input.to : [input.to]).map(toAddr);

  const payload: Record<string, unknown> = {
    sender: {
      compartmentId: cfg.compartment,
      senderAddress: { email: cfg.from, ...(cfg.fromName ? { name: cfg.fromName } : {}) },
    },
    recipients: { to: toList },
    subject: input.subject,
    bodyHtml: input.html,
    ...(input.text ? { bodyText: input.text } : {}),
    ...(input.replyTo ? { replyTo: [{ email: input.replyTo }] } : {}),
  };

  const bodyBytes = new TextEncoder().encode(JSON.stringify(payload));
  const bodySha = await sha256B64(bodyBytes);
  const date = new Date().toUTCString();
  const auth = await authorization(cfg, host, date, bodySha, bodyBytes.length);

  const res = await fetch(`https://${host}${SUBMIT_PATH}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      date,
      "x-content-sha256": bodySha,
      authorization: auth,
    },
    body: bodyBytes,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OCI Email send failed (${res.status}): ${detail}`);
  }
}
