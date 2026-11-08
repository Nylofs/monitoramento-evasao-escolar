import { useEffect, useMemo, useState } from "react";

import { listarEscolas, consultarEscola } from "../services/escolaService";

// ============================================
// FORMATAÇÃO DE VALORES
// ============================================

function textoOuTraco(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "Não informado";
    }

    return String(valor);
}

function formatarData(valor) {
    if (!valor) {
        return "Não informado";
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return "Não informado";
    }

    return data.toLocaleDateString("pt-BR");
}

// ============================================
// MENSAGENS DE ERRO
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sua autenticação foi rejeitada ou expirou. " +
            "Saia do sistema e faça login novamente."
        );
    }

    if (erro.status === 403) {
        return "Você não possui permissão para esta operação.";
    }

    if (erro.status === 404) {
        return "Escola não encontrada ou sem acesso.";
    }

    return erro.message || "Não foi possível consultar as escolas.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function Escolas({ token }) {
    // ==========================================
    // LISTAGEM
    // ==========================================

    const [escolas, setEscolas] = useState([]);

    const [pesquisa, setPesquisa] = useState("");

    const [carregando, setCarregando] = useState(true);

    const [erro, setErro] = useState("");

    const [versaoConsulta, setVersaoConsulta] = useState(0);

    // ==========================================
    // DETALHES DA ESCOLA
    // ==========================================

    const [escolaSelecionada, setEscolaSelecionada] = useState(null);

    const [detalheCarregando, setDetalheCarregando] = useState(false);

    const [detalheErro, setDetalheErro] = useState("");

    const [idSelecionado, setIdSelecionado] = useState(null);

    // ==========================================
    // BUSCAR LISTA NO FASTAPI
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();
        let ativo = true;

        async function carregarEscolas() {
            try {
                const dados = await listarEscolas({
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setEscolas(dados);
                    setErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setEscolas([]);
                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarEscolas();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [token, versaoConsulta]);

    // ==========================================
    // BUSCAR DETALHES NO FASTAPI
    // ==========================================

    useEffect(() => {
        if (idSelecionado === null) {
            return;
        }

        const controller = new AbortController();
        let ativo = true;

        async function carregarDetalhes() {
            try {
                const dados = await consultarEscola({
                    escolaId: idSelecionado,
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setEscolaSelecionada(dados);
                    setDetalheErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setDetalheErro(mensagemDeErro(falha));
                setEscolaSelecionada(null);
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
    }, [idSelecionado, token]);

    // ==========================================
    // PESQUISAR NA LISTA JÁ CARREGADA
    // ==========================================

    const escolasFiltradas = useMemo(() => {
        const termo = pesquisa.trim().toLocaleLowerCase("pt-BR");

        if (!termo) {
            return escolas;
        }

        return escolas.filter((escola) => {
            const conteudo = [
                escola.nome,
                escola.codigo_inep,
                escola.cidade,
                escola.uf,
                escola.bairro,
            ]
                .filter((valor) => valor != null)
                .join(" ")
                .toLocaleLowerCase("pt-BR");

            return conteudo.includes(termo);
        });
    }, [escolas, pesquisa]);

    // ==========================================
    // TOTAIS DAS ESCOLAS
    // ==========================================

    const totalEscolas = escolas.length;

    const totalAtivas = escolas.filter(
        (escola) => escola.ativo === true,
    ).length;

    const totalInativas = escolas.filter(
        (escola) => escola.ativo === false,
    ).length;

    // ==========================================
    // ABRIR DETALHES
    // ==========================================

    function abrirDetalhes(escolaId) {
        setEscolaSelecionada(null);
        setDetalheErro("");
        setDetalheCarregando(true);

        // Um novo clique no mesmo ID também
        // deve permitir uma nova consulta.
        setIdSelecionado(null);

        // A consulta será iniciada pelo efeito
        // após a atualização do estado.
        setTimeoutSelecionado(escolaId);
    }

    function setTimeoutSelecionado(escolaId) {
        setIdSelecionado({
            id: escolaId,
            chave: Date.now(),
        });
    }

    // ==========================================
    // FECHAR DETALHES
    // ==========================================

    function fecharDetalhes() {
        setIdSelecionado(null);
        setEscolaSelecionada(null);
        setDetalheErro("");
        setDetalheCarregando(false);
    }

    // ==========================================
    // RECARREGAR A LISTA
    // ==========================================

    function atualizarLista() {
        fecharDetalhes();
        setCarregando(true);
        setErro("");

        setVersaoConsulta((anterior) => anterior + 1);
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="escolas-pagina">
            <section className="escolas-introducao">
                <h2>Escolas cadastradas</h2>

                <p>
                    Consulte as instituições escolares disponíveis para sua
                    conta.
                </p>
            </section>

            {/* ======================================
          CARTÕES DE RESUMO
      ====================================== */}

            <section className="escolas-resumo">
                <article className="escolas-resumo-cartao">
                    <span>Total acessível</span>
                    <strong>{totalEscolas}</strong>
                </article>

                <article className="escolas-resumo-cartao">
                    <span>Escolas ativas</span>
                    <strong>{totalAtivas}</strong>
                </article>

                <article className="escolas-resumo-cartao">
                    <span>Escolas inativas</span>
                    <strong>{totalInativas}</strong>
                </article>
            </section>

            {/* ======================================
          PESQUISA E ATUALIZAÇÃO
      ====================================== */}

            <section className="escolas-painel">
                <div className="escolas-barra">
                    <div className="escolas-pesquisa">
                        <label htmlFor="pesquisa-escola">
                            Pesquisar escola
                        </label>

                        <input
                            id="pesquisa-escola"
                            type="search"
                            value={pesquisa}
                            placeholder="Nome, cidade, UF ou INEP"
                            onChange={(evento) => {
                                setPesquisa(evento.target.value);
                            }}
                        />
                    </div>

                    <button
                        type="button"
                        className="escolas-botao-atualizar"
                        onClick={atualizarLista}
                        disabled={carregando}
                    >
                        Atualizar lista
                    </button>
                </div>

                {/* ====================================
            ESTADOS DA CONSULTA
        ==================================== */}

                {carregando && (
                    <p className="escolas-mensagem" role="status">
                        Carregando escolas...
                    </p>
                )}

                {erro && (
                    <p
                        className="escolas-mensagem escolas-mensagem--erro"
                        role="alert"
                    >
                        {erro}
                    </p>
                )}

                {!carregando && !erro && escolas.length === 0 && (
                    <p className="escolas-mensagem">
                        Nenhuma escola disponível para sua conta.
                    </p>
                )}

                {!carregando &&
                    !erro &&
                    escolas.length > 0 &&
                    escolasFiltradas.length === 0 && (
                        <p className="escolas-mensagem">
                            Nenhuma escola corresponde à pesquisa.
                        </p>
                    )}

                {/* ====================================
            TABELA
        ==================================== */}

                {!carregando && !erro && escolasFiltradas.length > 0 && (
                    <div className="escolas-tabela-container">
                        <table className="escolas-tabela">
                            <thead>
                                <tr>
                                    <th>Escola</th>
                                    <th>Cidade / UF</th>
                                    <th>INEP</th>
                                    <th>Situação</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>

                            <tbody>
                                {escolasFiltradas.map((escola) => (
                                    <tr key={escola.id}>
                                        <td>
                                            <strong>{escola.nome}</strong>
                                        </td>

                                        <td>
                                            {textoOuTraco(escola.cidade)}
                                            {" / "}
                                            {textoOuTraco(escola.uf)}
                                        </td>

                                        <td>
                                            {textoOuTraco(escola.codigo_inep)}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    escola.ativo
                                                        ? "escolas-status escolas-status--ativa"
                                                        : "escolas-status escolas-status--inativa"
                                                }
                                            >
                                                {escola.ativo
                                                    ? "Ativa"
                                                    : "Inativa"}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="escolas-botao-detalhes"
                                                onClick={() => {
                                                    abrirDetalhes(escola.id);
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
          DETALHES DA ESCOLA
      ====================================== */}

            {idSelecionado !== null && (
                <section className="escolas-detalhes">
                    <div className="escolas-detalhes-cabecalho">
                        <h3>Detalhes da escola</h3>

                        <button
                            type="button"
                            onClick={fecharDetalhes}
                            className="escolas-botao-fechar"
                        >
                            Fechar
                        </button>
                    </div>

                    {detalheCarregando && (
                        <p role="status">Carregando detalhes...</p>
                    )}

                    {detalheErro && (
                        <p
                            className="escolas-mensagem escolas-mensagem--erro"
                            role="alert"
                        >
                            {detalheErro}
                        </p>
                    )}

                    {escolaSelecionada && (
                        <div className="escolas-detalhes-grade">
                            <div>
                                <span>Nome</span>
                                <strong>
                                    {textoOuTraco(escolaSelecionada.nome)}
                                </strong>
                            </div>

                            <div>
                                <span>Código INEP</span>
                                <strong>
                                    {textoOuTraco(
                                        escolaSelecionada.codigo_inep,
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Endereço</span>
                                <strong>
                                    {textoOuTraco(escolaSelecionada.endereco)}
                                </strong>
                            </div>

                            <div>
                                <span>Bairro</span>
                                <strong>
                                    {textoOuTraco(escolaSelecionada.bairro)}
                                </strong>
                            </div>

                            <div>
                                <span>Cidade</span>
                                <strong>
                                    {textoOuTraco(escolaSelecionada.cidade)}
                                </strong>
                            </div>

                            <div>
                                <span>UF</span>
                                <strong>
                                    {textoOuTraco(escolaSelecionada.uf)}
                                </strong>
                            </div>

                            <div>
                                <span>Situação</span>
                                <strong>
                                    {escolaSelecionada.ativo
                                        ? "Ativa"
                                        : "Inativa"}
                                </strong>
                            </div>

                            <div>
                                <span>Data do cadastro</span>
                                <strong>
                                    {formatarData(escolaSelecionada.criado_em)}
                                </strong>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default Escolas;
