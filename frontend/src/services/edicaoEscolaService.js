import { apiRequest, ApiError } from "./apiClient";

// ============================================
// CONFIGURAÇÃO DAS ROTAS
// ============================================

const ROTA_ESCOLAS = "/api/escolas";

// IMPORTANTE:
// Se o Swagger utilizar PATCH, troque
// "PUT" por "PATCH" na linha abaixo.

const METODO_ATUALIZACAO = "PUT";

// ============================================
// VALIDAR ID
// ============================================

function validarId(escolaId) {
    const id = Number(escolaId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Informe uma escola válida.");
    }

    return id;
}

// ============================================
// VALIDAR TOKEN
// ============================================

function validarToken(token) {
    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }
}

// ============================================
// CONSULTAR ESCOLA POR ID
// ============================================

export async function buscarEscolaParaEdicao({ escolaId, token, signal }) {
    const id = validarId(escolaId);
    validarToken(token);

    const resposta = await apiRequest(`${ROTA_ESCOLAS}/${id}`, {
        method: "GET",
        token,
        signal,
    });

    if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) {
        throw new ApiError("O backend retornou dados inválidos para a escola.");
    }

    return resposta;
}

// ============================================
// ATUALIZAR ESCOLA
// ============================================

export async function atualizarEscola({
    escolaId,
    nome,
    cidade,
    ativo,
    token,
}) {
    const id = validarId(escolaId);
    validarToken(token);

    const nomeLimpo = String(nome ?? "").trim();
    const cidadeLimpa = String(cidade ?? "").trim();

    // ==========================================
    // VALIDAÇÃO INICIAL
    // ==========================================

    if (!nomeLimpo) {
        throw new Error("Informe o nome da escola.");
    }

    if (!cidadeLimpa) {
        throw new Error("Informe a cidade da escola.");
    }

    if (typeof ativo !== "boolean") {
        throw new Error("A situação da escola deve ser válida.");
    }

    // ==========================================
    // REQUEST BODY
    // Ajuste ao schema real do Swagger.
    // ==========================================

    const dadosAtualizados = {
        nome: nomeLimpo,
        cidade: cidadeLimpa,
        ativo,
    };

    // ==========================================
    // ENVIAR ATUALIZAÇÃO
    // ==========================================

    return apiRequest(`${ROTA_ESCOLAS}/${id}`, {
        method: METODO_ATUALIZACAO,
        token,
        body: dadosAtualizados,
    });
}
