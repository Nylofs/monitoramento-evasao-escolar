import { useEffect, useState } from "react";

import SeletorAluno from "../components/SeletorAluno";
import SeletorTurma from "../components/SeletorTurma";

import {
    consultarIndicadorAluno,
    consultarIndicadorTurma,
} from "../services/indicadorService";

// ==========================================
// FUNÇÕES DE FORMATAÇÃO
// ==========================================

function formatarNumero(valor) {
    const numero = Number(valor ?? 0);

    if (!Number.isFinite(numero)) {
        return "Não informado";
    }

    return numero.toLocaleString("pt-BR");
}

function formatarPercentual(valor) {
    if (valor === null || valor === undefined) {
        return "Sem registros";
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "Não disponível";
    }

    return (
        numero.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + "%"
    );
}

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

// ==========================================
// TRATAMENTO DE ERROS
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
        return "Os parâmetros informados são inválidos.";
    }

    return erro.message || "Falha ao consultar indicadores.";
}

// ==========================================
// CARTÃO DE INDICADOR
// ==========================================

function CartaoIndicador({ titulo, valor, descricao }) {
    return (
        <article className="indicadores-cartao">
            <span>{titulo}</span>
            <strong>{valor}</strong>
            <p>{descricao}</p>
        </article>
    );
}

// ==========================================
// GRÁFICO DE PERCENTUAL
// ==========================================

function BarraPercentual({ titulo, percentual, cor }) {
    const numero = Number(percentual);

    const valido =
        percentual !== null &&
        percentual !== undefined &&
        Number.isFinite(numero);

    const largura = valido ? Math.max(0, Math.min(100, numero)) : 0;

    return (
        <div className="indicadores-barra-item">
            <div className="indicadores-barra-titulo">
                <span>{titulo}</span>

                <strong>{formatarPercentual(percentual)}</strong>
            </div>

            <div
                className="indicadores-barra-trilho"
                role="img"
                aria-label={`${titulo}: ${formatarPercentual(percentual)}`}
            >
                <div
                    className="indicadores-barra-preenchimento"
                    style={{
                        width: `${largura}%`,
                        backgroundColor: cor,
                    }}
                />
            </div>
        </div>
    );
}

// ==========================================
// RESULTADO INDIVIDUAL
// ==========================================

function ResultadoAluno({ dados }) {
    const resumo = dados.resumo;
    const percentuais = dados.percentuais;

    return (
        <div className="indicadores-resultado">
            <section className="indicadores-identificacao">
                <span>INDICADOR INDIVIDUAL</span>

                <h3>{dados.nome_aluno}</h3>

                <p>
                    Código: {dados.codigo_aluno}
                    {" · "}
                    Aluno ID {dados.aluno_id}
                </p>

                <p>
                    Turma: {dados.nome_turma}
                    {" · "}
                    Escola: {dados.nome_escola}
                </p>

                <p>
                    Período: {formatarData(dados.periodo?.data_inicio)}
                    {" até "}
                    {formatarData(dados.periodo?.data_fim)}
                </p>
            </section>

            <section className="indicadores-cartoes">
                <CartaoIndicador
                    titulo="Total de registros"
                    valor={formatarNumero(resumo.total_registros)}
                    descricao="Lançamentos considerados."
                />

                <CartaoIndicador
                    titulo="Presenças"
                    valor={formatarNumero(resumo.total_presencas)}
                    descricao="Registros PRESENTE."
                />

                <CartaoIndicador
                    titulo="Ausências"
                    valor={formatarNumero(resumo.total_ausencias)}
                    descricao="Registros AUSENTE."
                />

                <CartaoIndicador
                    titulo="Justificadas"
                    valor={formatarNumero(resumo.total_justificadas)}
                    descricao="Registros JUSTIFICADA."
                />
            </section>

            <section className="indicadores-painel">
                <h3>Percentuais de frequência</h3>

                {!dados.possui_registros && (
                    <p className="indicadores-sem-dados">
                        Não existem registros de frequência para este aluno no
                        período consultado. Isso não significa 0% de presença.
                    </p>
                )}

                <div className="indicadores-grafico">
                    <BarraPercentual
                        titulo="Presença"
                        percentual={percentuais.percentual_presenca}
                        cor="#16816a"
                    />

                    <BarraPercentual
                        titulo="Ausência não justificada"
                        percentual={percentuais.percentual_ausencia}
                        cor="#c15757"
                    />

                    <BarraPercentual
                        titulo="Ausência justificada"
                        percentual={percentuais.percentual_justificada}
                        cor="#d49a37"
                    />

                    <BarraPercentual
                        titulo="Ausência total"
                        percentual={percentuais.percentual_ausencia_total}
                        cor="#64748b"
                    />
                </div>

                <p className="indicadores-nota">
                    Ausência total reúne as ausências justificadas e não
                    justificadas. Não deve ser somada novamente às outras
                    barras.
                </p>
            </section>
        </div>
    );
}

// ==========================================
// RESULTADO COLETIVO
// ==========================================

