import { apiRequest, ApiError } from "./apiClient";

// ============================================
// CONFIGURAÇÃO DA API
// ============================================

const ROTA_FREQUENCIAS = "/api/frequencias";

// Confirme os valores no Swagger.
export const SITUACOES_FREQUENCIA = [
    { valor: "PRESENTE", nome: "Presente" },
    { valor: "AUSENTE", nome: "Ausente" },
    { valor: "JUSTIFICADA", nome: "Justificada" },
];

// ============================================
// VALIDAR ALUNO
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
// VALIDAR DATA ISO
// Formato esperado: AAAA-MM-DD
// ============================================

function validarData(data) {
    const texto = String(data ?? "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        throw new Error("Informe uma data válida no formato AAAA-MM-DD.");
    }

    const [ano, mes, dia] = texto.split("-").map(Number);

    const dataVerificada = new Date(Date.UTC(ano, mes - 1, dia));

    if (
        dataVerificada.getUTCFullYear() !== ano ||
        dataVerificada.getUTCMonth() + 1 !== mes ||
        dataVerificada.getUTCDate() !== dia
    ) {
        throw new Error("A data informada não existe no calendário.");
    }

    return texto;
}

// ============================================
// VALIDAR SITUAÇÃO
// ============================================

function validarSituacao(situacao) {
    const valoresPermitidos = SITUACOES_FREQUENCIA.map((item) => item.valor);

    if (!valoresPermitidos.includes(situacao)) {
        throw new Error("Selecione uma situação de frequência válida.");
    }

    return situacao;
}

// ============================================
// CONSTRUIR CORPO DA REQUISIÇÃO
//
// Ajuste esta função ao schema real
// do POST no Swagger.
// ============================================

function montarDadosFrequencia({ alunoId, data, situacao, observacao }) {
    const dados = {
        aluno_id: alunoId,
        data,
        situacao,
    };

    // Nesta versão, uma observação vazia
    // será omitida do JSON.
    // Confira se o backend aceita isso.
    const observacaoLimpa = String(observacao ?? "").trim();

    if (observacaoLimpa) {
        dados.observacao = observacaoLimpa;
    }

    return dados;
}

// ============================================
// CADASTRAR FREQUÊNCIA
// ============================================

export async function criarFrequencia({
    alunoId,
    data,
    situacao,
    observacao = "",
    token,
}) {
    // ==========================================
    // AUTENTICAÇÃO
    // ==========================================

    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }

    // ==========================================
    // VALIDAÇÕES INICIAIS
    // ==========================================

    const idAluno = validarAlunoId(alunoId);

    const dataValida = validarData(data);

    const situacaoValida = validarSituacao(situacao);

    // ==========================================
    // REQUEST BODY
    // ==========================================

    const dadosFrequencia = montarDadosFrequencia({
        alunoId: idAluno,
        data: dataValida,
        situacao: situacaoValida,
        observacao,
    });

    // ==========================================
    // REQUISIÇÃO POST
    // ==========================================

    return apiRequest(ROTA_FREQUENCIAS, {
        method: "POST",
        token,
        body: dadosFrequencia,
    });
}
