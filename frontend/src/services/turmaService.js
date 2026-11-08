import { apiRequest, ApiError } from "./apiClient";

// ============================================
// LISTAR TURMAS
// ============================================

export async function listarTurmas({ token, signal }) {
    // ==========================================
    // VERIFICAR AUTENTICAÇÃO
    // ==========================================

    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    // ==========================================
    // CONSULTAR O FASTAPI
    // ==========================================

    const resposta = await apiRequest("/api/turmas", {
        method: "GET",
        token,
        signal,
    });

    // ==========================================
    // VALIDAR O FORMATO DA RESPOSTA
    // ==========================================

    if (!Array.isArray(resposta)) {
        throw new ApiError("A API retornou uma lista de turmas inválida.");
    }

    return resposta;
}

// ============================================
// CONSULTAR TURMA PELO ID
// ============================================

export async function consultarTurma({ turmaId, token, signal }) {
    // ==========================================
    // VALIDAR O IDENTIFICADOR
    // ==========================================

    const id = Number(turmaId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Informe um ID de turma válido.");
    }

    // ==========================================
    // VERIFICAR AUTENTICAÇÃO
    // ==========================================

    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    // ==========================================
    // CONSULTAR O FASTAPI
    // ==========================================

    const resposta = await apiRequest(`/api/turmas/${id}`, {
        method: "GET",
        token,
        signal,
    });

    // ==========================================
    // VALIDAR O FORMATO
    // ==========================================

    if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) {
        throw new ApiError("A API retornou dados inválidos para a turma.");
    }

    return resposta;
}
