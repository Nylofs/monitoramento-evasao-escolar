import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ROTA DO FASTAPI
// Confirmar no Swagger.
// ============================================

const ROTA_TURMAS = "/api/turmas";

// ============================================
// VALIDAR IDENTIFICADOR
// ============================================

function validarTurmaId(turmaId) {
    const id = Number(turmaId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Selecione uma turma válida.");
    }

    return id;
}

// ============================================
// EXCLUIR TURMA
// ============================================

export async function excluirTurma({ turmaId, token }) {
    // Validar ID antes de enviar a requisição.
    const id = validarTurmaId(turmaId);

    // Validar autenticação.
    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    // Solicitar exclusão ao FastAPI.
    return apiRequest(`${ROTA_TURMAS}/${id}`, {
        method: "DELETE",
        token,
    });
}
