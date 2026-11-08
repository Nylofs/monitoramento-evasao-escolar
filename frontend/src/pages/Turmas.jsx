import { useEffect, useMemo, useState } from "react";

import { listarTurmas, consultarTurma } from "../services/turmaService";

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function textoOuTraco(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "Não informado";
    }

    return String(valor);
}

function formatarTurno(turno) {
    if (!turno) {
        return "Não informado";
    }

    const nomes = {
        MANHA: "Manhã",
        TARDE: "Tarde",
        NOITE: "Noite",
        INTEGRAL: "Integral",
    };

    const codigo = String(turno).toUpperCase();

    return nomes[codigo] || String(turno);
}

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sua autenticação foi rejeitada ou expirou. " +
            "Saia do sistema e entre novamente."
        );
    }

    if (erro.status === 403) {
        return "Você não possui permissão para esta consulta.";
    }

    if (erro.status === 404) {
        return "Turma não encontrada ou sem acesso.";
    }

    return erro.message || "Não foi possível consultar as turmas.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function Turmas({ token }) {
    // ==========================================
    // ESTADOS DA LISTAGEM
    // ==========================================

    const [turmas, setTurmas] = useState([]);

    const [carregando, setCarregando] = useState(true);

    const [erro, setErro] = useState("");

    const [versaoConsulta, setVersaoConsulta] = useState(0);

    // ==========================================
    // ESTADOS DOS FILTROS
    // ==========================================

    const [pesquisa, setPesquisa] = useState("");

    const [filtroAno, setFiltroAno] = useState("");

    const [filtroTurno, setFiltroTurno] = useState("");

    const [filtroSituacao, setFiltroSituacao] = useState("");

    const [filtroEscola, setFiltroEscola] = useState("");

    // ==========================================
    // ESTADOS DOS DETALHES
    // ==========================================

    const [selecao, setSelecao] = useState(null);

    const [turmaSelecionada, setTurmaSelecionada] = useState(null);

    const [detalheCarregando, setDetalheCarregando] = useState(false);

    const [detalheErro, setDetalheErro] = useState("");

    // ==========================================
    // CONSULTAR A LISTA NO FASTAPI
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();

        let ativo = true;

        async function carregarTurmas() {
            try {
                const dados = await listarTurmas({
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setTurmas(dados);
                    setErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setTurmas([]);
                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarTurmas();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [token, versaoConsulta]);

    // ==========================================
    // CONSULTAR OS DETALHES DA TURMA
    // ==========================================

    useEffect(() => {
        if (selecao === null) {
            return;
        }

        const controller = new AbortController();

        let ativo = true;

        async function carregarDetalhes() {
            try {
                const dados = await consultarTurma({
                    turmaId: selecao.id,
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setTurmaSelecionada(dados);
                    setDetalheErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setTurmaSelecionada(null);
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
    // OPÇÕES DOS FILTROS
    // ==========================================

    const anosDisponiveis = useMemo(() => {
        return [
            ...new Set(
                turmas
                    .map((turma) => turma.ano_letivo)
                    .filter((ano) => ano !== null && ano !== undefined)
                    .map(String),
            ),
        ].sort((a, b) => b.localeCompare(a));
    }, [turmas]);

    const turnosDisponiveis = useMemo(() => {
        return [
            ...new Set(
                turmas
                    .map((turma) => turma.turno)
                    .filter(Boolean)
                    .map(String),
            ),
        ].sort();
    }, [turmas]);

    const escolasDisponiveis = useMemo(() => {
        return [
            ...new Set(
                turmas
                    .map((turma) => turma.escola_id)
                    .filter((id) => id !== null && id !== undefined)
                    .map(String),
            ),
        ].sort((a, b) => Number(a) - Number(b));
    }, [turmas]);

    // ==========================================
    // FILTRAGEM LOCAL
    // ==========================================

    const turmasFiltradas = useMemo(() => {
        const termo = pesquisa.trim().toLocaleLowerCase("pt-BR");

        return turmas.filter((turma) => {
            const conteudo = [
                turma.nome,
                turma.serie,
                turma.turno,
                turma.ano_letivo,
            ]
                .filter((valor) => valor != null)
                .join(" ")
                .toLocaleLowerCase("pt-BR");

            const correspondePesquisa = !termo || conteudo.includes(termo);

            const correspondeAno =
                !filtroAno || String(turma.ano_letivo) === filtroAno;

            const correspondeTurno =
                !filtroTurno || String(turma.turno) === filtroTurno;

            const correspondeEscola =
                !filtroEscola || String(turma.escola_id) === filtroEscola;

            const correspondeSituacao =
                !filtroSituacao ||
                (filtroSituacao === "ativa"
                    ? turma.ativo === true
                    : turma.ativo === false);

            return (
                correspondePesquisa &&
                correspondeAno &&
                correspondeTurno &&
                correspondeEscola &&
                correspondeSituacao
            );
        });
    }, [
        turmas,
        pesquisa,
        filtroAno,
        filtroTurno,
        filtroEscola,
        filtroSituacao,
    ]);

    // ==========================================
    // TOTALIZADORES
    // ==========================================

    const totalTurmas = turmas.length;

    const totalAtivas = turmas.filter((turma) => turma.ativo === true).length;

    const totalInativas = turmas.filter(
        (turma) => turma.ativo === false,
    ).length;

    // ==========================================
    // ABRIR DETALHES
    // ==========================================

    function abrirDetalhes(turmaId) {
        setTurmaSelecionada(null);
        setDetalheErro("");
        setDetalheCarregando(true);

        // Cria uma nova seleção mesmo que
        // o usuário clique na mesma turma.
        setSelecao((anterior) => ({
            id: turmaId,
            numero: (anterior?.numero ?? 0) + 1,
        }));
    }

    // ==========================================
    // FECHAR DETALHES
    // ==========================================

    function fecharDetalhes() {
        setSelecao(null);
        setTurmaSelecionada(null);
        setDetalheErro("");
        setDetalheCarregando(false);
    }

    // ==========================================
    // RECARREGAR LISTAGEM
    // ==========================================

    function atualizarLista() {
        fecharDetalhes();

        setCarregando(true);
        setErro("");

        setVersaoConsulta((anterior) => anterior + 1);
    }

    // ==========================================
    // LIMPAR FILTROS
    // ==========================================

    function limparFiltros() {
        setPesquisa("");
        setFiltroAno("");
        setFiltroTurno("");
        setFiltroSituacao("");
        setFiltroEscola("");
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="turmas-pagina">
            <section className="turmas-introducao">
                <h2>Turmas escolares</h2>

                <p>
                    Consulte as turmas disponíveis para sua conta e visualize as
                    informações cadastrais.
                </p>
            </section>

            {/* ======================================
          CARTÕES DE RESUMO
      ====================================== */}

            <section className="turmas-resumo">
                <article className="turmas-resumo-cartao">
                    <span>Total de turmas acessíveis</span>
                    <strong>{totalTurmas}</strong>
                </article>

                <article className="turmas-resumo-cartao">
                    <span>Turmas ativas</span>
                    <strong>{totalAtivas}</strong>
                </article>

                <article className="turmas-resumo-cartao">
                    <span>Turmas inativas</span>
                    <strong>{totalInativas}</strong>
                </article>
            </section>

            {/* ======================================
          PESQUISA E FILTROS
      ====================================== */}

            <section className="turmas-painel">
                <div className="turmas-painel-topo">
                    <h3>Consultar turmas</h3>

                    <button
                        type="button"
                        className="turmas-botao-atualizar"
                        onClick={atualizarLista}
                        disabled={carregando}
                    >
                        Atualizar lista
                    </button>
                </div>

                <div className="turmas-filtros">
                    <div className="turmas-campo">
                        <label htmlFor="turmas-pesquisa">Pesquisar</label>

                        <input
                            id="turmas-pesquisa"
                            type="search"
                            placeholder="Nome ou série"
                            value={pesquisa}
                            onChange={(evento) => {
                                setPesquisa(evento.target.value);
                            }}
                        />
                    </div>

                    <div className="turmas-campo">
                        <label htmlFor="turmas-ano">Ano letivo</label>

                        <select
                            id="turmas-ano"
                            value={filtroAno}
                            onChange={(evento) => {
                                setFiltroAno(evento.target.value);
                            }}
                        >
                            <option value="">Todos</option>

                            {anosDisponiveis.map((ano) => (
                                <option key={ano} value={ano}>
                                    {ano}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="turmas-campo">
                        <label htmlFor="turmas-turno">Turno</label>

                        <select
                            id="turmas-turno"
                            value={filtroTurno}
                            onChange={(evento) => {
                                setFiltroTurno(evento.target.value);
                            }}
                        >
                            <option value="">Todos</option>

                            {turnosDisponiveis.map((turno) => (
                                <option key={turno} value={turno}>
                                    {formatarTurno(turno)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="turmas-campo">
                        <label htmlFor="turmas-situacao">Situação</label>

                        <select
                            id="turmas-situacao"
                            value={filtroSituacao}
                            onChange={(evento) => {
                                setFiltroSituacao(evento.target.value);
                            }}
                        >
                            <option value="">Todas</option>
                            <option value="ativa">Ativas</option>
                            <option value="inativa">Inativas</option>
                        </select>
                    </div>

                    <div className="turmas-campo">
                        <label htmlFor="turmas-escola">Escola</label>

                        <select
                            id="turmas-escola"
                            value={filtroEscola}
                            onChange={(evento) => {
                                setFiltroEscola(evento.target.value);
                            }}
                        >
                            <option value="">Todas</option>

                            {escolasDisponiveis.map((id) => (
                                <option key={id} value={id}>
                                    Escola ID {id}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="turmas-filtros-rodape">
                    <span>
                        {turmasFiltradas.length}
                        {" turma(s) encontrada(s)"}
                    </span>

                    <button
                        type="button"
                        className="turmas-botao-limpar"
                        onClick={limparFiltros}
                    >
                        Limpar filtros
                    </button>
                </div>

                {/* ====================================
            MENSAGENS DE ESTADO
        ==================================== */}

                {carregando && (
                    <p className="turmas-mensagem" role="status">
                        Carregando turmas...
                    </p>
                )}

                {erro && (
                    <p
                        className="turmas-mensagem turmas-mensagem--erro"
                        role="alert"
                    >
                        {erro}
                    </p>
                )}

                {!carregando && !erro && turmas.length === 0 && (
                    <p className="turmas-mensagem">
                        Nenhuma turma disponível para sua conta.
                    </p>
                )}

                {!carregando &&
                    !erro &&
                    turmas.length > 0 &&
                    turmasFiltradas.length === 0 && (
                        <p className="turmas-mensagem">
                            Nenhuma turma corresponde aos filtros informados.
                        </p>
                    )}

                {/* ====================================
            TABELA DE TURMAS
        ==================================== */}

                {!carregando && !erro && turmasFiltradas.length > 0 && (
                    <div className="turmas-tabela-container">
                        <table className="turmas-tabela">
                            <thead>
                                <tr>
                                    <th>Turma</th>
                                    <th>Série</th>
                                    <th>Turno</th>
                                    <th>Ano letivo</th>
                                    <th>Escola</th>
                                    <th>Situação</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>

                            <tbody>
                                {turmasFiltradas.map((turma) => (
                                    <tr key={turma.id}>
                                        <td>
                                            <strong>
                                                {textoOuTraco(turma.nome)}
                                            </strong>
                                        </td>

                                        <td>{textoOuTraco(turma.serie)}</td>

                                        <td>{formatarTurno(turma.turno)}</td>

                                        <td>
                                            {textoOuTraco(turma.ano_letivo)}
                                        </td>

                                        <td>
                                            ID {textoOuTraco(turma.escola_id)}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    turma.ativo
                                                        ? "turmas-status turmas-status--ativa"
                                                        : "turmas-status turmas-status--inativa"
                                                }
                                            >
                                                {turma.ativo
                                                    ? "Ativa"
                                                    : "Inativa"}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="turmas-botao-detalhes"
                                                onClick={() => {
                                                    abrirDetalhes(turma.id);
                                                }}
                                            >
                                                Ver detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ======================================
          DETALHES DA TURMA
      ====================================== */}

            {selecao !== null && (
                <section className="turmas-detalhes">
                    <div className="turmas-detalhes-topo">
                        <h3>Detalhes da turma</h3>

                        <button
                            type="button"
                            className="turmas-botao-fechar"
                            onClick={fecharDetalhes}
                        >
                            Fechar
                        </button>
                    </div>

                    {detalheCarregando && (
                        <p role="status">Carregando detalhes da turma...</p>
                    )}

                    {detalheErro && (
                        <p
                            className="turmas-mensagem turmas-mensagem--erro"
                            role="alert"
                        >
                            {detalheErro}
                        </p>
                    )}

                    {turmaSelecionada && (
                        <div className="turmas-detalhes-grade">
                            <div>
                                <span>ID da turma</span>
                                <strong>
                                    {textoOuTraco(turmaSelecionada.id)}
                                </strong>
                            </div>

                            <div>
                                <span>Nome</span>
                                <strong>
                                    {textoOuTraco(turmaSelecionada.nome)}
                                </strong>
                            </div>

                            <div>
                                <span>Série</span>
                                <strong>
                                    {textoOuTraco(turmaSelecionada.serie)}
                                </strong>
                            </div>

                            <div>
                                <span>Turno</span>
                                <strong>
                                    {formatarTurno(turmaSelecionada.turno)}
                                </strong>
                            </div>

                            <div>
                                <span>Ano letivo</span>
                                <strong>
                                    {textoOuTraco(turmaSelecionada.ano_letivo)}
                                </strong>
                            </div>

                            <div>
                                <span>ID da escola</span>
                                <strong>
                                    {textoOuTraco(turmaSelecionada.escola_id)}
                                </strong>
                            </div>

                            <div>
                                <span>Situação</span>
                                <strong>
                                    {turmaSelecionada.ativo
                                        ? "Ativa"
                                        : "Inativa"}
                                </strong>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default Turmas;