function ResultadoTurma({ dados }) {
    return (
        <div className="indicadores-resultado">
            <section className="indicadores-identificacao">
                <span>INDICADOR COLETIVO</span>

                <h3>{dados.nome_turma}</h3>

                <p>
                    Turma ID {dados.turma_id}
                    {" · "}
                    Escola ID {dados.escola_id}
                </p>

                <p>
                    Período: {formatarData(dados.periodo?.data_inicio)}
                    {" até "}
                    {formatarData(dados.periodo?.data_fim)}
                </p>
            </section>

            <section className="indicadores-cartoes">
                <CartaoIndicador
                    titulo="Alunos ativos"
                    valor={formatarNumero(dados.total_alunos)}
                    descricao="Alunos considerados na turma."
                />

                <CartaoIndicador
                    titulo="Com registros"
                    valor={formatarNumero(dados.alunos_com_registros)}
                    descricao="Alunos com lançamentos no período."
                />

                <CartaoIndicador
                    titulo="Sem registros"
                    valor={formatarNumero(dados.alunos_sem_registros)}
                    descricao="Alunos sem lançamentos no período."
                />

                <CartaoIndicador
                    titulo="Média de presença"
                    valor={formatarPercentual(dados.media_percentual_presenca)}
                    descricao="Média dos percentuais individuais válidos."
                />
            </section>

            <section className="indicadores-painel">
                <h3>Média de presença da turma</h3>

                {dados.media_percentual_presenca == null ? (
                    <p className="indicadores-sem-dados">
                        Não existem registros suficientes para calcular a média
                        da turma.
                    </p>
                ) : (
                    <div className="indicadores-grafico">
                        <BarraPercentual
                            titulo="Média percentual de presença"
                            percentual={dados.media_percentual_presenca}
                            cor="#2563a6"
                        />
                    </div>
                )}

                <p className="indicadores-nota">
                    A média é calculada pelo FastAPI, considerando os
                    percentuais individuais dos alunos ativos com registros.
                </p>
            </section>
        </div>
    );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

function Indicadores({ token }) {
    // ========================================
    // FORMULÁRIO
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
    // ALTERAR TIPO DE CONSULTA
    // ========================================

    function mudarTipo(novoTipo) {
        setTipo(novoTipo);
        setIdentificador("");
        setConsulta(null);
        setResultado(null);
        setErro("");
    }

    // ========================================
    // ALTERAR ALUNO OU TURMA
    // ========================================

    function alterarIdentificador(novoId) {
        setIdentificador(novoId);

        // Remove o resultado da seleção anterior.
        // A limpeza de consulta também cancela
        // a requisição pendente pelo useEffect.
        setConsulta(null);
        setResultado(null);
        setErro("");
    }

    // ========================================
    // ENVIAR CONSULTA
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

        // Novo objeto para permitir repetir a consulta.
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

        async function carregarIndicador() {
            setCarregando(true);
            setResultado(null);
            setErro("");

            try {
                let dados;

                if (consulta.tipo === "aluno") {
                    dados = await consultarIndicadorAluno({
                        alunoId: consulta.id,
                        dataInicio: consulta.dataInicio,
                        dataFim: consulta.dataFim,
                        token,
                        signal: controller.signal,
                    });
                } else {
                    dados = await consultarIndicadorTurma({
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

        carregarIndicador();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [consulta, token]);

    // ========================================
    // LIMPAR
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
        <div className="indicadores-pagina">
            <section className="indicadores-introducao">
                <h2>Indicadores escolares</h2>

                <p>
                    Consulte os indicadores de frequência calculados pelo
                    FastAPI para um aluno ou uma turma.
                </p>
            </section>

            <section className="indicadores-filtros">
                <h3>Tipo de consulta</h3>

                <div
                    className="indicadores-tipos"
                    role="group"
                    aria-label="Tipo de indicador"
                >
                    <button
                        type="button"
                        aria-pressed={tipo === "aluno"}
                        className={
                            tipo === "aluno"
                                ? "indicadores-tipo indicadores-tipo--ativo"
                                : "indicadores-tipo"
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
                                ? "indicadores-tipo indicadores-tipo--ativo"
                                : "indicadores-tipo"
                        }
                        onClick={() => mudarTipo("turma")}
                    >
                        Por turma
                    </button>
                </div>

                <form onSubmit={enviarConsulta}>
                    <div className="indicadores-campos">
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

                        <div className="indicadores-campo">
                            <label htmlFor="indicador-inicio">
                                Data inicial
                            </label>

                            <input
                                id="indicador-inicio"
                                type="date"
                                value={dataInicio}
                                onChange={(evento) => {
                                    setDataInicio(evento.target.value);
                                    setConsulta(null);
                                    setResultado(null);
                                }}
                            />
                        </div>

                        <div className="indicadores-campo">
                            <label htmlFor="indicador-fim">Data final</label>

                            <input
                                id="indicador-fim"
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

                    <div className="indicadores-acoes">
                        <button
                            type="submit"
                            className="indicadores-botao-primario"
                            disabled={carregando}
                        >
                            {carregando
                                ? "Consultando..."
                                : "Consultar indicadores"}
                        </button>

                        <button
                            type="button"
                            className="indicadores-botao-secundario"
                            onClick={limparConsulta}
                        >
                            Limpar
                        </button>
                    </div>
                </form>

                <p className="indicadores-ajuda">
                    Selecione um registro autorizado. Deixe as datas vazias para
                    considerar todo o histórico disponível.
                </p>
            </section>

            {carregando && (
                <p className="indicadores-mensagem" role="status">
                    Consultando os indicadores no FastAPI...
                </p>
            )}

            {erro && (
                <p
                    className="indicadores-mensagem indicadores-mensagem--erro"
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {!consulta && !erro && (
                <p className="indicadores-mensagem">
                    Selecione Aluno ou Turma, escolha o registro pelo nome e
                    clique em Consultar indicadores.
                </p>
            )}

            {resultado &&
                !carregando &&
                (resultado.tipo === "aluno" ? (
                    <ResultadoAluno dados={resultado.dados} />
                ) : (
                    <ResultadoTurma dados={resultado.dados} />
                ))}
        </div>
    );
}

export default Indicadores;
