export interface ApiErrorResult {
  message: string;
  fieldErrors: Record<string, string>;
}

export function extractApiError(err: unknown): ApiErrorResult {
  // Fetch gagal total: server mati, CORS diblokir, gak ada internet
  if (err instanceof TypeError) {
    return {
      message: "Tidak dapat terhubung ke server. Periksa koneksi internet kamu.",
      fieldErrors: {},
    };
  }

  // Response bukan JSON sama sekali (server balikin HTML error 500/502/504)
  if (err instanceof Error) {
    return {
      message: err.message || "Terjadi kesalahan pada server. Silakan coba lagi.",
      fieldErrors: {},
    };
  }

  // Response JSON valid dari Laravel: 422 validasi, 401, 404, 500 custom
  if (err && typeof err === "object") {
    const data = err as { message?: string; errors?: Record<string, string[]> };
    const fieldErrors: Record<string, string> = {};

    if (data.errors) {
      for (const key in data.errors) {
        fieldErrors[key] = data.errors[key][0];
      }
    }

    return {
      message: data.message || "Terjadi kesalahan. Silakan coba lagi.",
      fieldErrors,
    };
  }

  return { message: "Terjadi kesalahan yang tidak diketahui.", fieldErrors: {} };
}

// Dipakai bareng di login & register: NIM harus tanpa titik.
// Backend (AuthController::normalizeNim) toh bakal buang titiknya juga,
// ini cuma preview biar user tau NIM-nya bakal disimpan sebagai apa.
export function normalizeNim(value: string): string {
  return value.replace(/\./g, "");
}