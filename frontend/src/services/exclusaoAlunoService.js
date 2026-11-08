import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ROTA DE ALUNOS
// Confirme o endereço no Swagger.
// ============================================

const ROTA_ALUNOS = "/api/alunos";

// ============================================
// VALIDAR ID DO ALUNO
// ============================================

function validarAlunoId(alunoId) {
    if (alunoId === "" || alunoId === null || alunoId === undefined) {
        throw new Error("Selecione um aluno.");
    }

    const id = Number(alunoId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("O ID do aluno é inválido.");
    }

    return id;
}

// ============================================
// EXCLUIR ALUNO
// ============================================

export async function excluirAluno({ alunoId, token }) {
    const id = validarAlunoId(alunoId);

    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    // A segurança e a integridade dos dados
    // serão verificadas pelo FastAPI.

    return apiRequest(`${ROTA_ALUNOS}/${id}`, {
        method: "DELETE",
        token,
    });
}
