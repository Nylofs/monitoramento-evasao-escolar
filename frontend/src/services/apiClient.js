import { criarUrlApi } from "../config/api";

// ============================================
// CLASSE DE ERRO DAS REQUISIÇÕES
// ============================================

export class ApiError extends Error {
    constructor(mensagem, status = null, detalhes = null) {
        super(mensagem);

        this.name = "ApiError";
        this.status = status;
        this.detalhes = detalhes;
    }
}

// ============================================
// FUNÇÃO AUXILIAR PARA PARÂMETROS
// ============================================

function adicionarParametros(url, params) {
    const endereco = new URL(url);

    for (const [chave, valor] of Object.entries(params)) {
        if (valor !== undefined && valor !== null && valor !== "") {
            endereco.searchParams.set(chave, String(valor));
        }
    }

    return endereco.toString();
}

// ============================================
// CLIENTE HTTP REUTILIZÁVEL
// ============================================

export async function apiRequest(
    caminho,
    {
        method = "GET",
        body = undefined,
        params = {},
        token = null,
        signal = undefined,
    } = {},
) {
    const url = adicionarParametros(criarUrlApi(caminho), params);

    const headers = {
        Accept: "application/json",
    };

    // O token será utilizado futuramente
    // nos endpoints protegidos pelo JWT.
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // Só enviar Content-Type quando
    // houver um corpo JSON.
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    let resposta;

    try {
        resposta = await fetch(url, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal,
        });
    } catch (erro) {
        // Cancelamentos não são falhas da API.
        if (erro.name === "AbortError") {
            throw erro;
        }

        throw new ApiError("Não foi possível conectar ao servidor FastAPI.");
    }

    // Respostas sem conteúdo, como HTTP 204.
    if (resposta.status === 204) {
        return null;
    }

    const tipoConteudo = resposta.headers.get("content-type") || "";

    let dados = null;

    try {
        if (tipoConteudo.includes("application/json")) {
            dados = await resposta.json();
        } else {
            dados = await resposta.text();
        }
    } catch {
        throw new ApiError(
            "O servidor retornou uma resposta inválida.",
            resposta.status,
        );
    }

    // O fetch não lança erro automaticamente
    // para respostas HTTP 400, 401, 404, 500...
    if (!resposta.ok) {
        let mensagem = `Erro HTTP ${resposta.status}.`;

        if (
            dados &&
            typeof dados === "object" &&
            typeof dados.detail === "string"
        ) {
            mensagem = dados.detail;
        }

        throw new ApiError(mensagem, resposta.status, dados);
    }

    return dados;
}
