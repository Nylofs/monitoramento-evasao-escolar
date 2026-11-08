import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ROTA
// Confirmar no Swagger.
// ============================================

const ROTA_ESCOLAS = "/api/escolas";

// ============================================
// EXCLUIR ESCOLA
// ============================================

export async function excluirEscola({ escolaId, token }) {
    // ==========================================
    // VALIDAR ID
    // ==========================================

    const id = Number(escolaId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Informe uma escola válida para exclusão.");
    }

    // ==========================================
    // VALIDAR AUTENTICAÇÃO
    // ==========================================

    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    // ==========================================
    // SOLICITAR EXCLUSÃO AO BACKEND
    // ==========================================

    return apiRequest(`${ROTA_ESCOLAS}/${id}`, {
        method: "DELETE",
        token,
    });
}
