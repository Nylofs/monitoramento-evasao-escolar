import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ROTA DE FREQUÊNCIAS
// ============================================

const ROTA_FREQUENCIAS = "/api/frequencias";

// ============================================
// VALIDAR ID
// ============================================

function validarFrequenciaId(frequenciaId) {
    if (
        frequenciaId === "" ||
        frequenciaId === null ||
        frequenciaId === undefined
    ) {
        throw new Error("Selecione uma frequência.");
    }

    const id = Number(frequenciaId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("O identificador da frequência é inválido.");
    }

    return id;
}

// ============================================
// EXCLUIR FREQUÊNCIA
// ============================================

export async function excluirFrequencia({ frequenciaId, token }) {
    const id = validarFrequenciaId(frequenciaId);

    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    // O backend decide se a exclusão
    // é permitida e como será realizada.
    return apiRequest(`${ROTA_FREQUENCIAS}/${id}`, {
        method: "DELETE",
        token,
    });
}
