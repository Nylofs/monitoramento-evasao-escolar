import { useEffect, useMemo, useState } from "react";

import { listarAlunos, consultarAluno } from "../services/alunoService";

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function textoOuTraco(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "Não informado";
    }

    return String(valor);
}

// ============================================
// TRATAMENTO DE MENSAGENS
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sua autenticação foi rejeitada ou expirou. " +
            "Saia do sistema e faça login novamente."
        );
    }

    if (erro.status === 403) {
        return "Você não possui permissão " + "para esta operação.";
    }

    if (erro.status === 404) {
        return "Aluno não encontrado ou sem acesso.";
    }

    return erro.message || "Não foi possível consultar os alunos.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function Alunos({ token }) {
    // ==========================================
    // ESTADOS DA LISTAGEM
    // ==========================================

    const [alunos, setAlunos] = useState([]);

    const [carregando, setCarregando] = useState(true);

    const [erro, setErro] = useState("");

    const [versaoConsulta, setVersaoConsulta] = useState(0);

    // ==========================================
    // ESTADOS DOS FILTROS
    // ==========================================

    const [pesquisa, setPesquisa] = useState("");

    const [filtroTurma, setFiltroTurma] = useState("");

    const [filtroSituacao, setFiltroSituacao] = useState("");

    // ==========================================
    // ESTADOS DOS DETALHES
    // ==========================================

    const [selecao, setSelecao] = useState(null);

    const [alunoSelecionado, setAlunoSelecionado] = useState(null);

    const [detalheCarregando, setDetalheCarregando] = useState(false);

    const [detalheErro, setDetalheErro] = useState("");

    // ==========================================
    // CARREGAR ALUNOS DO FASTAPI
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();

        let ativo = true;

        async function carregarAlunos() {
            try {
                const dados = await listarAlunos({
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setAlunos(dados);
                    setErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setAlunos([]);
                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarAlunos();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [token, versaoConsulta]);

    // ==========================================
    // CARREGAR DETALHES DE UM ALUNO
    // ==========================================

    useEffect(() => {
        if (selecao === null) {
            return;
        }

        const controller = new AbortController();

        let ativo = true;

        async function carregarDetalhes() {
            try {
                const dados = await consultarAluno({
                    alunoId: selecao.id,
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setAlunoSelecionado(dados);
                    setDetalheErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setAlunoSelecionado(null);
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
    // OPÇÕES DO FILTRO DE TURMAS
    // ==========================================

    const turmasDisponiveis = useMemo(() => {
        const ids = alunos
            .map((aluno) => aluno.turma_id)
            .filter((id) => id !== null && id !== undefined)
            .map(String);

        return [...new Set(ids)].sort((a, b) => Number(a) - Number(b));
    }, [alunos]);

    // ==========================================
    // PESQUISA E FILTROS LOCAIS
    // ==========================================

    const alunosFiltrados = useMemo(() => {
        const termo = pesquisa.trim().toLocaleLowerCase("pt-BR");

        return alunos.filter((aluno) => {
            const textoPesquisa = [aluno.nome, aluno.codigo_aluno]
                .filter((valor) => valor != null)
                .join(" ")
                .toLocaleLowerCase("pt-BR");

            const correspondePesquisa = !termo || textoPesquisa.includes(termo);

            const correspondeTurma =
                !filtroTurma || String(aluno.turma_id) === filtroTurma;

            const correspondeSituacao =
                !filtroSituacao ||
                (filtroSituacao === "ativo"
                    ? aluno.ativo === true
                    : aluno.ativo === false);

            return (
                correspondePesquisa && correspondeTurma && correspondeSituacao
            );
        });
    }, [alunos, pesquisa, filtroTurma, filtroSituacao]);

    // ==========================================
    // TOTALIZADORES
    // ==========================================

    const totalAlunos = alunos.length;

    const totalAtivos = alunos.filter((aluno) => aluno.ativo === true).length;

    const totalInativos = alunos.filter(
        (aluno) => aluno.ativo === false,
    ).length;

    // ==========================================
    // ABRIR DETALHES
    // ==========================================

    function abrirDetalhes(alunoId) {
        setAlunoSelecionado(null);
        setDetalheErro("");
        setDetalheCarregando(true);

        // Permite repetir a consulta do mesmo aluno.
        setSelecao((anterior) => ({
            id: alunoId,
            numero: (anterior?.numero ?? 0) + 1,
        }));
    }

    // ==========================================
    // FECHAR DETALHES
    // ==========================================

    function fecharDetalhes() {
        setSelecao(null);
        setAlunoSelecionado(null);
        setDetalheErro("");
        setDetalheCarregando(false);
    }

    // ==========================================
    // ATUALIZAR A LISTA
    // ==========================================

    function atualizarLista() {
        fecharDetalhes();

        setAlunos([]);
        setCarregando(true);
        setErro("");

        setVersaoConsulta((anterior) => anterior + 1);
    }

    // ==========================================
    // LIMPAR FILTROS
    // ==========================================

    function limparFiltros() {
        setPesquisa("");
        setFiltroTurma("");
        setFiltroSituacao("");
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="alunos-pagina">
            {/* ======================================
          TÍTULO DA PÁGINA
      ====================================== */}

            <section className="alunos-introducao">
                <h2>Alunos cadastrados</h2>

                <p>
                    Consulte os estudantes disponíveis para sua conta e
                    visualize suas informações cadastrais.
                </p>
            </section>

            {/* ======================================
          CARTÕES DE RESUMO
      ====================================== */}

            <section className="alunos-resumo">
                <article className="alunos-resumo-cartao">
                    <span>Total de alunos acessíveis</span>

                    <strong>{totalAlunos}</strong>
                </article>

                <article className="alunos-resumo-cartao">
                    <span>Alunos ativos</span>

                    <strong>{totalAtivos}</strong>
                </article>

                <article className="alunos-resumo-cartao">
                    <span>Alunos inativos</span>

                    <strong>{totalInativos}</strong>
                </article>
            </section>

            {/* ======================================
          PAINEL DE CONSULTA
      ====================================== */}

            <section className="alunos-painel">
                <div className="alunos-painel-topo">
                    <h3>Consultar alunos</h3>

                    <button
                        type="button"
                        className="alunos-botao-atualizar"
                        onClick={atualizarLista}
                        disabled={carregando}
                    >
                        Atualizar lista
                    </button>
                </div>

                {/* ====================================
            FILTROS
        ==================================== */}

                <div className="alunos-filtros">
                    <div className="alunos-campo">
                        <label htmlFor="alunos-pesquisa">Pesquisar aluno</label>

                        <input
                            id="alunos-pesquisa"
                            type="search"
                            placeholder="Nome ou código do aluno"
                            value={pesquisa}
                            onChange={(evento) => {
                                setPesquisa(evento.target.value);
                            }}
                        />
                    </div>

                    <div className="alunos-campo">
                        <label htmlFor="alunos-turma">Turma</label>

                        <select
                            id="alunos-turma"
                            value={filtroTurma}
                            onChange={(evento) => {
                                setFiltroTurma(evento.target.value);
                            }}
                        >
                            <option value="">Todas as turmas</option>

                            {turmasDisponiveis.map((id) => (
                                <option key={id} value={id}>
                                    Turma ID {id}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="alunos-campo">
                        <label htmlFor="alunos-situacao">Situação</label>

                        <select
                            id="alunos-situacao"
                            value={filtroSituacao}
                            onChange={(evento) => {
                                setFiltroSituacao(evento.target.value);
                            }}
                        >
                            <option value="">Todas</option>

                            <option value="ativo">Ativos</option>

                            <option value="inativo">Inativos</option>
                        </select>
                    </div>
                </div>

                {/* ====================================
            RESULTADO DOS FILTROS
        ==================================== */}

                <div className="alunos-filtros-rodape">
                    <span>
                        {alunosFiltrados.length}
                        {" aluno(s) encontrado(s)"}
                    </span>

                    <button
                        type="button"
                        className="alunos-botao-limpar"
                        onClick={limparFiltros}
                    >
                        Limpar filtros
                    </button>
                </div>

                {/* ====================================
            MENSAGENS DE ESTADO
        ==================================== */}

                {carregando && (
                    <p className="alunos-mensagem" role="status">
                        Carregando alunos...
                    </p>
                )}

                {erro && (
                    <p
                        className="alunos-mensagem alunos-mensagem--erro"
                        role="alert"
                    >
                        {erro}
                    </p>
                )}

                {!carregando && !erro && alunos.length === 0 && (
                    <p className="alunos-mensagem">
                        Nenhum aluno disponível para sua conta.
                    </p>
                )}

                {!carregando &&
                    !erro &&
                    alunos.length > 0 &&
                    alunosFiltrados.length === 0 && (
                        <p className="alunos-mensagem">
                            Nenhum aluno corresponde aos filtros informados.
                        </p>
                    )}

                {/* ====================================
            TABELA DE ALUNOS
        ==================================== */}

                {!carregando && !erro && alunosFiltrados.length > 0 && (
                    <div className="alunos-tabela-container">
                        <table className="alunos-tabela">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Código do aluno</th>
                                    <th>Turma</th>
                                    <th>Situação</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>

                            <tbody>
                                {alunosFiltrados.map((aluno) => (
                                    <tr key={aluno.id}>
                                        <td>{textoOuTraco(aluno.id)}</td>

                                        <td>
                                            <strong>
                                                {textoOuTraco(aluno.nome)}
                                            </strong>
                                        </td>

                                        <td>
                                            {textoOuTraco(aluno.codigo_aluno)}
                                        </td>

                                        <td>
                                            ID {textoOuTraco(aluno.turma_id)}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    aluno.ativo
                                                        ? "alunos-status alunos-status--ativo"
                                                        : "alunos-status alunos-status--inativo"
                                                }
                                            >
                                                {aluno.ativo
                                                    ? "Ativo"
                                                    : "Inativo"}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="alunos-botao-detalhes"
                                                onClick={() => {
                                                    abrirDetalhes(aluno.id);
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
          DETALHES DO ALUNO
      ====================================== */}

            {selecao !== null && (
                <section className="alunos-detalhes">
                    <div className="alunos-detalhes-topo">
                        <h3>Detalhes do aluno</h3>

                        <button
                            type="button"
                            className="alunos-botao-fechar"
                            onClick={fecharDetalhes}
                        >
                            Fechar
                        </button>
                    </div>

                    {detalheCarregando && (
                        <p role="status">Carregando detalhes do aluno...</p>
                    )}

                    {detalheErro && (
                        <p
                            className="alunos-mensagem alunos-mensagem--erro"
                            role="alert"
                        >
                            {detalheErro}
                        </p>
                    )}

                    {alunoSelecionado && (
                        <div className="alunos-detalhes-grade">
                            <div>
                                <span>Identificador</span>
                                <strong>
                                    {textoOuTraco(alunoSelecionado.id)}
                                </strong>
                            </div>

                            <div>
                                <span>Código do aluno</span>
                                <strong>
                                    {textoOuTraco(
                                        alunoSelecionado.codigo_aluno,
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Nome</span>
                                <strong>
                                    {textoOuTraco(alunoSelecionado.nome)}
                                </strong>
                            </div>

                            <div>
                                <span>ID da turma</span>
                                <strong>
                                    {textoOuTraco(alunoSelecionado.turma_id)}
                                </strong>
                            </div>

                            <div>
                                <span>Situação cadastral</span>
                                <strong>
                                    {alunoSelecionado.ativo
                                        ? "Ativo"
                                        : "Inativo"}
                                </strong>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default Alunos;
