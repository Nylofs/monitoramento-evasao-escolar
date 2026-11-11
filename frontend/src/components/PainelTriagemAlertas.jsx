import { useEffect, useMemo, useState } from "react";

import {
    listarAlunosParaTriagem,
    consultarAlertasDoAluno,
} from "../services/triagemAlertaService";

// ============================================
// ETAPA 15 - PARTE 31
// PAINEL DE TRIAGEM DE ALERTAS
//
// CONSULTA POR ALUNO
// ============================================

// ============================================
// TRATAMENTO DE ERROS HTTP
// ============================================

function mensagemDeErro(erro) {
    const detalhe = erro.detalhes?.detail;

    if (erro.status === 401) {
        return "Sessão inválida ou expirada. " + "Faça login novamente.";
    }

    if (erro.status === 403) {
        return (
            "Você não possui permissão para " + "consultar essas informações."
        );
    }

    if (erro.status === 404) {
        return typeof detalhe === "string"
            ? detalhe
            : "Não foi encontrado um resultado " +
                  "acessível para esta consulta.";
    }

    if (erro.status === 422) {
        if (Array.isArray(detalhe)) {
            return detalhe
                .map((item) => {
                    const campo = Array.isArray(item.loc)
                        ? item.loc.join(".")
                        : "Campo";

                    return `${campo}: ${item.msg}`;
                })
                .join(" | ");
        }

        return "O FastAPI rejeitou os parâmetros " + "da consulta.";
    }

    if (erro.status >= 500) {
        return (
            "O backend encontrou um erro interno. " +
            "Consulte o terminal do Uvicorn."
        );
    }

    return erro.message || "Não foi possível consultar o FastAPI.";
}

// ============================================
// FORMATAR NOMES DOS CAMPOS
// ============================================

function formatarNomeCampo(chave) {
    const nomes = {
        id: "ID",
        aluno_id: "ID do aluno",
        nome: "Nome",
        nome_aluno: "Nome do aluno",
        turma_id: "ID da turma",
        status: "Status",
        etapa: "Etapa",
        nivel_risco: "Nível de risco",
        risco: "Risco",
        risco_evasao: "Risco de evasão",
        descricao: "Descrição",
        motivo: "Motivo",
        motivos: "Motivos",
        percentual_presenca: "Percentual de presença",
        criado_em: "Criado em",
        data: "Data",
    };

    if (nomes[chave]) {
        return nomes[chave];
    }

    const texto = String(chave).replaceAll("_", " ");

    return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}

// ============================================
// FORMATAR VALORES DA RESPOSTA
// ============================================

function formatarValor(valor) {
    if (valor === null || valor === undefined) {
        return "Não informado";
    }

    if (typeof valor === "boolean") {
        return valor ? "Sim" : "Não";
    }

    if (typeof valor === "object") {
        return JSON.stringify(valor, null, 2);
    }

    const texto = String(valor);

    // Formata somente datas no formato ISO
    // sem modificar outros textos.

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        const [ano, mes, dia] = texto.split("-");

        return `${dia}/${mes}/${ano}`;
    }

    return texto;
}

// ============================================
// EXTRAIR REGISTROS DA RESPOSTA
//
// A API pode retornar um objeto ou uma lista.
// Não inventamos campos nem identificadores.
// ============================================

function obterRegistros(resposta) {
    if (resposta === null || resposta === undefined) {
        return [];
    }

    if (Array.isArray(resposta)) {
        return resposta;
    }

    return [resposta];
}

// ============================================
// EXTRAIR CAMPOS PARA EXIBIÇÃO
// ============================================

function obterCampos(registro) {
    if (
        registro !== null &&
        typeof registro === "object" &&
        !Array.isArray(registro)
    ) {
        return Object.entries(registro);
    }

    return [["resultado", registro]];
}

// ============================================
// IDENTIFICAR ALUNO
// ============================================

