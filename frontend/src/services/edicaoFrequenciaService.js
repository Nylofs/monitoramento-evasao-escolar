import { apiRequest, ApiError } from "./apiClient";

// ============================================
// CONFIGURAÇÕES DA API
// ============================================

const ROTA_FREQUENCIAS = "/api/frequencias";

// Confira no Swagger.
// Se o backend utilizar PATCH, altere aqui.
const METODO_ATUALIZACAO = "PUT";

// Confira os valores no schema do backend.
export const SITUACOES_EDICAO = [
    { valor: "PRESENTE", nome: "Presente" },
    { valor: "AUSENTE", nome: "Ausente" },
    { valor: "JUSTIFICADA", nome: "Justificada" },
];

// ============================================
// VALIDAÇÃO DOS IDENTIFICADORES
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
// VALIDAR AUTENTICAÇÃO
// ============================================

function validarToken(token) {
    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }
}

// ============================================
// VALIDAR DATA
// ============================================

function validarData(data) {
    const texto = String(data ?? "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        throw new Error("Informe uma data no formato AAAA-MM-DD.");
    }

    const [ano, mes, dia] = texto.split("-").map(Number);

    const verificada = new Date(Date.UTC(ano, mes - 1, dia));

    if (
        verificada.getUTCFullYear() !== ano ||
        verificada.getUTCMonth() + 1 !== mes ||
        verificada.getUTCDate() !== dia
    ) {
        throw new Error("A data informada não existe no calendário.");
    }

    return texto;
}

// ============================================
// NORMALIZAR RESPOSTAS DE LISTAGEM
// ============================================

function extrairLista(resposta) {
    if (Array.isArray(resposta)) {
        return resposta;
    }

    // Adapte caso seu GET use outra estrutura.
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
        "Formato da listagem incompatível com o frontend. " +
            "Confira a resposta GET no Network.",
    );
}

// ============================================
// LISTAR FREQUÊNCIAS
// ============================================

export async function listarFrequenciasParaEdicao({ token, signal }) {
    validarToken(token);

    const resposta = await apiRequest(ROTA_FREQUENCIAS, {
        method: "GET",
        token,
        signal,
    });

    return extrairLista(resposta);
}

// ============================================
// CONSULTAR UMA FREQUÊNCIA
// ============================================

export async function buscarFrequenciaParaEdicao({
    frequenciaId,
    token,
    signal,
}) {
    const id = validarId(frequenciaId, "uma frequência");

    validarToken(token);

    const resposta = await apiRequest(`${ROTA_FREQUENCIAS}/${id}`, {
        method: "GET",
        token,
        signal,
    });

    if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) {
        throw new Error("O backend retornou uma frequência inválida.");
    }

    if (String(resposta.id) !== String(id)) {
        throw new Error(
            "A API retornou um registro diferente " + "do selecionado.",
        );
    }

    return resposta;
}

// ============================================
// MONTAR DADOS PARA ATUALIZAÇÃO
//
// ADAPTE AO SCHEMA DO PUT/PATCH NO SWAGGER.
// ============================================

function montarDadosAtualizados({ alunoId, data, situacao, observacao }) {
    return {
        aluno_id: alunoId,
        data,
        situacao,
        observacao: observacao || null,
    };
}

// ============================================
// ATUALIZAR FREQUÊNCIA
// ============================================

export async function atualizarFrequencia({
    frequenciaId,
    alunoId,
    data,
    situacao,
    observacao = "",
    token,
}) {
    validarToken(token);

    const id = validarId(frequenciaId, "uma frequência");

    const idAluno = validarId(alunoId, "um aluno");

    const dataValida = validarData(data);

    const situacoesValidas = SITUACOES_EDICAO.map((item) => item.valor);

    if (!situacoesValidas.includes(situacao)) {
        throw new Error("Selecione uma situação de frequência válida.");
    }

    const textoObservacao = String(observacao ?? "").trim();

    // ==========================================
    // REQUEST BODY
    // ==========================================

    const dados = montarDadosAtualizados({
        alunoId: idAluno,
        data: dataValida,
        situacao,
        observacao: textoObservacao,
    });

    // ==========================================
    // ENVIAR ATUALIZAÇÃO
    // ==========================================

    return apiRequest(`${ROTA_FREQUENCIAS}/${id}`, {
        method: METODO_ATUALIZACAO,
        token,
        body: dados,
    });
}
