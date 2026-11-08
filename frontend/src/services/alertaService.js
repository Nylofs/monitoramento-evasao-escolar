import { apiRequest, ApiError } from "./apiClient";

// ============================================
// VALIDAR OS PARÂMETROS
// ============================================

function validarConsulta({ id, dataInicio, dataFim, token }) {
    const numeroId = Number(id);

    if (!Number.isSafeInteger(numeroId) || numeroId <= 0) {
        throw new Error("Informe um identificador válido.");
    }

    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    if (dataInicio && dataFim && dataInicio > dataFim) {
        throw new Error("A data inicial não pode ser posterior à final.");
    }

    return numeroId;
}

// ============================================
// CONSULTAR ALERTA INDIVIDUAL
// ============================================

export async function consultarAlertaAluno({
    alunoId,
    dataInicio = "",
    dataFim = "",
    token,
    signal,
}) {
    const id = validarConsulta({
        id: alunoId,
        dataInicio,
        dataFim,
        token,
    });

    const resposta = await apiRequest(`/api/alertas/alunos/${id}`, {
        method: "GET",
        token,
        signal,
        params: {
            data_inicio: dataInicio,
            data_fim: dataFim,
        },
    });

    if (
        resposta === null ||
        typeof resposta !== "object" ||
        Array.isArray(resposta)
    ) {
        throw new ApiError("O formato do alerta individual é inválido.");
    }

    return resposta;
}

// ============================================
// CONSULTAR ALERTAS DA TURMA
// ============================================

export async function consultarAlertasTurma({
    turmaId,
    dataInicio = "",
    dataFim = "",
    token,
    signal,
}) {
    const id = validarConsulta({
        id: turmaId,
        dataInicio,
        dataFim,
        token,
    });

    const resposta = await apiRequest(`/api/alertas/turmas/${id}`, {
        method: "GET",
        token,
        signal,
        params: {
            data_inicio: dataInicio,
            data_fim: dataFim,
        },
    });

    if (resposta === null || typeof resposta !== "object") {
        throw new ApiError("O formato da resposta da turma é inválido.");
    }

    // Aceitamos tanto um objeto de resumo
    // quanto uma lista, conforme o contrato
    // efetivo implementado no FastAPI.
    return resposta;
}
