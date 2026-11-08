import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ROTA DO BACKEND
// ============================================

const ROTA_ALUNOS = "/api/alunos";

// ============================================
// CONSTRUIR REQUEST BODY
//
// IMPORTANTE:
// Confirme as propriedades no Swagger.
// ============================================

function montarDadosAluno({ nome, codigoAluno, turmaId, ativo }) {
    const dados = {
        nome,
        codigo_aluno: codigoAluno,
        turma_id: turmaId,
        ativo,
    };

    return dados;
}

// ============================================
// CADASTRAR ALUNO
// ============================================

export async function criarAluno({
    nome,
    codigoAluno,
    turmaId,
    ativo = true,
    token,
}) {
    // ==========================================
    // VALIDAR AUTENTICAÇÃO
    // ==========================================

    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    // ==========================================
    // LIMPAR DADOS
    // ==========================================

    const nomeLimpo = String(nome ?? "").trim();

    const codigoLimpo = String(codigoAluno ?? "").trim();

    // ==========================================
    // VALIDAR CAMPOS
    // ==========================================

    if (!nomeLimpo) {
        throw new Error("Informe o nome do aluno.");
    }

    if (!codigoLimpo) {
        throw new Error("Informe o código do aluno.");
    }

    // ==========================================
    // VALIDAR TURMA
    // ==========================================

    const idTurma = Number(turmaId);

    if (
        String(turmaId ?? "").trim() === "" ||
        !Number.isSafeInteger(idTurma) ||
        idTurma <= 0
    ) {
        throw new Error("Selecione uma turma válida.");
    }

    // ==========================================
    // VALIDAR SITUAÇÃO
    // ==========================================

    if (typeof ativo !== "boolean") {
        throw new Error("A situação do aluno é inválida.");
    }

    // ==========================================
    // CONSTRUIR CORPO DA REQUISIÇÃO
    // ==========================================

    const dadosAluno = montarDadosAluno({
        nome: nomeLimpo,
        codigoAluno: codigoLimpo,
        turmaId: idTurma,
        ativo,
    });

    // ==========================================
    // ENVIAR POST
    // ==========================================

    return apiRequest(ROTA_ALUNOS, {
        method: "POST",
        token,
        body: dadosAluno,
    });
}
