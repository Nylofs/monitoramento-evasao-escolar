import { apiRequest, ApiError } from "./apiClient";

// ============================================
// VALIDAR OS PARÂMETROS DA CONSULTA
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
// CONSULTAR INDICADOR DE ALUNO
// ============================================

export async function consultarIndicadorAluno({
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

    return apiRequest(`/api/indicadores/alunos/${id}`, {
        method: "GET",
        token,
        signal,
        params: {
            data_inicio: dataInicio,
            data_fim: dataFim,
        },
    });
}

// ============================================
// CONSULTAR INDICADOR DE TURMA
// ============================================

export async function consultarIndicadorTurma({
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

    return apiRequest(`/api/indicadores/turmas/${id}`, {
        method: "GET",
        token,
        signal,
        params: {
            data_inicio: dataInicio,
            data_fim: dataFim,
        },
    });
}
