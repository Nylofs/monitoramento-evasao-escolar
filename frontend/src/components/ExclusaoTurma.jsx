import { useEffect, useState } from "react";

import SeletorTurma from "./SeletorTurma";

import { buscarTurmaParaEdicao } from "../services/edicaoTurmaService";

import { excluirTurma } from "../services/exclusaoTurmaService";

// ============================================
// MENSAGENS DE ERRO
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sua autenticação expirou ou foi rejeitada. " +
            "Saia do sistema e faça login novamente."
        );
    }

    if (erro.status === 403) {
        return "Você não possui permissão para " + "excluir esta turma.";
    }

    if (erro.status === 404) {
        return (
            "Turma não encontrada ou sem acesso. " +
            "Atualize os dados antes de tentar novamente."
        );
    }

    if (erro.status === 405) {
        return (
            "O método DELETE não está disponível " +
            "nessa rota. Confira o Swagger."
        );
    }

    if (erro.status === 409) {
        return (
            "A exclusão foi bloqueada por um conflito. " +
            "A turma pode possuir alunos ou outros " +
            "registros vinculados."
        );
    }

    if (erro.status === 422) {
        const detalhes = erro.detalhes?.detail;

        if (Array.isArray(detalhes)) {
            return detalhes
                .map((item) => item.msg || "Erro de validação")
                .join(" | ");
        }

        return "A API rejeitou a operação. " + "Confira o retorno no Network.";
    }

    return erro.message || "Não foi possível excluir a turma.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function ExclusaoTurma({ token, onExclusaoRealizada }) {
    // ==========================================
    // SELEÇÃO
    // ==========================================

    const [turmaId, setTurmaId] = useState("");
    const [turma, setTurma] = useState(null);

    // ==========================================
    // CARREGAMENTO
    // ==========================================

    const [carregando, setCarregando] = useState(false);

    const [versaoConsulta, setVersaoConsulta] = useState(0);

    const [versaoSeletor, setVersaoSeletor] = useState(0);

    // ==========================================
    // CONFIRMAÇÃO E EXCLUSÃO
    // ==========================================

    const [nomeConfirmacao, setNomeConfirmacao] = useState("");

    const [excluindo, setExcluindo] = useState(false);

    // ==========================================
    // MENSAGENS
    // ==========================================

    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // SELECIONAR TURMA
    // ==========================================

    function selecionarTurma(novoId) {
        if (excluindo) return;

        setTurmaId(novoId);

        // Descartar informações da seleção anterior.
        setTurma(null);
        setNomeConfirmacao("");

        setErro("");
        setSucesso("");

        setCarregando(Boolean(novoId));
    }

    // ==========================================
    // CONSULTAR DADOS ATUAIS
    // ==========================================

    useEffect(() => {
        if (!turmaId) return;

        const controller = new AbortController();
        let ativo = true;

        async function carregarTurma() {
            try {
                const dados = await buscarTurmaParaEdicao({
                    turmaId,
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    // Garantir que a resposta corresponde
                    // ao identificador selecionado.
                    if (String(dados.id) !== String(turmaId)) {
                        throw new Error(
                            "A API retornou uma turma diferente " +
                                "da selecionada.",
                        );
                    }

                    setTurma(dados);
                    setErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setTurma(null);
                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarTurma();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [turmaId, token, versaoConsulta]);

    // ==========================================
    // RECARREGAR DADOS
    // ==========================================

    function recarregarDados() {
        if (!turmaId || excluindo || carregando) {
            return;
        }

        setTurma(null);
        setNomeConfirmacao("");
        setErro("");
        setSucesso("");
        setCarregando(true);

        setVersaoConsulta((anterior) => anterior + 1);
    }

    // ==========================================
    // CONFERIR NOME EXATO
    // ==========================================

    const nomeEsperado = turma?.nome ?? "";

    const confirmacaoCorreta = Boolean(
        turma && nomeEsperado && nomeConfirmacao === nomeEsperado,
    );

    const podeExcluir = confirmacaoCorreta && !carregando && !excluindo;

    // ==========================================
    // CONFIRMAR E ENVIAR DELETE
    // ==========================================

    async function confirmarExclusao(evento) {
        evento.preventDefault();

        if (!podeExcluir) return;

        const nome = turma.nome;
        const id = turma.id;

        // Segunda confirmação, antes da requisição.
        const confirmou = window.confirm(
            "ATENÇÃO: EXCLUSÃO DE TURMA\n\n" +
                `Turma: ${nome}\n` +
                `ID: ${id}\n` +
                `Escola ID: ${turma.escola_id}\n\n` +
                "A exclusão pode ser irreversível.\n" +
                "Confirme apenas para uma turma " +
                "fictícia e descartável.\n\n" +
                "Deseja continuar?",
        );

        if (!confirmou) return;

        setExcluindo(true);
        setErro("");
        setSucesso("");

        try {
            await excluirTurma({
                turmaId: id,
                token,
            });

            // A operação foi confirmada pelo backend.
            setSucesso("Operação de exclusão confirmada pelo FastAPI.");

            // Limpar a seleção excluída.
            setTurmaId("");
            setTurma(null);
            setNomeConfirmacao("");

            // Recarregar opções do seletor.
            setVersaoSeletor((anterior) => anterior + 1);

            // Solicitar atualização da listagem.
            onExclusaoRealizada?.();
        } catch (falha) {
            setErro(mensagemDeErro(falha));

            // Não apagar a identificação da turma
            // se o backend rejeitar a operação.
            // A confirmação digitada é apagada para
            // exigir uma nova decisão consciente.
            setNomeConfirmacao("");
        } finally {
            setExcluindo(false);
        }
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <section
            className="exclusao-turma"
            aria-labelledby="exclusao-turma-titulo"
        >
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <div className="exclusao-turma-topo">
                <h2 id="exclusao-turma-titulo">Excluir turma</h2>

                <p>
                    Selecione uma turma fictícia, confira seus dados e confirme
                    a operação.
                </p>
            </div>

            {/* ======================================
          AVISO
      ====================================== */}

            <div className="exclusao-turma-aviso" role="note">
                <strong>Atenção: operação destrutiva</strong>

                <p>
                    A turma pode possuir alunos, frequências e outros registros
                    vinculados. Não utilize esta opção para excluir turmas reais
                    durante os testes.
                </p>
            </div>

            {/* ======================================
          SELETOR
      ====================================== */}

            <div className="exclusao-turma-selecao">
                <SeletorTurma
                    key={versaoSeletor}
                    token={token}
                    valor={turmaId}
                    onChange={selecionarTurma}
                    disabled={carregando || excluindo}
                />

                <button
                    type="button"
                    className="exclusao-turma-botao-secundario"
                    onClick={recarregarDados}
                    disabled={!turmaId || carregando || excluindo}
                >
                    Recarregar dados da turma
                </button>
            </div>

            {/* ======================================
          ESTADOS
      ====================================== */}

            {carregando && (
                <p className="exclusao-turma-mensagem" role="status">
                    Consultando dados atuais da turma...
                </p>
            )}

            {erro && (
                <p
                    className={
                        "exclusao-turma-mensagem " +
                        "exclusao-turma-mensagem--erro"
                    }
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {!turmaId && !sucesso && (
                <p className="exclusao-turma-orientacao">
                    Selecione uma turma na lista acima. Os dados serão
                    consultados antes de habilitar a exclusão.
                </p>
            )}

            {/* ======================================
          DADOS DA TURMA
      ====================================== */}

            {turma && !carregando && (
                <form onSubmit={confirmarExclusao}>
                    <div className="exclusao-turma-dados">
                        <h3>Confira os dados da turma</h3>

                        <dl>
                            <div>
                                <dt>ID da turma</dt>
                                <dd>{turma.id}</dd>
                            </div>

                            <div>
                                <dt>Nome</dt>
                                <dd>{turma.nome}</dd>
                            </div>

                            <div>
                                <dt>Escola ID</dt>
                                <dd>{turma.escola_id}</dd>
                            </div>

                            <div>
                                <dt>Série</dt>
                                <dd>{turma.serie || "Não informada"}</dd>
                            </div>

                            <div>
                                <dt>Turno</dt>
                                <dd>{turma.turno || "Não informado"}</dd>
                            </div>

                            <div>
                                <dt>Ano letivo</dt>
                                <dd>{turma.ano_letivo ?? "Não informado"}</dd>
                            </div>

                            <div>
                                <dt>Situação</dt>
                                <dd>
                                    {turma.ativo === true
                                        ? "Ativa"
                                        : turma.ativo === false
                                          ? "Inativa"
                                          : "Não informada"}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* ==================================
              CONFIRMAÇÃO PELO NOME
          ================================== */}

                    <div className="exclusao-turma-confirmacao">
                        <label htmlFor="exclusao-turma-nome">
                            Para habilitar a exclusão, digite exatamente:
                        </label>

                        <strong className="exclusao-turma-nome">
                            {nomeEsperado}
                        </strong>

                        <input
                            id="exclusao-turma-nome"
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            value={nomeConfirmacao}
                            placeholder="Digite o nome da turma"
                            onChange={(evento) => {
                                setNomeConfirmacao(evento.target.value);
                                setErro("");
                            }}
                            disabled={excluindo}
                            required
                        />

                        <p>
                            A confirmação diferencia maiúsculas, acentos e
                            espaços. O botão só será habilitado quando o nome
                            corresponder exatamente.
                        </p>
                    </div>

                    {/* ==================================
              BOTÃO DE EXCLUSÃO
          ================================== */}

                    <div className="exclusao-turma-acoes">
                        <button
                            type="submit"
                            className="exclusao-turma-botao-excluir"
                            disabled={!podeExcluir}
                        >
                            {excluindo
                                ? "Solicitando exclusão..."
                                : "Confirmar exclusão da turma"}
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
                        "exclusao-turma-mensagem " +
                        "exclusao-turma-mensagem--sucesso"
                    }
                    role="status"
                >
                    {sucesso}
                </p>
            )}
        </section>
    );
}

export default ExclusaoTurma;
