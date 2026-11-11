import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ETAPA 15 - PARTE 28
// SERVICE DE CADASTRO DE INTERVENÇÕES
// ============================================

const ROTA_INTERVENCOES = "/api/intervencoes";

// ============================================
// ETAPAS PERMITIDAS PELO FASTAPI
// ============================================

export const ETAPAS_INTERVENCAO = [
    {
        valor: "CONVERSA_ALUNO",
        nome: "Conversa com o aluno",
    },
    {
        valor: "CONTATO_FAMILIA",
        nome: "Contato com a família",
    },
    {
        valor: "ENCAMINHAMENTO_INSTITUCIONAL",
        nome: "Encaminhamento institucional",
    },
];

// ============================================
// STATUS PERMITIDOS PELO FASTAPI
// ============================================

export const STATUS_INTERVENCAO = [
    {
        valor: "ABERTO",
        nome: "Aberto",
    },
    {
        valor: "EM_ANDAMENTO",
        nome: "Em andamento",
    },
    {
        valor: "CONCLUIDO",
        nome: "Concluído",
    },
];

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

function validarAlunoId(valor) {
    if (valor === "" || valor === null || valor === undefined) {
        throw new Error("Selecione um aluno.");
    }

    const id = Number(valor);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("O identificador do aluno é inválido.");
    }

    return id;
}

// ============================================
// VALIDAR VALORES DE ENUM
// ============================================

function validarOpcao(valor, opcoes, campo) {
    const existe = opcoes.some((opcao) => opcao.valor === valor);

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
// VALIDAR DATA ISO
// ============================================

function validarData(valor, campo) {
    const texto = String(valor ?? "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        throw new Error(`${campo}: informe uma data válida.`);
    }

    const [ano, mes, dia] = texto.split("-").map(Number);

    const verificada = new Date(Date.UTC(ano, mes - 1, dia));

    const dataExiste =
        verificada.getUTCFullYear() === ano &&
        verificada.getUTCMonth() + 1 === mes &&
        verificada.getUTCDate() === dia;

    if (!dataExiste) {
        throw new Error(`${campo}: a data não existe no calendário.`);
    }

    return texto;
}

// ============================================
// MONTAR REQUEST BODY
//
// CONTRATO CONFERIDO NO SWAGGER:
//
// etapa
// status
// data_intervencao
// descricao
// resultado
// responsavel
// proximo_contato
// aluno_id
//
// NÃO ENVIAMOS O CAMPO "tipo".
// ============================================

function montarDadosIntervencao({
    alunoId,
    etapa,
    status,
    dataIntervencao,
    descricao,
    resultado,
    responsavel,
    proximoContato,
}) {
    const dados = {
        aluno_id: alunoId,
        etapa,
        status,
        data_intervencao: dataIntervencao,
        descricao,
        responsavel,
    };

    // ==========================================
    // CAMPOS OPCIONAIS
    // ==========================================

    // Se o resultado foi informado, enviamos.
    if (resultado) {
        dados.resultado = resultado;
    }

    // Se há data de próximo contato, enviamos.
    if (proximoContato) {
        dados.proximo_contato = proximoContato;
    }

    return dados;
}

// ============================================
// CADASTRAR INTERVENÇÃO
// ============================================

export async function criarIntervencao({
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
    // ==========================================
    // 1. VALIDAR JWT
    // ==========================================

    validarToken(token);

    // ==========================================
    // 2. VALIDAR ALUNO
    // ==========================================

    const idAluno = validarAlunoId(alunoId);

    // ==========================================
    // 3. VALIDAR ETAPA
    // ==========================================

    const etapaValida = validarOpcao(etapa, ETAPAS_INTERVENCAO, "a etapa");

    // ==========================================
    // 4. VALIDAR STATUS
    // ==========================================

    const statusValido = validarOpcao(status, STATUS_INTERVENCAO, "o status");

    // ==========================================
    // 5. VALIDAR DATA DA INTERVENÇÃO
    // ==========================================

    const dataValida = validarData(dataIntervencao, "Data da intervenção");

    // ==========================================
    // 6. VALIDAR DESCRIÇÃO
    // ==========================================

    const descricaoValida = validarTexto(descricao, "Descrição", 1);

    // ==========================================
    // 7. VALIDAR RESPONSÁVEL
    //
    // Mínimo de 3 caracteres confirmado
    // pelo erro do Pydantic.
    // ==========================================

    const responsavelValido = validarTexto(responsavel, "Responsável", 3);

    // ==========================================
    // 8. PREPARAR RESULTADO OPCIONAL
    // ==========================================

    const resultadoLimpo = String(resultado ?? "").trim();

    // ==========================================
    // 9. VALIDAR PRÓXIMO CONTATO, SE INFORMADO
    // ==========================================

    const proximoContatoValido = proximoContato
        ? validarData(proximoContato, "Próximo contato")
        : "";

    // ==========================================
    // 10. MONTAR JSON
    // ==========================================

    const dadosIntervencao = montarDadosIntervencao({
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
    // 11. ENVIAR POST AO FASTAPI
    // ==========================================

    return apiRequest(ROTA_INTERVENCOES, {
        method: "POST",
        token,
        body: dadosIntervencao,
    });
}
