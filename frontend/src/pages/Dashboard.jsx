import { useEffect, useState } from "react";

import SeletorEscola from "../components/SeletorEscola";

import { consultarDashboardEscola } from "../services/dashboardService";

// ============================================
// FORMATAÇÃO DE NÚMEROS
// ============================================

function formatarNumero(valor) {
    const numero = Number(valor ?? 0);

    if (!Number.isFinite(numero)) {
        return "Não informado";
    }

    return numero.toLocaleString("pt-BR");
}

// ============================================
// FORMATAÇÃO DE PERCENTUAIS
// ============================================

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

// ============================================
// FORMATAÇÃO DE DATA
// ============================================

function formatarData(valor) {
    if (!valor) {
        return "Sem limite";
    }

    const partes = String(valor).slice(0, 10).split("-");

    if (partes.length !== 3) {
        return String(valor);
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// ============================================
// CARTÃO DE INDICADOR
// ============================================

function CartaoIndicador({ titulo, valor, descricao, icone }) {
    return (
        <article className="dashboard-cartao">
            <div className="dashboard-cartao-topo">
                <span>{titulo}</span>

                <span aria-hidden="true">{icone}</span>
            </div>

            <strong>{valor}</strong>

            <p>{descricao}</p>
        </article>
    );
}

// ============================================
// BARRA DO GRÁFICO
// ============================================

function BarraGrafico({ nome, quantidade, percentual, cor }) {
    const numero = Number(percentual);

    const largura =
        percentual === null ||
        percentual === undefined ||
        !Number.isFinite(numero)
            ? 0
            : Math.min(100, Math.max(0, numero));

    return (
        <div className="dashboard-barra-item">
            <div className="dashboard-barra-topo">
                <span>{nome}</span>

                <strong>
                    {formatarNumero(quantidade)}
                    {" · "}
                    {formatarPercentual(percentual)}
                </strong>
            </div>

            <div
                className="dashboard-barra-trilho"
                role="img"
                aria-label={
                    `${nome}: ${formatarNumero(quantidade)}, ` +
                    `${formatarPercentual(percentual)}`
                }
            >
                <div
                    className="dashboard-barra-preenchimento"
                    style={{
                        width: `${largura}%`,
                        backgroundColor: cor,
                    }}
                />
            </div>
        </div>
    );
}

// ============================================
// MENSAGENS DE ERRO
// ============================================

function mensagemDeErro(falha) {
    if (falha.status === 401) {
        return (
            "Sua autenticação foi rejeitada ou expirou. " +
            "Saia do sistema e faça login novamente."
        );
    }

    if (falha.status === 403) {
        return "Você não possui permissão para " + "consultar esta escola.";
    }

    if (falha.status === 404) {
        return "Escola não encontrada ou sem acesso.";
    }

    if (falha.status === 400) {
        return falha.message || "Período inválido.";
    }

    if (falha.status === 422) {
        return "Os parâmetros informados são inválidos.";
    }

    return falha.message || "Não foi possível consultar o Dashboard.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function Dashboard({ token }) {
    // ==========================================
    // CAMPOS DO FORMULÁRIO
    // ==========================================

    const [escolaId, setEscolaId] = useState("");

    const [dataInicio, setDataInicio] = useState("");

    const [dataFim, setDataFim] = useState("");

    // ==========================================
    // CONSULTA CONFIRMADA
    // ==========================================

    const [consulta, setConsulta] = useState(null);

    // ==========================================
    // RESULTADO DA API
    // ==========================================

    const [dashboard, setDashboard] = useState(null);

    const [carregando, setCarregando] = useState(false);

    const [erro, setErro] = useState("");

    // ==========================================
    // QUANDO O USUÁRIO ALTERA A ESCOLA
    // ==========================================

    function alterarEscola(novoId) {
        setEscolaId(novoId);

        // O resultado anterior pertence à
        // escola consultada anteriormente.
        // Não devemos mantê-lo como resultado
        // da nova seleção.
        setConsulta(null);
        setDashboard(null);
        setErro("");
        setCarregando(false);
    }

    // ==========================================
    // ENVIAR O FORMULÁRIO
    // ==========================================

    function enviarConsulta(evento) {
        evento.preventDefault();

        setErro("");

        const id = Number(escolaId);

        if (!escolaId || !Number.isSafeInteger(id) || id <= 0) {
            setConsulta(null);
            setDashboard(null);

            setErro("Selecione uma escola válida.");

            return;
        }

        if (dataInicio && dataFim && dataInicio > dataFim) {
            setConsulta(null);
            setDashboard(null);

            setErro("A data inicial não pode ser posterior à final.");

            return;
        }

        // Novo objeto para executar a consulta
        // mesmo quando os filtros se repetem.
        setConsulta({
            escolaId: id,
            dataInicio,
            dataFim,
        });
    }

    // ==========================================
    // CONSULTAR O DASHBOARD NO FASTAPI
    // ==========================================

    useEffect(() => {
        if (!consulta) {
            return;
        }

        const controller = new AbortController();

        let ativo = true;

        async function carregarDashboard() {
            setCarregando(true);
            setErro("");
            setDashboard(null);

            try {
                const dados = await consultarDashboardEscola({
                    escolaId: consulta.escolaId,
                    dataInicio: consulta.dataInicio,
                    dataFim: consulta.dataFim,
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setDashboard(dados);
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setDashboard(null);
                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarDashboard();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [consulta, token]);

    // ==========================================
    // LIMPAR A CONSULTA
    // ==========================================

    function limparConsulta() {
        setEscolaId("");
        setDataInicio("");
        setDataFim("");

        setConsulta(null);
        setDashboard(null);

        setErro("");
        setCarregando(false);
    }

    // ==========================================
    // PREPARAÇÃO DOS DADOS
    // ==========================================

    const escola = dashboard?.escola;

    const frequencia = dashboard?.frequencia;

    const alertas = dashboard?.alertas;

    const intervencoes = dashboard?.intervencoes;

    const totalAlunos = escola?.total_alunos_ativos ?? 0;

    const totalRegistros = frequencia?.resumo?.total_registros ?? 0;

    const totalIntervencoes = intervencoes?.total_intervencoes ?? 0;

    // ==========================================
    // GRÁFICO DE FREQUÊNCIA
    // ==========================================

    const dadosFrequencia = frequencia
        ? [
              {
                  nome: "Presenças",
                  quantidade: frequencia.resumo?.total_presencas ?? 0,
                  percentual: frequencia.percentuais?.percentual_presenca,
                  cor: "#16816a",
              },
              {
                  nome: "Ausências não justificadas",
                  quantidade: frequencia.resumo?.total_ausencias ?? 0,
                  percentual: frequencia.percentuais?.percentual_ausencia,
                  cor: "#c15757",
              },
              {
                  nome: "Ausências justificadas",
                  quantidade: frequencia.resumo?.total_justificadas ?? 0,
                  percentual: frequencia.percentuais?.percentual_justificada,
                  cor: "#d49a37",
              },
          ]
        : [];

    // ==========================================
    // GRÁFICO DE ALERTAS
    // ==========================================

    const dadosAlertas = alertas
        ? [
              {
                  nome: "Regular",
                  quantidade: alertas.total_regular ?? 0,
                  cor: "#16816a",
              },
              {
                  nome: "Atenção",
                  quantidade: alertas.total_atencao ?? 0,
                  cor: "#d49a37",
              },
              {
                  nome: "Prioritário",
                  quantidade: alertas.total_prioritario ?? 0,
                  cor: "#c15757",
              },
              {
                  nome: "Dados insuficientes",
                  quantidade: alertas.total_dados_insuficientes ?? 0,
                  cor: "#8393a9",
              },
              {
                  nome: "Sem dados",
                  quantidade: alertas.total_sem_dados ?? 0,
                  cor: "#aeb8c6",
              },
          ]
        : [];

    // ==========================================
    // GRÁFICO DE INTERVENÇÕES
    // ==========================================

    const dadosIntervencoes = intervencoes
        ? [
              {
                  nome: "Abertas",
                  quantidade: intervencoes.total_abertas ?? 0,
                  cor: "#c15757",
              },
              {
                  nome: "Em andamento",
                  quantidade: intervencoes.total_em_andamento ?? 0,
                  cor: "#d49a37",
              },
              {
                  nome: "Concluídas",
                  quantidade: intervencoes.total_concluidas ?? 0,
                  cor: "#16816a",
              },
          ]
        : [];

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="dashboard-pagina">
            {/* ======================================
          INTRODUÇÃO
      ====================================== */}

            <section className="dashboard-introducao">
                <h2>Dashboard Escolar</h2>

                <p>
                    Selecione uma escola e consulte os indicadores de
                    frequência, alertas e intervenções.
                </p>
            </section>

            {/* ======================================
          FILTROS
      ====================================== */}

            <section className="dashboard-filtros">
                <h3>Filtros da consulta</h3>

                <form onSubmit={enviarConsulta}>
                    <div className="dashboard-filtros-grade">
                        {/* NOVO COMPONENTE */}

                        <SeletorEscola
                            token={token}
                            valor={escolaId}
                            onChange={alterarEscola}
                            disabled={carregando}
                        />

                        <div className="dashboard-campo">
                            <label htmlFor="dashboard-inicio">
                                Data inicial
                            </label>

                            <input
                                id="dashboard-inicio"
                                type="date"
                                value={dataInicio}
                                onChange={(evento) => {
                                    setDataInicio(evento.target.value);
                                }}
                            />
                        </div>

                        <div className="dashboard-campo">
                            <label htmlFor="dashboard-fim">Data final</label>

                            <input
                                id="dashboard-fim"
                                type="date"
                                value={dataFim}
                                onChange={(evento) => {
                                    setDataFim(evento.target.value);
                                }}
                            />
                        </div>
                    </div>

                    <div className="dashboard-filtros-acoes">
                        <button
                            type="submit"
                            className="dashboard-botao-primario"
                            disabled={carregando}
                        >
                            {carregando
                                ? "Consultando..."
                                : "Consultar Dashboard"}
                        </button>

                        <button
                            type="button"
                            className="dashboard-botao-secundario"
                            onClick={limparConsulta}
                        >
                            Limpar
                        </button>
                    </div>
                </form>

                <p className="dashboard-filtro-observacao">
                    A lista apresenta as escolas retornadas pelo FastAPI para a
                    conta autenticada. Deixe as datas vazias para consultar o
                    histórico disponível.
                </p>
            </section>

            {/* ======================================
          MENSAGENS DE ESTADO
      ====================================== */}

            {carregando && (
                <div className="dashboard-mensagem" role="status">
                    Consultando informações no FastAPI...
                </div>
            )}

            {erro && (
                <div
                    className={
                        "dashboard-mensagem " + "dashboard-mensagem--erro"
                    }
                    role="alert"
                >
                    {erro}
                </div>
            )}

            {!consulta && !erro && (
                <div className="dashboard-mensagem">
                    Selecione uma escola, informe o período desejado e clique em
                    Consultar Dashboard.
                </div>
            )}

            {/* ======================================
          RESULTADOS
      ====================================== */}

            {dashboard && !carregando && (
                <div className="dashboard-resultados">
                    {/* IDENTIFICAÇÃO DA ESCOLA */}

                    <section className="dashboard-escola">
                        <h3>{escola?.nome_escola || "Escola selecionada"}</h3>

                        <p>
                            Escola ID: {escola?.escola_id ?? consulta.escolaId}
                        </p>

                        <p>
                            Período:{" "}
                            {formatarData(dashboard.periodo?.data_inicio)}
                            {" até "}
                            {formatarData(dashboard.periodo?.data_fim)}
                        </p>
                    </section>

                    {/* CARTÕES PRINCIPAIS */}

                    <section className="dashboard-cartoes">
                        <CartaoIndicador
                            titulo="Turmas ativas"
                            valor={formatarNumero(escola?.total_turmas_ativas)}
                            descricao="Turmas atualmente ativas."
                            icone="🏫"
                        />

                        <CartaoIndicador
                            titulo="Alunos ativos"
                            valor={formatarNumero(totalAlunos)}
                            descricao="Alunos em turmas ativas."
                            icone="🎓"
                        />

                        <CartaoIndicador
                            titulo="Presença geral"
                            valor={formatarPercentual(
                                frequencia?.percentuais?.percentual_presenca,
                            )}
                            descricao="Percentual sobre os registros lançados."
                            icone="📅"
                        />

                        <CartaoIndicador
                            titulo="Requerem acompanhamento"
                            valor={formatarNumero(
                                alertas?.total_requer_acompanhamento,
                            )}
                            descricao="Níveis Atenção e Prioritário."
                            icone="⚠️"
                        />
                    </section>

                    {/* FREQUÊNCIA */}

                    <section className="dashboard-painel">
                        <h3>Frequência escolar</h3>

                        <p className="dashboard-painel-subtitulo">
                            {formatarNumero(totalRegistros)}
                            {" registros de frequência no período"}
                        </p>

                        {totalRegistros === 0 ? (
                            <p className="dashboard-sem-dados">
                                Não existem registros de frequência para os
                                alunos considerados neste período.
                            </p>
                        ) : (
                            <div className="dashboard-grafico">
                                {dadosFrequencia.map((item) => (
                                    <BarraGrafico
                                        key={item.nome}
                                        nome={item.nome}
                                        quantidade={item.quantidade}
                                        percentual={item.percentual}
                                        cor={item.cor}
                                    />
                                ))}
                            </div>
                        )}

                        <p className="dashboard-nota">
                            Alunos com registros:{" "}
                            <strong>
                                {formatarNumero(
                                    frequencia?.alunos_com_registros,
                                )}
                            </strong>
                            {" · "}
                            Alunos sem registros:{" "}
                            <strong>
                                {formatarNumero(
                                    frequencia?.alunos_sem_registros,
                                )}
                            </strong>
                        </p>
                    </section>

                    {/* ALERTAS */}

                    <section className="dashboard-painel">
                        <h3>Distribuição de alertas</h3>

                        <p className="dashboard-painel-subtitulo">
                            Classificação dos alunos ativos.
                            {" Mínimo de "}
                            {formatarNumero(alertas?.minimo_registros)}
                            {" registros para aplicar os níveis."}
                        </p>

                        {totalAlunos === 0 ? (
                            <p className="dashboard-sem-dados">
                                Não existem alunos ativos para classificar.
                            </p>
                        ) : (
                            <div className="dashboard-grafico">
                                {dadosAlertas.map((item) => (
                                    <BarraGrafico
                                        key={item.nome}
                                        nome={item.nome}
                                        quantidade={item.quantidade}
                                        percentual={
                                            (item.quantidade / totalAlunos) *
                                            100
                                        }
                                        cor={item.cor}
                                    />
                                ))}
                            </div>
                        )}

                        <p className="dashboard-nota">
                            Os alertas são critérios operacionais de
                            acompanhamento, não previsões definitivas de evasão
                            escolar.
                        </p>
                    </section>

                    {/* INTERVENÇÕES */}

                    <section className="dashboard-painel">
                        <h3>Intervenções escolares</h3>

                        <p className="dashboard-painel-subtitulo">
                            {formatarNumero(totalIntervencoes)}
                            {" intervenções consideradas no período."}
                        </p>

                        {totalIntervencoes === 0 ? (
                            <p className="dashboard-sem-dados">
                                Nenhuma intervenção encontrada para a consulta
                                realizada.
                            </p>
                        ) : (
                            <div className="dashboard-grafico">
                                {dadosIntervencoes.map((item) => (
                                    <BarraGrafico
                                        key={item.nome}
                                        nome={item.nome}
                                        quantidade={item.quantidade}
                                        percentual={
                                            (item.quantidade /
                                                totalIntervencoes) *
                                            100
                                        }
                                        cor={item.cor}
                                    />
                                ))}
                            </div>
                        )}

                        <p className="dashboard-nota">
                            Os status apresentados são os atuais dos registros
                            selecionados pelo período.
                        </p>
                    </section>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
