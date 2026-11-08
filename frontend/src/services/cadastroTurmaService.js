import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ROTA DO BACKEND
// ============================================

const ROTA_TURMAS = "/api/turmas";

// ============================================
// TURNOS UTILIZADOS NO FORMULÁRIO
// Confirme os códigos no Swagger.
// ============================================


const TURNOS = ["Manhã", "Tarde", "Noite", "Integral"];


// ============================================
// CRIAR TURMA
// ============================================

export async function criarTurma({
    escolaId,
    nome,
    serie,
    turno,
    anoLetivo,
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
    // VALIDAR ESCOLA
    // ==========================================

    const idEscola = Number(escolaId);

    if (!Number.isSafeInteger(idEscola) || idEscola <= 0) {
        throw new Error("Selecione uma escola válida.");
    }

    // ==========================================
    // VALIDAR CAMPOS DE TEXTO
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

    if (!TURNOS.includes(turno)) {
        throw new Error("Selecione um turno válido.");
    }

    // ==========================================
    // VALIDAR ANO LETIVO
    // ==========================================

    const ano = Number(anoLetivo);

    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
        throw new Error("Informe um ano letivo válido.");
    }

    // ==========================================
    // VALIDAR SITUAÇÃO
    // ==========================================

    if (typeof ativo !== "boolean") {
        throw new Error("A situação da turma é inválida.");
    }

    // ==========================================
    // CONSTRUIR O CORPO DA REQUISIÇÃO
    //
    // AJUSTAR AO SCHEMA REAL DO SWAGGER.
    // ==========================================

    const dadosTurma = {
        escola_id: idEscola,
        nome: nomeLimpo,
        serie: serieLimpa,
        turno,
        ano_letivo: ano,
        ativo,
    };

    // ==========================================
    // ENVIAR POST
    // ==========================================

    return apiRequest(ROTA_TURMAS, {
        method: "POST",
        token,
        body: dadosTurma,
    });
}
