import { apiRequest, ApiError } from "./apiClient";

// ============================================
// LISTAR ESCOLAS
// ============================================

export async function listarEscolas({ token, signal }) {
    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    const resposta = await apiRequest("/api/escolas", {
        method: "GET",
        token,
        signal,
    });

    if (!Array.isArray(resposta)) {
        throw new ApiError("A API retornou uma lista de escolas inválida.");
    }

    return resposta;
}

// ============================================
// CONSULTAR ESCOLA PELO ID
// ============================================

export async function consultarEscola({ escolaId, token, signal }) {
    const id = Number(escolaId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Informe um ID de escola válido.");
    }

    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    const resposta = await apiRequest(`/api/escolas/${id}`, {
        method: "GET",
        token,
        signal,
    });

    if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) {
        throw new ApiError("A API retornou dados inválidos para a escola.");
    }

    return resposta;
}