function identificarAluno(aluno) {
    const nome = aluno.nome || `Aluno ID ${aluno.id}`;

    const matricula = aluno.matricula || aluno.codigo || "";

    const turma =
        aluno.turma_id !== null && aluno.turma_id !== undefined
            ? `Turma ${aluno.turma_id}`
            : "";

    return [nome, matricula, turma].filter(Boolean).join(" — ");
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function PainelTriagemAlertas({ token }) {
    // ==========================================
    // LISTAGEM DE ALUNOS
    // ==========================================

    const [alunos, setAlunos] = useState([]);

    const [carregandoAlunos, setCarregandoAlunos] = useState(true);

    const [versaoLista, setVersaoLista] = useState(0);

    // ==========================================
    // FILTROS
    // ==========================================

    const [pesquisa, setPesquisa] = useState("");

    const [turmaFiltro, setTurmaFiltro] = useState("");

    // ==========================================
    // ALUNO SELECIONADO
    // ==========================================

    const [alunoId, setAlunoId] = useState("");

    // ==========================================
    // CONSULTA DE ALERTAS
    // ==========================================

    const [resultado, setResultado] = useState(null);

    const [carregandoAlerta, setCarregandoAlerta] = useState(false);

    const [versaoAlerta, setVersaoAlerta] = useState(0);

    // ==========================================
    // MENSAGENS
    // ==========================================

    const [erroLista, setErroLista] = useState("");

    const [erroAlerta, setErroAlerta] = useState("");

    // ==========================================
    // GET - CARREGAR ALUNOS
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();

        let ativo = true;

        async function carregarAlunos() {
            try {
                const registros = await listarAlunosParaTriagem({
                    token,
                    signal: controller.signal,
                });

                if (!ativo) return;

                setAlunos(registros);
                setErroLista("");
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setAlunos([]);
                setErroLista(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregandoAlunos(false);
                }
            }
        }

        carregarAlunos();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [token, versaoLista]);

    // ==========================================
    // TURMAS PRESENTES NA LISTAGEM
    // ==========================================

    const turmasDisponiveis = useMemo(() => {
        const ids = alunos
            .map((aluno) => aluno.turma_id)
            .filter((id) => id !== null && id !== undefined && id !== "")
            .map(String);

        return [...new Set(ids)].sort((a, b) => Number(a) - Number(b));
    }, [alunos]);

    // ==========================================
    // FILTRAR ALUNOS
    // ==========================================

    const alunosFiltrados = useMemo(() => {
        const termo = pesquisa.trim().toLocaleLowerCase("pt-BR");

        return alunos.filter((aluno) => {
            const texto = [
                aluno.id,
                aluno.nome,
                aluno.matricula,
                aluno.codigo,
                aluno.turma_id,
            ]
                .filter((valor) => valor !== null && valor !== undefined)
                .map(String)
                .join(" ")
                .toLocaleLowerCase("pt-BR");

            const correspondePesquisa = !termo || texto.includes(termo);

            const correspondeTurma =
                !turmaFiltro || String(aluno.turma_id) === turmaFiltro;

            return correspondePesquisa && correspondeTurma;
        });
    }, [alunos, pesquisa, turmaFiltro]);

    // ==========================================
    // ALUNO SELECIONADO
    // ==========================================

    const alunoSelecionado = useMemo(() => {
        return alunos.find((aluno) => String(aluno.id) === alunoId) ?? null;
    }, [alunos, alunoId]);

    // ==========================================
    // SELECIONAR ALUNO
    // ==========================================

    function selecionarAluno(id) {
        setAlunoId(String(id));

        setResultado(null);
        setErroAlerta("");

        setCarregandoAlerta(true);
    }

    // ==========================================
    // GET - CONSULTAR ALERTAS DO ALUNO
    // ==========================================

    useEffect(() => {
        if (!alunoId) return;

        const controller = new AbortController();

        let ativo = true;

        async function carregarAlerta() {
            try {
                const resposta = await consultarAlertasDoAluno({
                    alunoId,
                    token,
                    signal: controller.signal,
                });

                if (!ativo) return;

                setResultado(resposta);
                setErroAlerta("");
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setResultado(null);
                setErroAlerta(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregandoAlerta(false);
                }
            }
        }

        carregarAlerta();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [alunoId, token, versaoAlerta]);

    // ==========================================
    // ATUALIZAR LISTA DE ALUNOS
    // ==========================================

    function atualizarLista() {
        if (carregandoAlunos || carregandoAlerta) {
            return;
        }

        setAlunoId("");
        setResultado(null);

        setErroLista("");
        setErroAlerta("");

        setCarregandoAlunos(true);

        setVersaoLista((anterior) => anterior + 1);
    }

    // ==========================================
    // ATUALIZAR CONSULTA DE ALERTAS
    // ==========================================

    function atualizarAlerta() {
        if (!alunoId || carregandoAlerta) {
            return;
        }

        setResultado(null);
        setErroAlerta("");

        setCarregandoAlerta(true);

        setVersaoAlerta((anterior) => anterior + 1);
    }

    // ==========================================
    // LIMPAR FILTROS
    // ==========================================

    function limparFiltros() {
        setPesquisa("");
        setTurmaFiltro("");
    }

    // ==========================================
    // FECHAR DETALHES
    // ==========================================

    function fecharDetalhes() {
        setAlunoId("");
        setResultado(null);
        setErroAlerta("");
        setCarregandoAlerta(false);
    }

    // ==========================================
    // ORGANIZAR RESULTADOS
    // ==========================================

    const registros = obterRegistros(resultado);

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <section
            className="triagem-alertas"
            aria-labelledby="triagem-alertas-titulo"
        >
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <div className="triagem-alertas-topo">
                <div>
                    <h2 id="triagem-alertas-titulo">Painel de triagem</h2>

                    <p>
                        Consulte os alertas escolares individualmente por
                        estudante.
                    </p>
                </div>

                <button
                    type="button"
                    className="triagem-alertas-botao"
                    onClick={atualizarLista}
                    disabled={carregandoAlunos || carregandoAlerta}
                >
                    {carregandoAlunos ? "Carregando..." : "Atualizar alunos"}
                </button>
            </div>

            {/* ======================================
          CONTADORES
      ====================================== */}

            <div className="triagem-alertas-resumo">
                <div>
                    <span>Alunos retornados</span>
                    <strong>{alunos.length}</strong>
                </div>

                <div>
                    <span>Após filtros</span>
                    <strong>{alunosFiltrados.length}</strong>
                </div>

                <div>
                    <span>Selecionado</span>
                    <strong>{alunoSelecionado ? 1 : 0}</strong>
                </div>
            </div>

            {/* ======================================
          MENSAGENS DA LISTAGEM
      ====================================== */}

            {carregandoAlunos && (
                <p className="triagem-alertas-mensagem" role="status">
                    Carregando estudantes disponíveis...
                </p>
            )}

            {erroLista && (
                <p
                    className={
                        "triagem-alertas-mensagem " +
                        "triagem-alertas-mensagem--erro"
                    }
                    role="alert"
                >
                    {erroLista}
                </p>
            )}

            {/* ======================================
          FILTROS
      ====================================== */}

            <div className="triagem-alertas-filtros">
                {/* PESQUISA */}

                <div className="triagem-alertas-campo">
                    <label htmlFor="triagem-pesquisa">Pesquisar aluno</label>

                    <input
                        id="triagem-pesquisa"
                        type="search"
                        value={pesquisa}
                        placeholder={"Nome, matrícula ou ID"}
                        onChange={(evento) => {
                            setPesquisa(evento.target.value);
                        }}
                    />
                </div>

                {/* FILTRO POR TURMA */}

                <div className="triagem-alertas-campo">
                    <label htmlFor="triagem-turma">Turma</label>

                    <select
                        id="triagem-turma"
                        value={turmaFiltro}
                        onChange={(evento) => {
                            setTurmaFiltro(evento.target.value);
                        }}
                    >
                        <option value="">Todas as turmas</option>

                        {turmasDisponiveis.map((id) => (
                            <option key={id} value={id}>
                                Turma {id}
                            </option>
                        ))}
                    </select>
                </div>

                {/* LIMPAR */}

                <button
                    type="button"
                    className="triagem-alertas-botao-secundario"
                    onClick={limparFiltros}
                >
                    Limpar filtros
                </button>
            </div>

            {/* ======================================
          LISTAGEM DE ESTUDANTES
      ====================================== */}

            <div className="triagem-alertas-lista">
                <h3>Estudantes disponíveis</h3>

                {!carregandoAlunos &&
                    !erroLista &&
                    alunosFiltrados.length === 0 && (
                        <p className="triagem-alertas-vazio">
                            Nenhum estudante encontrado com os filtros atuais.
                        </p>
                    )}

                {alunosFiltrados.map((aluno) => {
                    const selecionado = String(aluno.id) === alunoId;

                    return (
                        <button
                            type="button"
                            key={aluno.id}
                            className={
                                "triagem-alertas-item " +
                                (selecionado
                                    ? "triagem-alertas-item--ativo"
                                    : "")
                            }
                            aria-pressed={selecionado}
                            onClick={() => {
                                if (!carregandoAlunos) {
                                    selecionarAluno(aluno.id);
                                }
                            }}
                            disabled={carregandoAlunos}
                        >
                            <strong>
                                {aluno.nome || `Aluno ID ${aluno.id}`}
                            </strong>

                            <span>{identificarAluno(aluno)}</span>

                            <small>Consultar alertas deste aluno</small>
                        </button>
                    );
                })}
            </div>

            {/* ======================================
          DETALHES DA CONSULTA
      ====================================== */}

            {alunoSelecionado && (
                <div className="triagem-alertas-detalhes">
                    {/* CABEÇALHO */}

                    <div className="triagem-alertas-detalhes-topo">
                        <div>
                            <h3>Consulta de alertas do aluno</h3>

                            <p>{identificarAluno(alunoSelecionado)}</p>
                        </div>

                        <div className="alertas-gestao-botoes">
                            <button
                                type="button"
                                className="triagem-alertas-botao-secundario"
                                onClick={atualizarAlerta}
                                disabled={carregandoAlerta}
                            >
                                Recarregar consulta
                            </button>

                            <button
                                type="button"
                                className="triagem-alertas-botao-secundario"
                                onClick={fecharDetalhes}
                            >
                                Fechar detalhes
                            </button>
                        </div>
                    </div>

                    {/* CARREGAMENTO */}

                    {carregandoAlerta && (
                        <p className="triagem-alertas-mensagem" role="status">
                            Consultando alertas no FastAPI...
                        </p>
                    )}

                    {/* ERRO */}

                    {erroAlerta && (
                        <p
                            className={
                                "triagem-alertas-mensagem " +
                                "triagem-alertas-mensagem--erro"
                            }
                            role="alert"
                        >
                            {erroAlerta}
                        </p>
                    )}

                    {/* RESPOSTA SEM REGISTROS */}

                    {!carregandoAlerta &&
                        !erroAlerta &&
                        registros.length === 0 && (
                            <p className="triagem-alertas-vazio">
                                A API não retornou registros para esta consulta.
                            </p>
                        )}

                    {/* RESULTADOS REAIS DA API */}

                    {!carregandoAlerta &&
                        !erroAlerta &&
                        registros.map((registro, indice) => (
                            <div key={indice} style={{ marginBottom: 20 }}>
                                {registros.length > 1 && (
                                    <h4>Resultado {indice + 1}</h4>
                                )}

                                <dl>
                                    {obterCampos(registro).map(
                                        ([chave, valor]) => (
                                            <div key={chave}>
                                                <dt>
                                                    {formatarNomeCampo(chave)}
                                                </dt>

                                                <dd>
                                                    {typeof valor ===
                                                        "object" &&
                                                    valor !== null ? (
                                                        <pre
                                                            style={{
                                                                margin: 0,
                                                                whiteSpace:
                                                                    "pre-wrap",
                                                                overflowWrap:
                                                                    "anywhere",
                                                                font: "inherit",
                                                            }}
                                                        >
                                                            {formatarValor(
                                                                valor,
                                                            )}
                                                        </pre>
                                                    ) : (
                                                        formatarValor(valor)
                                                    )}
                                                </dd>
                                            </div>
                                        ),
                                    )}
                                </dl>
                            </div>
                        ))}

                    <p className="triagem-alertas-nota">
                        Os dados exibidos vêm diretamente da consulta de alertas
                        por aluno do FastAPI. Este painel não altera registros
                        no banco de dados.
                    </p>
                </div>
            )}
        </section>
    );
}

export default PainelTriagemAlertas;
