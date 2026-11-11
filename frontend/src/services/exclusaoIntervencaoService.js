import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ETAPA 15 - PARTE 30
// SERVICE DE EXCLUSÃO DE INTERVENÇÕES
// ============================================

// Confira a rota no Swagger.
const ROTA_INTERVENCOES = "/api/intervencoes";

// ============================================
// VALIDAR IDENTIFICADOR
// ============================================

function validarIntervencaoId(valor) {
    if (valor === "" || valor === null || valor === undefined) {
        throw new Error("Selecione uma intervenção.");
    }

    const id = Number(valor);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("O identificador da intervenção é inválido.");
    }

    return id;
}

// ============================================
// EXCLUIR INTERVENÇÃO
// ============================================

export async function excluirIntervencao({ intervencaoId, token }) {
    // ==========================================
    // VALIDAR AUTENTICAÇÃO
    // ==========================================

    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    // ==========================================
    // VALIDAR ID
    // ==========================================

    const id = validarIntervencaoId(intervencaoId);

    // ==========================================
    // ENVIAR DELETE
    // ==========================================

    return apiRequest(`${ROTA_INTERVENCOES}/${id}`, {
        method: "DELETE",
        token,
    });
}
