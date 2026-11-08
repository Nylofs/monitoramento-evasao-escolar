import { apiRequest } from "./apiClient";

// ============================================
// CONSULTAR DASHBOARD DE UMA ESCOLA
// ============================================

export async function consultarDashboardEscola({
    escolaId,
    dataInicio = "",
    dataFim = "",
    token,
    signal,
}) {
    // ==========================================
    // VALIDAR ID DA ESCOLA
    // ==========================================

    const id = Number(escolaId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Informe um ID de escola válido.");
    }

    // ==========================================
    // VALIDAR AUTENTICAÇÃO
    // ==========================================

    if (!token) {
        throw new Error("É necessário estar autenticado.");
    }

    // ==========================================
    // CONSULTAR O FASTAPI
    // ==========================================

    return apiRequest(`/api/dashboard/escolas/${id}`, {
        method: "GET",
        token,
        signal,
        params: {
            data_inicio: dataInicio,
            data_fim: dataFim,
        },
    });
}
