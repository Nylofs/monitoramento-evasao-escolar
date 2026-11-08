import { useEffect, useState } from "react";

import SeletorAluno from "../components/SeletorAluno";
import SeletorTurma from "../components/SeletorTurma";

import {
    consultarAlertaAluno,
    consultarAlertasTurma,
} from "../services/alertaService";

// ==========================================
// NÍVEIS DO BACKEND
// ==========================================

const NIVEIS = {
    SEM_DADOS: "Sem dados",
    DADOS_INSUFICIENTES: "Dados insuficientes",
    REGULAR: "Regular",
    ATENCAO: "Atenção",
    PRIORITARIO: "Prioritário",
};

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function primeiroValor(objeto, campos) {
    if (!objeto || typeof objeto !== "object") {
        return undefined;
    }

    for (const campo of campos) {
        const valor = objeto[campo];

        if (valor !== null && valor !== undefined) {
            return valor;
        }
    }

    return undefined;
}

function textoOuTraco(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "Não informado";
    }

    return String(valor);
}

// ==========================================
// EXTRAIR NÍVEL
// ==========================================

function extrairNivel(registro) {
    const alerta = registro?.alerta;

    const valor =
        primeiroValor(registro, [
            "nivel",
            "nivel_alerta",
            "classificacao",
            "situacao_alerta",
        ]) ?? primeiroValor(alerta, ["nivel", "nivel_alerta", "classificacao"]);

    const codigo = String(valor ?? "")
        .trim()
        .toUpperCase();

    return Object.hasOwn(NIVEIS, codigo) ? codigo : null;
}

function formatarNivel(nivel) {
    return nivel ? NIVEIS[nivel] : "Não informado";
}

// ==========================================
// IDENTIFICAÇÃO
// ==========================================

function obterNome(registro) {
    return textoOuTraco(
        primeiroValor(registro, ["nome_aluno", "nome", "aluno_nome"]) ??
            registro?.aluno?.nome,
    );
}

function obterId(registro) {
    return (
        primeiroValor(registro, ["aluno_id", "id_aluno"]) ?? registro?.aluno?.id
    );
}

// ==========================================
// MOTIVOS
// ==========================================

function obterMotivos(registro) {
    const origem = registro?.alerta || registro;

    const valor = primeiroValor(origem, [
        "motivos",
        "justificativas",
        "motivo",
        "mensagem",
        "descricao",
    ]);

    if (Array.isArray(valor)) {
        return valor.map(String);
    }

    if (typeof valor === "string" && valor.trim()) {
        return [valor];
    }

    return [];
}

// ==========================================
// LISTA DE CLASSIFICAÇÕES DA TURMA
// ==========================================

function obterListaTurma(dados) {
    if (Array.isArray(dados)) {
        return dados;
    }

    const campos = ["alunos", "alertas", "resultados", "classificacoes"];

    for (const campo of campos) {
        if (Array.isArray(dados?.[campo])) {
            return dados[campo];
        }
    }

    return null;
}

// ==========================================
// FORMATAR PERCENTUAL
// ==========================================

function formatarPercentual(valor) {
    if (valor === null || valor === undefined) {
        return "Sem registros";
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "Não informado";
    }

    return (
        numero.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + "%"
    );
}

// ==========================================
// ERROS HTTP
// ==========================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return "Sessão rejeitada ou expirada. Faça login novamente.";
    }

    if (erro.status === 403) {
        return "Você não tem permissão para esta consulta.";
    }

    if (erro.status === 404) {
        return "Aluno ou turma não encontrado ou sem acesso.";
    }

    if (erro.status === 400) {
        return erro.message || "Período inválido.";
    }

    if (erro.status === 422) {
        return "Os parâmetros da consulta são inválidos.";
    }

    return erro.message || "Falha ao consultar alertas.";
}

// ==========================================
// SELO DO NÍVEL
// ==========================================

function SeloNivel({ nivel }) {
    return (
        <span
            className={`alertas-selo alertas-selo--${nivel || "DESCONHECIDO"}`}
        >
            {formatarNivel(nivel)}
        </span>
    );
}

