import { apiRequest, ApiError } from "./apiClient";

// ============================================
// CONFIGURAÇÃO DO BACKEND
// ============================================

const ROTA_TURMAS = "/api/turmas";

// CONFIRME NO SWAGGER:
// Se a atualização usar PATCH,
// substitua "PUT" por "PATCH".

const METODO_ATUALIZACAO = "PUT";

// Valores confirmados no backend.
const TURNOS_VALIDOS = ["Manhã", "Tarde", "Noite", "Integral"];

// ============================================
// VALIDAR ID
// ============================================

function validarId(idRecebido, descricao) {
    const id = Number(idRecebido);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error(`Selecione ${descricao} válida.`);
    }

    return id;
}

// ============================================
// VALIDAR TOKEN
// ============================================

function validarToken(token) {
    if (!token) {
        throw new ApiError("Você precisa estar autenticado.", 401);
    }
}

// ============================================
// CONSULTAR TURMA PARA EDIÇÃO
// ============================================

export async function buscarTurmaParaEdicao({ turmaId, token, signal }) {
    const id = validarId(turmaId, "uma turma");

    validarToken(token);

    const resposta = await apiRequest(`${ROTA_TURMAS}/${id}`, {
        method: "GET",
        token,
        signal,
    });

    if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) {
        throw new ApiError("O backend retornou dados inválidos para a turma.");
    }

    return resposta;
}

// ============================================
// ATUALIZAR TURMA
// ============================================

export async function atualizarTurma({
    turmaId,
    escolaId,
    nome,
    serie,
    turno,
    anoLetivo,
    ativo,
    token,
}) {
    const id = validarId(turmaId, "uma turma");

    const idEscola = validarId(escolaId, "uma escola");

    validarToken(token);

    // ==========================================
    // VALIDAR NOME E SÉRIE
    // ==========================================

    const nomeLimpo = String(nome ?? "").trim();
    const serieLimpa = String(serie ?? "").trim();


    if (nomeLimpo.length > 20) {
    throw new Error("O nome da turma deve ter no máximo 20 caracteres.");
    }


    if (!nomeLimpo) {
        throw new Error("Informe o nome da turma.");
    }

    if (!serieLimpa) {
        throw new Error("Informe a série da turma.");
    }

    // ==========================================
    // VALIDAR TURNO
    // ==========================================

    if (!TURNOS_VALIDOS.includes(turno)) {
        throw new Error("Selecione um turno válido.");
    }

    // ==========================================
    // VALIDAR ANO LETIVO
    // ==========================================

    const ano = Number(anoLetivo);

    if (
        String(anoLetivo).trim() === "" ||
        !Number.isInteger(ano) ||
        ano < 2000 ||
        ano > 2100
    ) {
        throw new Error("Informe um ano letivo válido.");
    }

    // ==========================================
    // VALIDAR SITUAÇÃO
    // ==========================================

    if (typeof ativo !== "boolean") {
        throw new Error("A situação da turma deve ser válida.");
    }

    // ==========================================
    // REQUEST BODY
    //
    // Confira os campos no Swagger antes
    // de enviar a primeira atualização.
    // ==========================================

    const dadosAtualizados = {
        escola_id: idEscola,
        nome: nomeLimpo,
        serie: serieLimpa,
        turno,
        ano_letivo: ano,
        ativo,
    };

    // ==========================================
    // ENVIAR PUT OU PATCH
    // ==========================================

    return apiRequest(`${ROTA_TURMAS}/${id}`, {
        method: METODO_ATUALIZACAO,
        token,
        body: dadosAtualizados,
    });
}
