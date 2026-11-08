import { useEffect, useRef, useState } from "react";

import SeletorAluno from "./SeletorAluno";

import { buscarAlunoParaEdicao } from "../services/edicaoAlunoService";

import { excluirAluno } from "../services/exclusaoAlunoService";

// ============================================
// MENSAGENS DE ERRO
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sua sessão expirou ou foi rejeitada. " + "Faça login novamente."
        );
    }

    if (erro.status === 403) {
        return "Você não possui permissão para " + "excluir este aluno.";
    }

    if (erro.status === 404) {
        return (
            "Aluno não encontrado ou sem acesso. " +
            "Atualize os dados antes de tentar novamente."
        );
    }

    if (erro.status === 405) {
        return (
            "O método DELETE não está disponível. " +
            "Confira a rota no Swagger."
        );
    }

    if (erro.status === 409) {
        return (
            "O backend bloqueou a exclusão por conflito. " +
            "O estudante pode possuir registros " +
            "escolares vinculados."
        );
    }

    if (erro.status === 422) {
        const detalhes = erro.detalhes?.detail;

        if (Array.isArray(detalhes)) {
            return detalhes
                .map((item) => {
                    const campo = Array.isArray(item.loc)
                        ? item.loc.slice(1).join(".")
                        : "Campo";

                    return `${campo}: ${item.msg}`;
                })
                .join(" | ");
        }

        return (
            "A API rejeitou a operação. " + "Confira o retorno na aba Network."
        );
    }

    return erro.message || "Não foi possível excluir o aluno.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function ExclusaoAluno({ token, onExclusaoRealizada }) {
    // ==========================================
    // SELEÇÃO
    // ==========================================

    const [alunoId, setAlunoId] = useState("");
    const [aluno, setAluno] = useState(null);

    // ==========================================
    // CARREGAMENTO DOS DADOS
    // ==========================================

    const [carregando, setCarregando] = useState(false);

    const [versaoConsulta, setVersaoConsulta] = useState(0);

    const [versaoSeletor, setVersaoSeletor] = useState(0);

    // ==========================================
    // CONFIRMAÇÃO
    // ==========================================

    const [nomeConfirmacao, setNomeConfirmacao] = useState("");

    const [codigoConfirmacao, setCodigoConfirmacao] = useState("");

    // ==========================================
    // ENVIO E MENSAGENS
    // ==========================================

    const [excluindo, setExcluindo] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // Guarda o estado da operação pendente.
    // Evita que uma seleção antiga seja usada
    // enquanto uma exclusão está em andamento.
    const exclusaoPendente = useRef(false);

    // ==========================================
    // LIMPAR CONFIRMAÇÕES
    // ==========================================

    function limparConfirmacoes() {
        setNomeConfirmacao("");
        setCodigoConfirmacao("");
    }

    // ==========================================
    // SELECIONAR ALUNO
    // ==========================================

    function selecionarAluno(novoId) {
        if (exclusaoPendente.current) return;

        setAlunoId(novoId);
        setAluno(null);

        limparConfirmacoes();

        setErro("");
        setSucesso("");

        setCarregando(Boolean(novoId));
    }

    // ==========================================
    // CONSULTAR ALUNO INDIVIDUAL
    // ==========================================

    useEffect(() => {
        if (!alunoId) return;

        const controller = new AbortController();
        let ativo = true;

        async function carregarAluno() {
            try {
                const dados = await buscarAlunoParaEdicao({
                    alunoId,
                    token,
                    signal: controller.signal,
                });

                if (!ativo) return;

                // Conferir a identidade do registro.
                if (String(dados.id) !== String(alunoId)) {
                    throw new Error("A API retornou outro aluno.");
                }

                setAluno(dados);
                setErro("");
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setAluno(null);
                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarAluno();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [alunoId, token, versaoConsulta]);

    // ==========================================
    // RECARREGAR DADOS DO ALUNO
    // ==========================================

    function recarregarAluno() {
        if (!alunoId || carregando || exclusaoPendente.current) {
            return;
        }

        setAluno(null);
        limparConfirmacoes();

        setErro("");
        setSucesso("");
        setCarregando(true);

        setVersaoConsulta((anterior) => anterior + 1);
    }

    // ==========================================
    // VERIFICAR CONFIRMAÇÕES
    // ==========================================

    const nomeEsperado = String(aluno?.nome ?? "");

    const codigoEsperado = String(aluno?.codigo_aluno ?? "");

    const nomeCorreto = Boolean(
        nomeEsperado && nomeConfirmacao === nomeEsperado,
    );

    const codigoCorreto = Boolean(
        codigoEsperado && codigoConfirmacao === codigoEsperado,
    );

    const podeExcluir = Boolean(
        aluno &&
        String(aluno.id) === String(alunoId) &&
        nomeCorreto &&
        codigoCorreto &&
        !carregando &&
        !excluindo,
    );

    // ==========================================
    // CONFIRMAR A EXCLUSÃO
    // ==========================================

    async function confirmarExclusao(evento) {
        evento.preventDefault();

        if (!podeExcluir || exclusaoPendente.current) {
            return;
        }

        const id = aluno.id;
        const nome = aluno.nome;
        const codigo = aluno.codigo_aluno;

        // ========================================
        // SEGUNDA CONFIRMAÇÃO
        // ========================================

        const confirmou = window.confirm(
            "ATENÇÃO: EXCLUSÃO DE ALUNO\n\n" +
                `Nome: ${nome}\n` +
                `Código: ${codigo}\n` +
                `ID: ${id}\n` +
                `Turma ID: ${aluno.turma_id}\n\n` +
                "O estudante pode possuir registros " +
                "de frequência, alertas e intervenções.\n\n" +
                "A exclusão poderá ser irreversível.\n" +
                "Confirme somente se este aluno for " +
                "fictício e descartável.\n\n" +
                "Deseja continuar?",
        );

        if (!confirmou) return;

        // Bloqueio imediato contra disparos
        // repetidos antes do próximo render.
        exclusaoPendente.current = true;

        setExcluindo(true);
        setErro("");
        setSucesso("");

        try {
            await excluirAluno({
                alunoId: id,
                token,
            });

            // Somente após HTTP 2xx.
            setSucesso("Operação de exclusão confirmada pelo FastAPI.");

            setAlunoId("");
            setAluno(null);
            limparConfirmacoes();

            // Atualizar opções do seletor.
            setVersaoSeletor((anterior) => anterior + 1);

            // Atualizar listagem existente.
            onExclusaoRealizada?.();
        } catch (falha) {
            setErro(mensagemDeErro(falha));

            // Exigir nova confirmação se falhar.
            limparConfirmacoes();
        } finally {
            exclusaoPendente.current = false;
            setExcluindo(false);
        }
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <section
            className="exclusao-aluno"
            aria-labelledby="exclusao-aluno-titulo"
        >
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <div className="exclusao-aluno-topo">
                <h2 id="exclusao-aluno-titulo">Excluir aluno</h2>

                <p>
                    Selecione um estudante fictício, confira os dados e confirme
                    a exclusão.
                </p>
            </div>

            {/* ======================================
          AVISO DE SEGURANÇA
      ====================================== */}

            <div className="exclusao-aluno-aviso" role="note">
                <strong>Atenção: operação destrutiva</strong>

                <p>
                    A exclusão pode afetar históricos escolares. Não exclua
                    estudantes reais ou alunos utilizados em outros testes do
                    sistema.
                </p>
            </div>

            {/* ======================================
          SELETOR
      ====================================== */}

            <div className="exclusao-aluno-selecao">
                <SeletorAluno
                    key={versaoSeletor}
                    token={token}
                    valor={alunoId}
                    onChange={selecionarAluno}
                    disabled={carregando || excluindo}
                />

                <button
                    type="button"
                    className="exclusao-aluno-botao-secundario"
                    onClick={recarregarAluno}
                    disabled={!alunoId || carregando || excluindo}
                >
                    Recarregar dados do aluno
                </button>
            </div>

            {/* ======================================
          CARREGAMENTO
      ====================================== */}

            {carregando && (
                <p className="exclusao-aluno-mensagem" role="status">
                    Consultando os dados atuais do aluno...
                </p>
            )}

            {/* ======================================
          ERROS
      ====================================== */}

            {erro && (
                <p
                    className={
                        "exclusao-aluno-mensagem " +
                        "exclusao-aluno-mensagem--erro"
                    }
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {/* ======================================
          NENHUMA SELEÇÃO
      ====================================== */}

            {!alunoId && !sucesso && (
                <p className="exclusao-aluno-orientacao">
                    Selecione um estudante para consultar sua identificação
                    antes de continuar.
                </p>
            )}

            {/* ======================================
          REGISTRO SELECIONADO
      ====================================== */}

            {aluno && !carregando && (
                <form onSubmit={confirmarExclusao}>
                    <div className="exclusao-aluno-dados">
                        <h3>Confira o estudante</h3>

                        <dl>
                            <div>
                                <dt>ID do aluno</dt>
                                <dd>{aluno.id}</dd>
                            </div>

                            <div>
                                <dt>Nome</dt>
                                <dd>{aluno.nome}</dd>
                            </div>

                            <div>
                                <dt>Código do aluno</dt>
                                <dd>{aluno.codigo_aluno || "Não informado"}</dd>
                            </div>

                            <div>
                                <dt>Turma ID</dt>
                                <dd>{aluno.turma_id ?? "Não informado"}</dd>
                            </div>

                            <div>
                                <dt>Situação</dt>
                                <dd>
                                    {aluno.ativo === true
                                        ? "Ativo"
                                        : aluno.ativo === false
                                          ? "Inativo"
                                          : "Não informada"}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* ==================================
              CONFIRMAÇÃO DO NOME
          ================================== */}

                    <div className="exclusao-aluno-confirmacao">
                        <label htmlFor="exclusao-aluno-nome">
                            Digite exatamente o nome:
                        </label>

                        <strong className="exclusao-aluno-valor">
                            {nomeEsperado}
                        </strong>

                        <input
                            id="exclusao-aluno-nome"
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            value={nomeConfirmacao}
                            placeholder="Confirme o nome do aluno"
                            onChange={(evento) => {
                                setNomeConfirmacao(evento.target.value);
                                setErro("");
                            }}
                            disabled={excluindo}
                            required
                        />
                    </div>

                    {/* ==================================
              CONFIRMAÇÃO DO CÓDIGO
          ================================== */}

                    <div className="exclusao-aluno-confirmacao">
                        <label htmlFor="exclusao-aluno-codigo">
                            Digite exatamente o código:
                        </label>

                        <strong className="exclusao-aluno-valor">
                            {codigoEsperado || "Código não disponível"}
                        </strong>

                        <input
                            id="exclusao-aluno-codigo"
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            value={codigoConfirmacao}
                            placeholder="Confirme o código cadastral"
                            onChange={(evento) => {
                                setCodigoConfirmacao(evento.target.value);
                                setErro("");
                            }}
                            disabled={excluindo || !codigoEsperado}
                            required
                        />
                    </div>

                    <p className="exclusao-aluno-ajuda">
                        As confirmações diferenciam maiúsculas, minúsculas,
                        acentos e espaços. Se o código não estiver disponível,
                        não será possível confirmar a exclusão por este
                        formulário.
                    </p>

                    {/* ==================================
              BOTÃO FINAL
          ================================== */}

                    <div className="exclusao-aluno-acoes">
                        <button
                            type="submit"
                            className="exclusao-aluno-botao-excluir"
                            disabled={!podeExcluir}
                        >
                            {excluindo
                                ? "Solicitando exclusão..."
                                : "Confirmar exclusão do aluno"}
                        </button>
                    </div>
                </form>
            )}

            {/* ======================================
          SUCESSO
      ====================================== */}

            {sucesso && (
                <p
                    className={
                        "exclusao-aluno-mensagem " +
                        "exclusao-aluno-mensagem--sucesso"
                    }
                    role="status"
                >
                    {sucesso}
                </p>
            )}
        </section>
    );
}

export default ExclusaoAluno;
