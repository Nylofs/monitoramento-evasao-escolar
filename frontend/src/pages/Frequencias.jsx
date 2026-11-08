import { useEffect, useMemo, useState } from "react";

import {
    listarFrequencias,
    consultarFrequencia,
} from "../services/frequenciaService";

import useCatalogoAlunos from "../hooks/useCatalogoAlunos";

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function textoOuTraco(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "Não informado";
    }

    return String(valor);
}

function formatarData(valor) {
    if (!valor) return "Não informado";

    const data = String(valor).slice(0, 10);
    const partes = data.split("-");

    if (
        partes.length !== 3 ||
        partes[0].length !== 4 ||
        partes[1].length !== 2 ||
        partes[2].length !== 2
    ) {
        return String(valor);
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarSituacao(valor) {
    const situacoes = {
        PRESENTE: "Presente",
        AUSENTE: "Ausente",
        JUSTIFICADA: "Ausência justificada",
    };

    return situacoes[valor] || textoOuTraco(valor);
}

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return "Sessão inválida ou expirada. Faça login novamente.";
    }

    if (erro.status === 403) {
        return "Você não possui permissão para esta consulta.";
    }

    if (erro.status === 404) {
        return "Registro não encontrado ou sem acesso.";
    }

    return erro.message || "Erro ao consultar frequências.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function Frequencias({ token }) {
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
    // ESTADOS DA LISTAGEM
    // ==========================================

    const [frequencias, setFrequencias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [versaoConsulta, setVersaoConsulta] = useState(0);

    // ==========================================
    // FILTROS
    // ==========================================

    const [filtroAluno, setFiltroAluno] = useState("");
    const [filtroSituacao, setFiltroSituacao] = useState("");
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
    // LISTAR FREQUÊNCIAS
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();
        let ativo = true;

        async function carregar() {
            try {
                const dados = await listarFrequencias({
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setFrequencias(dados);
                    setErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setFrequencias([]);
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
                const dados = await consultarFrequencia({
                    frequenciaId: selecao.id,
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
    // ALUNOS QUE APARECEM NAS FREQUÊNCIAS
    // ==========================================

    const alunosDisponiveis = useMemo(() => {
        const ids = [
            ...new Set(
                frequencias
                    .map((item) => item.aluno_id)
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
    }, [frequencias, alunosPorId]);

    // ==========================================
    // PERÍODO
    // ==========================================

    const periodoInvalido = Boolean(
        dataInicio && dataFim && dataInicio > dataFim,
    );

    // ==========================================
    // FILTROS LOCAIS
    // ==========================================

    const frequenciasFiltradas = useMemo(() => {
        if (periodoInvalido) return [];

        return frequencias.filter((item) => {
            const data = String(item.data || "").slice(0, 10);

            const alunoCorresponde =
                !filtroAluno || String(item.aluno_id) === filtroAluno;

            const situacaoCorresponde =
                !filtroSituacao || item.situacao === filtroSituacao;

            const inicioCorresponde = !dataInicio || data >= dataInicio;

            const fimCorresponde = !dataFim || data <= dataFim;

            return (
                alunoCorresponde &&
                situacaoCorresponde &&
                inicioCorresponde &&
                fimCorresponde
            );
        });
    }, [
        frequencias,
        filtroAluno,
        filtroSituacao,
        dataInicio,
        dataFim,
        periodoInvalido,
    ]);

    // ==========================================
    // TOTALIZADORES
    // ==========================================

    const resumo = useMemo(
        () => ({
            total: frequenciasFiltradas.length,

            presencas: frequenciasFiltradas.filter(
                (item) => item.situacao === "PRESENTE",
            ).length,

            ausencias: frequenciasFiltradas.filter(
                (item) => item.situacao === "AUSENTE",
            ).length,

            justificadas: frequenciasFiltradas.filter(
                (item) => item.situacao === "JUSTIFICADA",
            ).length,
        }),
        [frequenciasFiltradas],
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
        setFrequencias([]);
        setCarregando(true);
        setErro("");

        setVersaoConsulta((anterior) => anterior + 1);
    }

    function limparFiltros() {
        setFiltroAluno("");
        setFiltroSituacao("");
        setDataInicio("");
        setDataFim("");
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="frequencias-pagina">
            <section className="frequencias-introducao">
                <h2>Frequências escolares</h2>

                <p>
                    Consulte presenças, ausências e ausências justificadas dos
                    estudantes.
                </p>
            </section>

            {/* ======================================
          CARTÕES
      ====================================== */}

            <section className="frequencias-resumo">
                <article className="frequencias-resumo-cartao">
                    <span>Total de registros</span>
                    <strong>{resumo.total}</strong>
                </article>

                <article className="frequencias-resumo-cartao">
                    <span>Presenças</span>
                    <strong>{resumo.presencas}</strong>
                </article>

                <article className="frequencias-resumo-cartao">
                    <span>Ausências</span>
                    <strong>{resumo.ausencias}</strong>
                </article>

                <article className="frequencias-resumo-cartao">
                    <span>Justificadas</span>
                    <strong>{resumo.justificadas}</strong>
                </article>
            </section>

            {/* ======================================
          PAINEL
      ====================================== */}

            <section className="frequencias-painel">
                <div className="frequencias-painel-topo">
                    <h3>Consultar registros</h3>

                    <button
                        type="button"
                        className="frequencias-botao-primario"
                        onClick={atualizarLista}
                        disabled={carregando}
                    >
                        Atualizar lista
                    </button>
                </div>

                {/* ====================================
            FILTROS
        ==================================== */}

                <div className="frequencias-filtros">
                    <div className="frequencias-campo">
                        <label htmlFor="freq-aluno">Aluno</label>

                        <select
                            id="freq-aluno"
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

                    <div className="frequencias-campo">
                        <label htmlFor="freq-situacao">Situação</label>

                        <select
                            id="freq-situacao"
                            value={filtroSituacao}
                            onChange={(evento) => {
                                setFiltroSituacao(evento.target.value);
                            }}
                        >
                            <option value="">Todas</option>
                            <option value="PRESENTE">Presente</option>
                            <option value="AUSENTE">Ausente</option>
                            <option value="JUSTIFICADA">
                                Ausência justificada
                            </option>
                        </select>
                    </div>

                    <div className="frequencias-campo">
                        <label htmlFor="freq-inicio">Data inicial</label>

                        <input
                            id="freq-inicio"
                            type="date"
                            value={dataInicio}
                            onChange={(evento) => {
                                setDataInicio(evento.target.value);
                            }}
                        />
                    </div>

                    <div className="frequencias-campo">
                        <label htmlFor="freq-fim">Data final</label>

                        <input
                            id="freq-fim"
                            type="date"
                            value={dataFim}
                            onChange={(evento) => {
                                setDataFim(evento.target.value);
                            }}
                        />
                    </div>
                </div>

                {/* ====================================
            STATUS DO CATÁLOGO
        ==================================== */}

                <div className="catalogo-alunos-status">
                    {carregandoAlunos ? (
                        <p role="status">Carregando nomes dos alunos...</p>
                    ) : erroAlunos ? (
                        <p role="status">
                            Os nomes não puderam ser carregados. Os IDs
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

                <div className="frequencias-filtros-rodape">
                    <span>
                        {frequenciasFiltradas.length}
                        {" registro(s) encontrado(s)"}
                    </span>

                    <button
                        type="button"
                        className="frequencias-botao-secundario"
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
                        className="frequencias-mensagem frequencias-mensagem--erro"
                        role="alert"
                    >
                        A data inicial não pode ser posterior à data final.
                    </p>
                )}

                {carregando && (
                    <p className="frequencias-mensagem" role="status">
                        Carregando frequências...
                    </p>
                )}

                {erro && (
                    <p
                        className="frequencias-mensagem frequencias-mensagem--erro"
                        role="alert"
                    >
                        {erro}
                    </p>
                )}

                {!carregando && !erro && frequencias.length === 0 && (
                    <p className="frequencias-mensagem">
                        Nenhuma frequência disponível para sua conta.
                    </p>
                )}

                {!periodoInvalido &&
                    !carregando &&
                    !erro &&
                    frequencias.length > 0 &&
                    frequenciasFiltradas.length === 0 && (
                        <p className="frequencias-mensagem">
                            Nenhum registro corresponde aos filtros.
                        </p>
                    )}

                {/* ====================================
            TABELA
        ==================================== */}

                {!periodoInvalido &&
                    !carregando &&
                    !erro &&
                    frequenciasFiltradas.length > 0 && (
                        <div className="frequencias-tabela-container">
                            <table className="frequencias-tabela">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Aluno</th>
                                        <th>Data</th>
                                        <th>Situação</th>
                                        <th>Observação</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {frequenciasFiltradas.map((item) => {
                                        const aluno = alunosPorId.get(
                                            String(item.aluno_id),
                                        );

                                        return (
                                            <tr key={item.id}>
                                                <td>{textoOuTraco(item.id)}</td>

                                                <td>
                                                    <div className="catalogo-aluno-celula">
                                                        <strong>
                                                            {nomeDoAluno(
                                                                item.aluno_id,
                                                            )}
                                                        </strong>

                                                        <small>
                                                            {aluno?.codigo_aluno ||
                                                                `Aluno ID ${item.aluno_id}`}
                                                        </small>
                                                    </div>
                                                </td>

                                                <td>
                                                    {formatarData(item.data)}
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            `frequencias-status ` +
                                                            `frequencias-status--${item.situacao}`
                                                        }
                                                    >
                                                        {formatarSituacao(
                                                            item.situacao,
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    {textoOuTraco(
                                                        item.observacao,
                                                    )}
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="frequencias-botao-detalhes"
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
                <section className="frequencias-detalhes">
                    <div className="frequencias-detalhes-topo">
                        <h3>Detalhes da frequência</h3>

                        <button
                            type="button"
                            className="frequencias-botao-secundario"
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
                            className="frequencias-mensagem frequencias-mensagem--erro"
                            role="alert"
                        >
                            {detalheErro}
                        </p>
                    )}

                    {detalhe && (
                        <div className="frequencias-detalhes-grade">
                            <div>
                                <span>ID do registro</span>
                                <strong>{textoOuTraco(detalhe.id)}</strong>
                            </div>

                            <div>
                                <span>Aluno</span>
                                <strong>{nomeDoAluno(detalhe.aluno_id)}</strong>
                            </div>

                            <div>
                                <span>ID do aluno</span>
                                <strong>
                                    {textoOuTraco(detalhe.aluno_id)}
                                </strong>
                            </div>

                            <div>
                                <span>Data</span>
                                <strong>{formatarData(detalhe.data)}</strong>
                            </div>

                            <div>
                                <span>Situação</span>
                                <strong>
                                    {formatarSituacao(detalhe.situacao)}
                                </strong>
                            </div>

                            <div className="frequencias-detalhe-amplo">
                                <span>Observação</span>
                                <strong>
                                    {textoOuTraco(detalhe.observacao)}
                                </strong>
                            </div>

                            <div className="frequencias-detalhe-amplo">
                                <span>Registrado em</span>
                                <strong>
                                    {textoOuTraco(detalhe.registrado_em)}
                                </strong>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default Frequencias;
