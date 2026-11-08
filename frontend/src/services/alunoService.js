import { apiRequest, ApiError } from "./apiClient";

// ============================================
// LISTAR ALUNOS
// ============================================

export async function listarAlunos({ token, signal }) {
    // ==========================================
    // VERIFICAR AUTENTICAÇÃO
    // ==========================================

    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    // ==========================================
    // CONSULTAR O FASTAPI
    // ==========================================

    const resposta = await apiRequest("/api/alunos", {
        method: "GET",
        token,
        signal,
    });

    // ==========================================
    // VALIDAR O FORMATO DA LISTA
    // ==========================================

    if (!Array.isArray(resposta)) {
        throw new ApiError("A API retornou uma lista de alunos inválida.");
    }

    return resposta;
}

// ============================================
// CONSULTAR ALUNO POR ID
// ============================================

export async function consultarAluno({ alunoId, token, signal }) {
    // ==========================================
    // VALIDAR O IDENTIFICADOR
    // ==========================================

    const id = Number(alunoId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Informe um ID de aluno válido.");
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

    const resposta = await apiRequest(`/api/alunos/${id}`, {
        method: "GET",
        token,
        signal,
    });

    // ==========================================
    // VALIDAR O FORMATO DA RESPOSTA
    // ==========================================

    if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) {
        throw new ApiError("A API retornou dados inválidos para o aluno.");
    }

    return resposta;
}
