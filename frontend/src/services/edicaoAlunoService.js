import { apiRequest, ApiError } from "./apiClient";

// ============================================
// CONFIGURAÇÃO DO BACKEND
// ============================================

const ROTA_ALUNOS = "/api/alunos";

// ATENÇÃO:
// Se o Swagger mostrar PATCH, troque
// "PUT" por "PATCH" nesta constante.

const METODO_ATUALIZACAO = "PUT";

// ============================================
// VALIDAÇÃO DE IDENTIFICADORES
// ============================================

function validarId(valor, descricao) {
    if (valor === "" || valor === null || valor === undefined) {
        throw new Error(`Selecione ${descricao}.`);
    }

    const id = Number(valor);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error(`O identificador de ${descricao} é inválido.`);
    }

    return id;
}

// ============================================
// VALIDAÇÃO DE AUTENTICAÇÃO
// ============================================

function validarToken(token) {
    if (!token) {
        throw new ApiError("Você precisa estar autenticado.", 401);
    }
}

// ============================================
// CONSULTAR ALUNO PARA EDIÇÃO
// ============================================

export async function buscarAlunoParaEdicao({ alunoId, token, signal }) {
    const id = validarId(alunoId, "um aluno");

    validarToken(token);

    const resposta = await apiRequest(`${ROTA_ALUNOS}/${id}`, {
        method: "GET",
        token,
        signal,
    });

    if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) {
        throw new ApiError("A API retornou dados inválidos para o aluno.");
    }

    if (String(resposta.id) !== String(id)) {
        throw new ApiError("A API retornou um aluno diferente do selecionado.");
    }

    return resposta;
}

// ============================================
// CONSTRUIR CORPO DA ATUALIZAÇÃO
//
// ADAPTE AO SCHEMA REAL DO SWAGGER.
// ============================================

function montarDadosAtualizados({ nome, codigoAluno, turmaId, ativo }) {
    return {
        nome,
        codigo_aluno: codigoAluno,
        turma_id: turmaId,
        ativo,
    };
}

// ============================================
// ATUALIZAR ALUNO
// ============================================

export async function atualizarAluno({
    alunoId,
    nome,
    codigoAluno,
    turmaId,
    ativo,
    token,
}) {
    // ==========================================
    // IDENTIFICADORES E AUTENTICAÇÃO
    // ==========================================

    const id = validarId(alunoId, "um aluno");

    const idTurma = validarId(turmaId, "uma turma");

    validarToken(token);

    // ==========================================
    // CAMPOS DE TEXTO
    // ==========================================

    const nomeLimpo = String(nome ?? "").trim();

    const codigoLimpo = String(codigoAluno ?? "").trim();

    if (!nomeLimpo) {
        throw new Error("Informe o nome completo do aluno.");
    }

    if (!codigoLimpo) {
        throw new Error("Informe o código do aluno.");
    }

    // Não aplicamos limites arbitrários aqui.
    // Consulte maxLength no schema do FastAPI.

    // ==========================================
    // SITUAÇÃO
    // ==========================================

    if (typeof ativo !== "boolean") {
        throw new Error("A situação do aluno deve ser válida.");
    }

    // ==========================================
    // REQUEST BODY
    // ==========================================

    const dadosAtualizados = montarDadosAtualizados({
        nome: nomeLimpo,
        codigoAluno: codigoLimpo,
        turmaId: idTurma,
        ativo,
    });

    // ==========================================
    // ENVIAR PUT OU PATCH
    // ==========================================

    return apiRequest(`${ROTA_ALUNOS}/${id}`, {
        method: METODO_ATUALIZACAO,
        token,
        body: dadosAtualizados,
    });
}
