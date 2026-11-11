import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ETAPA 15 - PARTE 31
// SERVICE DE TRIAGEM DE ALERTAS
//
// CORREÇÃO:
// O backend consulta alertas por aluno.
// Não existe GET geral /api/alertas.
// ============================================

// ============================================
// ROTAS EXISTENTES
// ============================================

const ROTA_ALUNOS = "/api/alunos";

const ROTA_ALERTAS_POR_ALUNO = "/api/alertas/alunos";

// ============================================
// VALIDAR AUTENTICAÇÃO
// ============================================

function validarToken(token) {
    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }
}

// ============================================
// VALIDAR ID DO ALUNO
// ============================================

function validarAlunoId(alunoId) {
    if (alunoId === "" || alunoId === null || alunoId === undefined) {
        throw new Error("Selecione um aluno.");
    }

    const id = Number(alunoId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("O identificador do aluno é inválido.");
    }

    return id;
}

// ============================================
// NORMALIZAR LISTAGEM
// ============================================

function extrairLista(resposta) {
    if (Array.isArray(resposta)) {
        return resposta;
    }

    if (Array.isArray(resposta?.items)) {
        return resposta.items;
    }

    if (Array.isArray(resposta?.resultados)) {
        return resposta.resultados;
    }

    if (Array.isArray(resposta?.data)) {
        return resposta.data;
    }

    throw new Error(
        "A API retornou um formato inesperado " + "para a listagem de alunos.",
    );
}

// ============================================
// GET - LISTAR ALUNOS
//
// Retorna os estudantes disponíveis
// para o usuário autenticado.
// ============================================

export async function listarAlunosParaTriagem({ token, signal }) {
    validarToken(token);

    const resposta = await apiRequest(ROTA_ALUNOS, {
        method: "GET",
        token,
        signal,
    });

    const alunos = extrairLista(resposta);

    // Verifica a identificação necessária
    // para a consulta individual de alertas.

    return alunos.map((aluno, indice) => {
        if (!aluno || typeof aluno !== "object" || Array.isArray(aluno)) {
            throw new Error(`Aluno inválido na posição ${indice + 1}.`);
        }

        validarAlunoId(aluno.id);

        return aluno;
    });
}

// ============================================
// GET - CONSULTAR ALERTAS DE UM ALUNO
//
// Endpoint real do backend:
//
// GET /api/alertas/alunos/{aluno_id}
//
// Não presumimos formato de resposta:
// o painel apresenta o que o FastAPI retornar.
// ============================================

export async function consultarAlertasDoAluno({ alunoId, token, signal }) {
    validarToken(token);

    const id = validarAlunoId(alunoId);

    return apiRequest(`${ROTA_ALERTAS_POR_ALUNO}/${id}`, {
        method: "GET",
        token,
        signal,
    });
}
