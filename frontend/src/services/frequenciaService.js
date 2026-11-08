import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ENDPOINTS DO MÓDULO FREQUÊNCIAS
// Confirme os caminhos no Swagger.
// ============================================

const ROTAS = {
    listar: "/api/frequencias",
    detalhe: (id) => `/api/frequencias/${id}`,
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
// LISTAR FREQUÊNCIAS
// ============================================

export async function listarFrequencias({ token, signal }) {
    validarToken(token);

    const resposta = await apiRequest(ROTAS.listar, {
        method: "GET",
        token,
        signal,
    });

    if (!Array.isArray(resposta)) {
        throw new ApiError(
            "A API não retornou uma lista de frequências válida.",
        );
    }

    return resposta;
}

// ============================================
// CONSULTAR FREQUÊNCIA POR ID
// ============================================

export async function consultarFrequencia({ frequenciaId, token, signal }) {
    const id = Number(frequenciaId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Informe um ID de frequência válido.");
    }

    validarToken(token);

    const resposta = await apiRequest(ROTAS.detalhe(id), {
        method: "GET",
        token,
        signal,
    });

    if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) {
        throw new ApiError("A API retornou dados inválidos para a frequência.");
    }

    return resposta;
}