// ==========================================
// MOTIVOS DA CLASSIFICAÇÃO
// ==========================================

function PainelMotivos({ registro }) {
    const motivos = obterMotivos(registro);

    if (motivos.length === 0) {
        return (
            <p className="alertas-nota">
                Nenhuma descrição de motivo foi identificada nos campos
                reconhecidos da resposta.
            </p>
        );
    }

    return (
        <section className="alertas-motivos">
            <h4>Informações da classificação</h4>

            <ul>
                {motivos.map((motivo, indice) => (
                    <li key={indice}>{motivo}</li>
                ))}
            </ul>
        </section>
    );
}

// ==========================================
// JSON TÉCNICO
// SOMENTE NO AMBIENTE DE DESENVOLVIMENTO
// ==========================================

function RespostaTecnica({ dados }) {
    if (!import.meta.env.DEV) {
        return null;
    }

    return (
        <details className="alertas-json">
            <summary>Visualizar resposta JSON da API</summary>
            <pre>{JSON.stringify(dados, null, 2)}</pre>
        </details>
    );
}

// ==========================================
// RESULTADO INDIVIDUAL
// ==========================================

function ResultadoAluno({ dados, idConsultado }) {
    const nivel = extrairNivel(dados);

    const percentual =
        primeiroValor(dados, [
            "percentual_presenca",
            "percentual_frequencia",
        ]) ??
        primeiroValor(dados?.indicador?.percentuais, ["percentual_presenca"]);

    const totalRegistros =
        primeiroValor(dados, ["total_registros"]) ??
        primeiroValor(dados?.indicador?.resumo, ["total_registros"]);

    return (
        <div className="alertas-resultados">
            <section className="alertas-painel">
                <div className="alertas-resultado-topo">
                    <div>
                        <span className="alertas-subtitulo">
                            ALERTA INDIVIDUAL
                        </span>

                        <h3>{obterNome(dados)}</h3>

                        <p>
                            Aluno ID:{" "}
                            {textoOuTraco(obterId(dados) ?? idConsultado)}
                        </p>
                    </div>

                    <SeloNivel nivel={nivel} />
                </div>

                <div className="alertas-resumo-individual">
                    <div>
                        <span>Classificação</span>
                        <strong>{formatarNivel(nivel)}</strong>
                    </div>

                    <div>
                        <span>Registros de frequência</span>
                        <strong>{textoOuTraco(totalRegistros)}</strong>
                    </div>

                    <div>
                        <span>Percentual de presença</span>
                        <strong>
                            {percentual === undefined
                                ? "Não informado"
                                : formatarPercentual(percentual)}
                        </strong>
                    </div>
                </div>

                <PainelMotivos registro={dados} />

                <p className="alertas-nota">
                    O alerta foi calculado pelo FastAPI. A classificação orienta
                    o acompanhamento escolar e não representa uma previsão
                    definitiva de evasão.
                </p>
            </section>

            <RespostaTecnica dados={dados} />
        </div>
    );
}

// ==========================================
// RESULTADO DA TURMA
// ==========================================

