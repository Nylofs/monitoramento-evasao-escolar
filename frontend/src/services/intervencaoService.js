import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ROTAS DO BACKEND
// Confirme os caminhos no Swagger.
// ============================================

const ROTAS = {
    listar: "/api/intervencoes",
    detalhe: (id) => `/api/intervencoes/${id}`,
};

// ============================================
// VALIDAR TOKEN
// ============================================

function validarToken(token) {
    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }
}

// ============================================
// LISTAR INTERVENÇÕES
// ============================================

export async function listarIntervencoes({ token, signal }) {
    validarToken(token);

    const resposta = await apiRequest(ROTAS.listar, {
        method: "GET",
        token,
        signal,
    });

    if (!Array.isArray(resposta)) {
        throw new ApiError(
            "A API não retornou uma lista de intervenções. " +
                "Confira o formato da resposta no Swagger.",
        );
    }

    return resposta;
}

// ============================================
// CONSULTAR INTERVENÇÃO POR ID
// ============================================

export async function consultarIntervencao({ intervencaoId, token, signal }) {
    const id = Number(intervencaoId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Informe um ID de intervenção válido.");
    }

    validarToken(token);

    const resposta = await apiRequest(ROTAS.detalhe(id), {
        method: "GET",
        token,
        signal,
    });

    if (
        resposta === null ||
        typeof resposta !== "object" ||
        Array.isArray(resposta)
    ) {
        throw new ApiError(
            "A API retornou dados inválidos para a intervenção.",
        );
    }

    return resposta;
}
