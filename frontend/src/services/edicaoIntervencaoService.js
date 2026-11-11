import { apiRequest, ApiError } from "./apiClient";

import {
    ETAPAS_INTERVENCAO,
    STATUS_INTERVENCAO,
} from "./cadastroIntervencaoService";

// ============================================
// ETAPA 15 - PARTE 29
// EDIÇÃO DE INTERVENÇÕES
// ============================================

const ROTA_INTERVENCOES = "/api/intervencoes";

// CONFIRME NO SWAGGER:
// Altere para "PATCH" se essa for a rota.
const METODO_ATUALIZACAO = "PUT";

// ============================================
// VALIDAR AUTENTICAÇÃO
// ============================================

function validarToken(token) {
    if (!token) {
        throw new ApiError("É necessário estar autenticado.", 401);
    }
}

// ============================================
// VALIDAR ID
// ============================================

function validarId(valor, campo) {
    if (valor === "" || valor === null || valor === undefined) {
        throw new Error(`Informe ${campo}.`);
    }

    const id = Number(valor);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error(`Identificador inválido: ${campo}.`);
    }

    return id;
}

// ============================================
// VALIDAR ENUM
// ============================================

function validarOpcao(valor, opcoes, campo) {
    const existe = opcoes.some((item) => item.valor === valor);

    if (!existe) {
        throw new Error(`Selecione uma opção válida para ${campo}.`);
    }

    return valor;
}

// ============================================
// VALIDAR TEXTO
// ============================================

function validarTexto(valor, campo, minimo = 1) {
    const texto = String(valor ?? "").trim();

    if (texto.length < minimo) {
        throw new Error(
            `${campo} deve ter pelo menos ` + `${minimo} caractere(s).`,
        );
    }

    return texto;
}

// ============================================
// VALIDAR DATA
// ============================================

function validarData(valor, campo) {
    const texto = String(valor ?? "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        throw new Error(`${campo}: informe uma data válida.`);
    }

    const [ano, mes, dia] = texto.split("-").map(Number);

    const verificada = new Date(Date.UTC(ano, mes - 1, dia));

    const valida =
        verificada.getUTCFullYear() === ano &&
        verificada.getUTCMonth() + 1 === mes &&
        verificada.getUTCDate() === dia;

    if (!valida) {
        throw new Error(`${campo}: a data não existe no calendário.`);
    }

    return texto;
}

// ============================================
// NORMALIZAR RESPOSTA DE LISTAGEM
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

    throw new Error("Formato inesperado da listagem de intervenções.");
}

// ============================================
// GET - LISTAR INTERVENÇÕES
// ============================================

export async function listarIntervencoesParaEdicao({ token, signal }) {
    validarToken(token);

    const resposta = await apiRequest(ROTA_INTERVENCOES, {
        method: "GET",
        token,
        signal,
    });

    return extrairLista(resposta);
}

// ============================================
// GET - BUSCAR INTERVENÇÃO POR ID
// ============================================

export async function buscarIntervencaoParaEdicao({
    intervencaoId,
    token,
    signal,
}) {
    validarToken(token);

    const id = validarId(intervencaoId, "uma intervenção");

    const resposta = await apiRequest(`${ROTA_INTERVENCOES}/${id}`, {
        method: "GET",
        token,
        signal,
    });

    if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) {
        throw new Error("O FastAPI retornou um registro inválido.");
    }

    if (String(resposta.id) !== String(id)) {
        throw new Error(
            "A API retornou uma intervenção " + "diferente da selecionada.",
        );
    }

    return resposta;
}

// ============================================
// MONTAR BODY DE ATUALIZAÇÃO
//
// Baseado nos campos identificados no POST.
// Confirme o schema de IntervencaoUpdate.
//
// IMPORTANTE:
// resultado e proximo_contato serão enviados
// como null quando estiverem vazios.
//
// Isso só é válido se o schema de atualização
// aceitar null para esses campos.
// ============================================

function montarDadosAtualizados({
    alunoId,
    etapa,
    status,
    dataIntervencao,
    descricao,
    resultado,
    responsavel,
    proximoContato,
}) {
    return {
        aluno_id: alunoId,
        etapa,
        status,
        data_intervencao: dataIntervencao,
        descricao,
        resultado: resultado || null,
        responsavel,
        proximo_contato: proximoContato || null,
    };
}

// ============================================
// PUT/PATCH - ATUALIZAR INTERVENÇÃO
// ============================================

export async function atualizarIntervencao({
    intervencaoId,
    alunoId,
    etapa,
    status,
    dataIntervencao,
    descricao,
    resultado = "",
    responsavel,
    proximoContato = "",
    token,
}) {
    validarToken(token);

    // ==========================================
    // VALIDAR IDENTIFICADORES
    // ==========================================

    const idIntervencao = validarId(intervencaoId, "uma intervenção");

    const idAluno = validarId(alunoId, "um aluno");

    // ==========================================
    // VALIDAR ETAPA
    // ==========================================

    const etapaValida = validarOpcao(etapa, ETAPAS_INTERVENCAO, "etapa");

    // ==========================================
    // VALIDAR STATUS
    // ==========================================

    const statusValido = validarOpcao(status, STATUS_INTERVENCAO, "status");

    // ==========================================
    // VALIDAR DATA ORIGINAL
    // ==========================================

    const dataValida = validarData(dataIntervencao, "Data da intervenção");

    // ==========================================
    // VALIDAR DESCRIÇÃO
    // ==========================================

    const descricaoValida = validarTexto(descricao, "Descrição");

    // ==========================================
    // VALIDAR RESPONSÁVEL
    // ==========================================

    const responsavelValido = validarTexto(responsavel, "Responsável", 3);

    // ==========================================
    // TRATAR CAMPOS OPCIONAIS
    // ==========================================

    const resultadoLimpo = String(resultado ?? "").trim();

    const proximoContatoValido = proximoContato
        ? validarData(proximoContato, "Próximo contato")
        : "";

    // ==========================================
    // MONTAR CORPO DO PUT/PATCH
    // ==========================================

    const dados = montarDadosAtualizados({
        alunoId: idAluno,
        etapa: etapaValida,
        status: statusValido,
        dataIntervencao: dataValida,
        descricao: descricaoValida,
        resultado: resultadoLimpo,
        responsavel: responsavelValido,
        proximoContato: proximoContatoValido,
    });

    // ==========================================
    // ENVIAR ATUALIZAÇÃO
    // ==========================================

    return apiRequest(`${ROTA_INTERVENCOES}/${idIntervencao}`, {
        method: METODO_ATUALIZACAO,
        token,
        body: dados,
    });
}
