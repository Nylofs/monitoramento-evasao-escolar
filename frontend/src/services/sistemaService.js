import { apiRequest } from "./apiClient";

// ============================================
// CONSULTAR A ROTA INICIAL DO FASTAPI
// ============================================

export async function consultarSistema(signal) {
    return apiRequest("/", {
        method: "GET",
        signal,
    });
}