function ResultadoTurma({ dados, idConsultado }) {
    const alunos = obterListaTurma(dados);

    const totais = {};

    if (alunos) {
        for (const nivel of Object.keys(NIVEIS)) {
            totais[nivel] = alunos.filter(
                (registro) => extrairNivel(registro) === nivel,
            ).length;
        }
    }

    const titulo = primeiroValor(dados, ["nome_turma", "turma_nome"]);

    return (
        <div className="alertas-resultados">
            <section className="alertas-painel">
                <span className="alertas-subtitulo">ALERTAS DA TURMA</span>

                <h3>{titulo || `Turma ID ${idConsultado}`}</h3>

                <p className="alertas-nota">
                    As classificações abaixo foram devolvidas pelo backend.
                </p>

                {alunos === null ? (
                    <p className="alertas-mensagem">
                        A resposta não contém uma lista de alunos em um dos
                        campos reconhecidos. Confira o schema real da API.
                    </p>
                ) : (
                    <>
                        <section className="alertas-resumo-turma">
                            {Object.entries(NIVEIS).map(
                                ([codigo, tituloNivel]) => (
                                    <article
                                        key={codigo}
                                        className="alertas-resumo-cartao"
                                    >
                                        <SeloNivel nivel={codigo} />

                                        <strong>{totais[codigo]}</strong>

                                        <small>{tituloNivel}</small>
                                    </article>
                                ),
                            )}
                        </section>

                        <p className="alertas-nota">
                            {alunos.length} classificação(ões) retornada(s) pela
                            API.
                        </p>

                        {alunos.length === 0 ? (
                            <p className="alertas-mensagem">
                                Nenhuma classificação individual foi retornada
                                para esta turma.
                            </p>
                        ) : (
                            <div className="alertas-tabela-container">
                                <table className="alertas-tabela">
                                    <thead>
                                        <tr>
                                            <th>Aluno</th>
                                            <th>ID</th>
                                            <th>Nível</th>
                                            <th>Informações</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {alunos.map((registro, indice) => {
                                            const nivel =
                                                extrairNivel(registro);
                                            const motivos =
                                                obterMotivos(registro);

                                            return (
                                                <tr
                                                    key={`${obterId(registro) ?? "item"}-${indice}`}
                                                >
                                                    <td>
                                                        <strong>
                                                            {obterNome(
                                                                registro,
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        {textoOuTraco(
                                                            obterId(registro),
                                                        )}
                                                    </td>

                                                    <td>
                                                        <SeloNivel
                                                            nivel={nivel}
                                                        />
                                                    </td>

                                                    <td>
                                                        {motivos.length > 0
                                                            ? motivos.join("; ")
                                                            : "Sem motivo informado"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </section>

            <RespostaTecnica dados={dados} />
        </div>
    );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

function Alertas({ token }) {
    // ========================================
    // ESTADOS DO FORMULÁRIO
    // ========================================

    const [tipo, setTipo] = useState("aluno");
    const [identificador, setIdentificador] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");

    // ========================================
    // CONSULTA E RESULTADO
    // ========================================

    const [consulta, setConsulta] = useState(null);
    const [resultado, setResultado] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");

    // ========================================
    // MUDAR TIPO DE CONSULTA
    // ========================================

    function mudarTipo(novoTipo) {
        setTipo(novoTipo);
        setIdentificador("");
        setConsulta(null);
        setResultado(null);
        setErro("");
    }

    // ========================================
    // SELECIONAR ALUNO OU TURMA
    // ========================================

    function alterarIdentificador(novoId) {
        setIdentificador(novoId);
        setConsulta(null);
        setResultado(null);
        setErro("");
    }

    // ========================================
    // ENVIAR FORMULÁRIO
    // ========================================

    function enviarConsulta(evento) {
        evento.preventDefault();

        const id = Number(identificador);

        if (!identificador || !Number.isSafeInteger(id) || id <= 0) {
            setConsulta(null);
            setResultado(null);
            setErro("Selecione um aluno ou uma turma válida.");
            return;
        }

        if (dataInicio && dataFim && dataInicio > dataFim) {
            setConsulta(null);
            setResultado(null);
            setErro("A data inicial não pode ser posterior à final.");
            return;
        }

        setErro("");

        setConsulta({
            tipo,
            id,
            dataInicio,
            dataFim,
        });
    }

    // ========================================
    // CONSULTAR O FASTAPI
    // ========================================

    useEffect(() => {
        if (!consulta) {
            return;
        }

        const controller = new AbortController();
        let ativo = true;

        async function carregarAlertas() {
            setCarregando(true);
            setResultado(null);
            setErro("");

            try {
                let dados;

                if (consulta.tipo === "aluno") {
                    dados = await consultarAlertaAluno({
                        alunoId: consulta.id,
                        dataInicio: consulta.dataInicio,
                        dataFim: consulta.dataFim,
                        token,
                        signal: controller.signal,
                    });
                } else {
                    dados = await consultarAlertasTurma({
                        turmaId: consulta.id,
                        dataInicio: consulta.dataInicio,
                        dataFim: consulta.dataFim,
                        token,
                        signal: controller.signal,
                    });
                }

                if (ativo) {
                    setResultado({
                        tipo: consulta.tipo,
                        id: consulta.id,
                        dados,
                    });
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarAlertas();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [consulta, token]);

    // ========================================
    // LIMPAR FORMULÁRIO
    // ========================================

    function limparConsulta() {
        setIdentificador("");
        setDataInicio("");
        setDataFim("");
        setConsulta(null);
        setResultado(null);
        setErro("");
    }

    // ========================================
    // INTERFACE
    // ========================================

    return (
        <div className="alertas-pagina">
            <section className="alertas-introducao">
                <h2>Alertas escolares</h2>

                <p>
                    Consulte as classificações de acompanhamento calculadas pelo
                    FastAPI para um aluno ou turma.
                </p>
            </section>

            <section className="alertas-filtros">
                <h3>Tipo de consulta</h3>

                <div
                    className="alertas-tipos"
                    role="group"
                    aria-label="Tipo de alerta"
                >
                    <button
                        type="button"
                        aria-pressed={tipo === "aluno"}
                        className={
                            tipo === "aluno"
                                ? "alertas-tipo alertas-tipo--ativo"
                                : "alertas-tipo"
                        }
                        onClick={() => mudarTipo("aluno")}
                    >
                        Por aluno
                    </button>

                    <button
                        type="button"
                        aria-pressed={tipo === "turma"}
                        className={
                            tipo === "turma"
                                ? "alertas-tipo alertas-tipo--ativo"
                                : "alertas-tipo"
                        }
                        onClick={() => mudarTipo("turma")}
                    >
                        Por turma
                    </button>
                </div>

                <form onSubmit={enviarConsulta}>
                    <div className="alertas-campos">
                        {tipo === "aluno" ? (
                            <SeletorAluno
                                token={token}
                                valor={identificador}
                                onChange={alterarIdentificador}
                                disabled={carregando}
                            />
                        ) : (
                            <SeletorTurma
                                token={token}
                                valor={identificador}
                                onChange={alterarIdentificador}
                                disabled={carregando}
                            />
                        )}

                        <div className="alertas-campo">
                            <label htmlFor="alerta-inicio">Data inicial</label>

                            <input
                                id="alerta-inicio"
                                type="date"
                                value={dataInicio}
                                onChange={(evento) => {
                                    setDataInicio(evento.target.value);
                                    setConsulta(null);
                                    setResultado(null);
                                }}
                            />
                        </div>

                        <div className="alertas-campo">
                            <label htmlFor="alerta-fim">Data final</label>

                            <input
                                id="alerta-fim"
                                type="date"
                                value={dataFim}
                                onChange={(evento) => {
                                    setDataFim(evento.target.value);
                                    setConsulta(null);
                                    setResultado(null);
                                }}
                            />
                        </div>
                    </div>

                    <div className="alertas-acoes">
                        <button
                            type="submit"
                            className="alertas-botao-primario"
                            disabled={carregando}
                        >
                            {carregando
                                ? "Consultando..."
                                : "Consultar alertas"}
                        </button>

                        <button
                            type="button"
                            className="alertas-botao-secundario"
                            onClick={limparConsulta}
                        >
                            Limpar
                        </button>
                    </div>
                </form>

                <p className="alertas-nota">
                    Escolha um registro autorizado. Os filtros de período são
                    opcionais conforme o contrato dos endpoints.
                </p>
            </section>

            {carregando && (
                <p className="alertas-mensagem" role="status">
                    Consultando alertas no FastAPI...
                </p>
            )}

            {erro && (
                <p
                    className="alertas-mensagem alertas-mensagem--erro"
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {!consulta && !erro && (
                <p className="alertas-mensagem">
                    Selecione Aluno ou Turma, escolha o registro pelo nome e
                    clique em Consultar alertas.
                </p>
            )}

            {resultado &&
                !carregando &&
                (resultado.tipo === "aluno" ? (
                    <ResultadoAluno
                        dados={resultado.dados}
                        idConsultado={resultado.id}
                    />
                ) : (
                    <ResultadoTurma
                        dados={resultado.dados}
                        idConsultado={resultado.id}
                    />
                ))}
        </div>
    );
}

export default Alertas;
