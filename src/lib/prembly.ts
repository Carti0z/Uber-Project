interface PremblyResult {
  ok: boolean;
  valid: boolean;
  message: string;
}

function getValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function coerceBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (
      ["true", "valid", "verified", "success", "approved", "completed"].includes(
        normalized
      )
    ) {
      return true;
    }
    if (["false", "invalid", "failed", "rejected", "error"].includes(normalized)) {
      return false;
    }
  }
  return undefined;
}

function detectValidity(payload: unknown): boolean {
  const checks = [
    "valid",
    "status",
    "data.valid",
    "data.status",
    "data.verification.status",
    "data.verification.valid",
    "verification.valid",
  ];

  for (const path of checks) {
    const candidate = coerceBoolean(getValue(payload, path));
    if (candidate !== undefined) return candidate;
  }
  return false;
}

async function postIdentityCheck(
  path: string,
  value: string,
  label: string
): Promise<PremblyResult> {
  const apiKey = process.env.PREMBLY_API_KEY;
  const appId = process.env.PREMBLY_APP_ID;
  const baseUrl = process.env.PREMBLY_BASE_URL || "https://api.prembly.com";

  if (!apiKey) {
    return {
      ok: false,
      valid: false,
      message: "PREMBLY_API_KEY is not configured.",
    };
  }

  try {
    const url = new URL(path, baseUrl).toString();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
        ...(appId ? { app_id: appId, "x-app-id": appId } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: value,
        value,
        [label]: value,
        number: value,
        country: "NG",
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg =
        (getValue(payload, "message") as string) ||
        (getValue(payload, "error.message") as string) ||
        `Prembly ${label} check failed`;
      return { ok: false, valid: false, message: errMsg };
    }

    return {
      ok: true,
      valid: detectValidity(payload),
      message: `${label.toUpperCase()} check completed`,
    };
  } catch {
    return {
      ok: false,
      valid: false,
      message: `Unable to reach Prembly for ${label.toUpperCase()} validation.`,
    };
  }
}

export async function verifyDriverDocumentsWithPrembly(input: {
  nin: string;
  licenseNumber: string;
}) {
  const ninPath = process.env.PREMBLY_NIN_PATH || "/identitypass/verification/nin";
  const licensePath =
    process.env.PREMBLY_DRIVERS_LICENSE_PATH ||
    "/identitypass/verification/drivers_license";

  const [ninResult, licenseResult] = await Promise.all([
    postIdentityCheck(ninPath, input.nin, "nin"),
    postIdentityCheck(licensePath, input.licenseNumber, "license"),
  ]);

  const verified = ninResult.valid && licenseResult.valid;
  const allOk = ninResult.ok && licenseResult.ok;

  const remark = verified
    ? "Verification completed successfully. NIN and driver's license validated via Prembly."
    : `Verification failed. NIN: ${ninResult.valid ? "valid" : "invalid"}; License: ${
        licenseResult.valid ? "valid" : "invalid"
      }. ${
        !allOk
          ? [ninResult.message, licenseResult.message].filter(Boolean).join(" ")
          : "Please review your documents and try again."
      }`;

  return {
    ninVerified: ninResult.valid,
    licenseVerified: licenseResult.valid,
    documentsVerified: verified,
    verificationStatus: verified ? "VERIFIED" : "REJECTED",
    verificationRemark: remark,
  } as const;
}
