import { useEffect, useMemo, useState } from "react";

import {
    listarIntervencoes,
    consultarIntervencao,
} from "../services/intervencaoService";

import useCatalogoAlunos from "../hooks/useCatalogoAlunos";

// ============================================
// CONFIGURAÇÃO DE STATUS
// ============================================

const STATUS = {
    ABERTO: "Aberto",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDO: "Concluído",
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

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

function obterAlunoId(registro) {
    return primeiroValor(registro, ["aluno_id", "id_aluno"]);
}

function obterStatus(registro) {
    const valor = primeiroValor(registro, ["status", "situacao"]);

    const codigo = String(valor ?? "")
        .trim()
        .toUpperCase();

    return Object.hasOwn(STATUS, codigo) ? codigo : null;
}

function obterTitulo(registro) {
    return textoOuTraco(
        primeiroValor(registro, ["titulo", "tipo", "descricao", "acao"]),
    );
}

function obterDataRegistro(registro) {
    return primeiroValor(registro, [
        "criado_em",
        "data_registro",
        "data_intervencao",
        "data",
    ]);
}

function formatarData(valor) {
    if (!valor) return "Não informado";

    const texto = String(valor);
    const partes = texto.slice(0, 10).split("-");

    if (
        partes.length !== 3 ||
        partes[0].length !== 4 ||
        partes[1].length !== 2 ||
        partes[2].length !== 2
    ) {
        return texto;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return "Sessão inválida ou expirada. Faça login novamente.";
    }

    if (erro.status === 403) {
        return "Você não tem permissão para esta consulta.";
    }

    if (erro.status === 404) {
        return "Intervenção não encontrada ou sem acesso.";
    }

    if (erro.status === 422) {
        return "Parâmetros inválidos.";
    }

    return erro.message || "Erro ao consultar intervenções.";
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function SeloStatus({ status }) {
    return (
        <span
            className={
                `intervencoes-status ` +
                `intervencoes-status--${status || "DESCONHECIDO"}`
            }
        >
            {status ? STATUS[status] : "Não informado"}
        </span>
    );
}

function CampoDetalhe({ titulo, valor }) {
    return (
        <div className="intervencoes-detalhe-campo">
            <span>{titulo}</span>
            <strong>{textoOuTraco(valor)}</strong>
        </div>
    );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function Intervencoes({ token }) {
    // ==========================================
    // CATÁLOGO DE ALUNOS
    // ==========================================

    const {
        alunosPorId,
        carregando: carregandoAlunos,
        erro: erroAlunos,
        nomeDoAluno,
        atualizar: atualizarAlunos,
    } = useCatalogoAlunos(token);

    // ==========================================
    // LISTAGEM
    // ==========================================

    const [intervencoes, setIntervencoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [versaoConsulta, setVersaoConsulta] = useState(0);

    // ==========================================
    // FILTROS
    // ==========================================

    const [pesquisa, setPesquisa] = useState("");
    const [filtroAluno, setFiltroAluno] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");

    // ==========================================
    // DETALHES
    // ==========================================

    const [selecao, setSelecao] = useState(null);
    const [detalhe, setDetalhe] = useState(null);
    const [detalheCarregando, setDetalheCarregando] = useState(false);
    const [detalheErro, setDetalheErro] = useState("");

    // ==========================================
    // CONSULTAR INTERVENÇÕES
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();
        let ativo = true;

        async function carregar() {
            try {
                const dados = await listarIntervencoes({
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setIntervencoes(dados);
                    setErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setIntervencoes([]);
                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregar();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [token, versaoConsulta]);

    // ==========================================
    // CONSULTAR DETALHES
    // ==========================================

    useEffect(() => {
        if (!selecao) return;

        const controller = new AbortController();
        let ativo = true;

        async function carregarDetalhes() {
            try {
                const dados = await consultarIntervencao({
                    intervencaoId: selecao.id,
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setDetalhe(dados);
                    setDetalheErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setDetalhe(null);
                setDetalheErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setDetalheCarregando(false);
                }
            }
        }

        carregarDetalhes();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [selecao, token]);

    // ==========================================
    // ALUNOS DAS INTERVENÇÕES CARREGADAS
    // ==========================================

    const alunosDisponiveis = useMemo(() => {
        const ids = [
            ...new Set(
                intervencoes
                    .map(obterAlunoId)
                    .filter((id) => id !== null && id !== undefined)
                    .map(String),
            ),
        ];

        return ids.sort((a, b) => {
            const nomeA = alunosPorId.get(a)?.nome || `Aluno ID ${a}`;
            const nomeB = alunosPorId.get(b)?.nome || `Aluno ID ${b}`;

            return nomeA.localeCompare(nomeB, "pt-BR", {
                numeric: true,
            });
        });
    }, [intervencoes, alunosPorId]);

    // ==========================================
    // VALIDAR PERÍODO
    // ==========================================

    const periodoInvalido = Boolean(
        dataInicio && dataFim && dataInicio > dataFim,
    );

    // ==========================================
    // FILTRAGEM LOCAL
    // ==========================================

    const intervencoesFiltradas = useMemo(() => {
        if (periodoInvalido) return [];

        const termo = pesquisa.trim().toLocaleLowerCase("pt-BR");

        return intervencoes.filter((item) => {
            const idAluno = obterAlunoId(item);

            const nomeAluno = alunosPorId.get(String(idAluno))?.nome || "";

            const textoPesquisa = [
                obterTitulo(item),
                primeiroValor(item, ["descricao", "observacao"]),
                idAluno,
                nomeAluno,
            ]
                .filter((valor) => valor != null)
                .join(" ")
                .toLocaleLowerCase("pt-BR");

            const pesquisaCorresponde = !termo || textoPesquisa.includes(termo);

            const alunoCorresponde =
                !filtroAluno || String(idAluno) === filtroAluno;

            const statusCorresponde =
                !filtroStatus || obterStatus(item) === filtroStatus;

            const data = String(obterDataRegistro(item) ?? "").slice(0, 10);

            const inicioCorresponde = !dataInicio || data >= dataInicio;

            const fimCorresponde = !dataFim || data <= dataFim;

            return (
                pesquisaCorresponde &&
                alunoCorresponde &&
                statusCorresponde &&
                inicioCorresponde &&
                fimCorresponde
            );
        });
    }, [
        intervencoes,
        alunosPorId,
        pesquisa,
        filtroAluno,
        filtroStatus,
        dataInicio,
        dataFim,
        periodoInvalido,
    ]);

    // ==========================================
    // RESUMO
    // ==========================================

    const resumo = useMemo(
        () => ({
            total: intervencoesFiltradas.length,

            abertas: intervencoesFiltradas.filter(
                (item) => obterStatus(item) === "ABERTO",
            ).length,

            andamento: intervencoesFiltradas.filter(
                (item) => obterStatus(item) === "EM_ANDAMENTO",
            ).length,

            concluidas: intervencoesFiltradas.filter(
                (item) => obterStatus(item) === "CONCLUIDO",
            ).length,
        }),
        [intervencoesFiltradas],
    );

    // ==========================================
    // AÇÕES
    // ==========================================

    function abrirDetalhes(id) {
        setDetalhe(null);
        setDetalheErro("");
        setDetalheCarregando(true);

        setSelecao((anterior) => ({
            id,
            numero: (anterior?.numero ?? 0) + 1,
        }));
    }

    function fecharDetalhes() {
        setSelecao(null);
        setDetalhe(null);
        setDetalheErro("");
        setDetalheCarregando(false);
    }

    function atualizarLista() {
        fecharDetalhes();
        setIntervencoes([]);
        setCarregando(true);
        setErro("");

        setVersaoConsulta((anterior) => anterior + 1);
    }

    function limparFiltros() {
        setPesquisa("");
        setFiltroAluno("");
        setFiltroStatus("");
        setDataInicio("");
        setDataFim("");
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="intervencoes-pagina">
            <section className="intervencoes-introducao">
                <h2>Intervenções escolares</h2>

                <p>
                    Consulte as ações de acompanhamento registradas para os
                    estudantes.
                </p>
            </section>

            {/* ======================================
          CARTÕES
      ====================================== */}

            <section className="intervencoes-resumo">
                <article className="intervencoes-resumo-cartao">
                    <span>Total de intervenções</span>
                    <strong>{resumo.total}</strong>
                </article>

                <article className="intervencoes-resumo-cartao">
                    <span>Abertas</span>
                    <strong>{resumo.abertas}</strong>
                </article>

                <article className="intervencoes-resumo-cartao">
                    <span>Em andamento</span>
                    <strong>{resumo.andamento}</strong>
                </article>

                <article className="intervencoes-resumo-cartao">
                    <span>Concluídas</span>
                    <strong>{resumo.concluidas}</strong>
                </article>
            </section>

            {/* ======================================
          PAINEL
      ====================================== */}

            <section className="intervencoes-painel">
                <div className="intervencoes-painel-topo">
                    <h3>Consultar intervenções</h3>

                    <button
                        type="button"
                        className="intervencoes-botao-primario"
                        onClick={atualizarLista}
                        disabled={carregando}
                    >
                        Atualizar lista
                    </button>
                </div>

                {/* ====================================
            FILTROS
        ==================================== */}

                <div className="intervencoes-filtros">
                    <div className="intervencoes-campo">
                        <label htmlFor="intervencoes-pesquisa">Pesquisar</label>

                        <input
                            id="intervencoes-pesquisa"
                            type="search"
                            placeholder="Aluno, descrição ou ação"
                            value={pesquisa}
                            onChange={(evento) => {
                                setPesquisa(evento.target.value);
                            }}
                        />
                    </div>

                    <div className="intervencoes-campo">
                        <label htmlFor="intervencoes-aluno">Aluno</label>

                        <select
                            id="intervencoes-aluno"
                            value={filtroAluno}
                            onChange={(evento) => {
                                setFiltroAluno(evento.target.value);
                            }}
                        >
                            <option value="">Todos os alunos</option>

                            {alunosDisponiveis.map((id) => {
                                const aluno = alunosPorId.get(id);

                                return (
                                    <option key={id} value={id}>
                                        {aluno?.nome || `Aluno ID ${id}`}
                                        {aluno?.codigo_aluno
                                            ? ` — ${aluno.codigo_aluno}`
                                            : ""}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="intervencoes-campo">
                        <label htmlFor="intervencoes-status">Situação</label>

                        <select
                            id="intervencoes-status"
                            value={filtroStatus}
                            onChange={(evento) => {
                                setFiltroStatus(evento.target.value);
                            }}
                        >
                            <option value="">Todas</option>
                            <option value="ABERTO">Aberto</option>
                            <option value="EM_ANDAMENTO">Em andamento</option>
                            <option value="CONCLUIDO">Concluído</option>
                        </select>
                    </div>

                    <div className="intervencoes-campo">
                        <label htmlFor="intervencoes-inicio">
                            Data inicial
                        </label>

                        <input
                            id="intervencoes-inicio"
                            type="date"
                            value={dataInicio}
                            onChange={(evento) => {
                                setDataInicio(evento.target.value);
                            }}
                        />
                    </div>

                    <div className="intervencoes-campo">
                        <label htmlFor="intervencoes-fim">Data final</label>

                        <input
                            id="intervencoes-fim"
                            type="date"
                            value={dataFim}
                            onChange={(evento) => {
                                setDataFim(evento.target.value);
                            }}
                        />
                    </div>
                </div>

                {/* ====================================
            CATÁLOGO
        ==================================== */}

                <div className="catalogo-alunos-status">
                    {carregandoAlunos ? (
                        <p role="status">Carregando nomes dos alunos...</p>
                    ) : erroAlunos ? (
                        <p role="status">
                            Não foi possível carregar os nomes. Os IDs
                            permanecem disponíveis.
                        </p>
                    ) : (
                        <p>Nomes dos alunos atualizados pelo FastAPI.</p>
                    )}

                    <button
                        type="button"
                        onClick={atualizarAlunos}
                        disabled={carregandoAlunos}
                    >
                        Atualizar nomes
                    </button>
                </div>

                <div className="intervencoes-filtros-rodape">
                    <span>
                        {intervencoesFiltradas.length}
                        {" registro(s) encontrado(s)"}
                    </span>

                    <button
                        type="button"
                        className="intervencoes-botao-secundario"
                        onClick={limparFiltros}
                    >
                        Limpar filtros
                    </button>
                </div>

                {/* ====================================
            MENSAGENS
        ==================================== */}

                {periodoInvalido && (
                    <p
                        className="intervencoes-mensagem intervencoes-mensagem--erro"
                        role="alert"
                    >
                        A data inicial não pode ser posterior à data final.
                    </p>
                )}

                {carregando && (
                    <p className="intervencoes-mensagem" role="status">
                        Carregando intervenções...
                    </p>
                )}

                {erro && (
                    <p
                        className="intervencoes-mensagem intervencoes-mensagem--erro"
                        role="alert"
                    >
                        {erro}
                    </p>
                )}

                {!carregando && !erro && intervencoes.length === 0 && (
                    <p className="intervencoes-mensagem">
                        Nenhuma intervenção disponível para sua conta.
                    </p>
                )}

                {!periodoInvalido &&
                    !carregando &&
                    !erro &&
                    intervencoes.length > 0 &&
                    intervencoesFiltradas.length === 0 && (
                        <p className="intervencoes-mensagem">
                            Nenhuma intervenção corresponde aos filtros
                            informados.
                        </p>
                    )}

                {/* ====================================
            TABELA
        ==================================== */}

                {!periodoInvalido &&
                    !carregando &&
                    !erro &&
                    intervencoesFiltradas.length > 0 && (
                        <div className="intervencoes-tabela-container">
                            <table className="intervencoes-tabela">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Aluno</th>
                                        <th>Ação / Descrição</th>
                                        <th>Data</th>
                                        <th>Situação</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {intervencoesFiltradas.map((item) => {
                                        const idAluno = obterAlunoId(item);
                                        const aluno = alunosPorId.get(
                                            String(idAluno),
                                        );

                                        return (
                                            <tr key={item.id}>
                                                <td>{textoOuTraco(item.id)}</td>

                                                <td>
                                                    <div className="catalogo-aluno-celula">
                                                        <strong>
                                                            {nomeDoAluno(
                                                                idAluno,
                                                            )}
                                                        </strong>

                                                        <small>
                                                            {aluno?.codigo_aluno ||
                                                                `Aluno ID ${idAluno ?? "não informado"}`}
                                                        </small>
                                                    </div>
                                                </td>

                                                <td>
                                                    <strong>
                                                        {obterTitulo(item)}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {formatarData(
                                                        obterDataRegistro(item),
                                                    )}
                                                </td>

                                                <td>
                                                    <SeloStatus
                                                        status={obterStatus(
                                                            item,
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="intervencoes-botao-detalhes"
                                                        onClick={() =>
                                                            abrirDetalhes(
                                                                item.id,
                                                            )
                                                        }
                                                    >
                                                        Ver detalhes
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
            </section>

            {/* ======================================
          DETALHES
      ====================================== */}

            {selecao !== null && (
                <section className="intervencoes-detalhes">
                    <div className="intervencoes-detalhes-topo">
                        <h3>Detalhes da intervenção</h3>

                        <button
                            type="button"
                            className="intervencoes-botao-secundario"
                            onClick={fecharDetalhes}
                        >
                            Fechar
                        </button>
                    </div>

                    {detalheCarregando && (
                        <p role="status">Carregando detalhes...</p>
                    )}

                    {detalheErro && (
                        <p
                            className="intervencoes-mensagem intervencoes-mensagem--erro"
                            role="alert"
                        >
                            {detalheErro}
                        </p>
                    )}

                    {detalhe && (
                        <div className="intervencoes-detalhes-grade">
                            <CampoDetalhe
                                titulo="ID da intervenção"
                                valor={detalhe.id}
                            />

                            <CampoDetalhe
                                titulo="Aluno"
                                valor={nomeDoAluno(obterAlunoId(detalhe))}
                            />

                            <CampoDetalhe
                                titulo="ID do aluno"
                                valor={obterAlunoId(detalhe)}
                            />

                            <CampoDetalhe
                                titulo="Ação / Descrição"
                                valor={obterTitulo(detalhe)}
                            />

                            <div className="intervencoes-detalhe-campo">
                                <span>Situação</span>
                                <SeloStatus status={obterStatus(detalhe)} />
                            </div>

                            <CampoDetalhe
                                titulo="Data do registro"
                                valor={formatarData(obterDataRegistro(detalhe))}
                            />

                            <CampoDetalhe
                                titulo="Data de conclusão"
                                valor={formatarData(
                                    primeiroValor(detalhe, [
                                        "concluido_em",
                                        "data_conclusao",
                                    ]),
                                )}
                            />

                            <CampoDetalhe
                                titulo="Observações"
                                valor={primeiroValor(detalhe, [
                                    "observacao",
                                    "observacoes",
                                ])}
                            />

                            <CampoDetalhe
                                titulo="Responsável registrado"
                                valor={primeiroValor(detalhe, [
                                    "responsavel",
                                    "responsavel_nome",
                                    "usuario_responsavel",
                                ])}
                            />
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default Intervencoes;
