import { useEffect, useState } from "react";

import SeletorEscola from "./SeletorEscola";

import { buscarEscolaParaEdicao } from "../services/edicaoEscolaService";

import { excluirEscola } from "../services/exclusaoEscolaService";

// ============================================
// MENSAGENS DE ERRO
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sua sessão foi rejeitada ou expirou. " +
            "Saia do sistema e faça login novamente."
        );
    }

    if (erro.status === 403) {
        return "Você não possui permissão para excluir " + "esta escola.";
    }

    if (erro.status === 404) {
        return (
            "Escola não encontrada ou sem acesso. " +
            "Atualize a seleção antes de tentar novamente."
        );
    }

    if (erro.status === 409) {
        return (
            "A exclusão foi bloqueada por uma regra " +
            "de integridade ou conflito. " +
            "Confira a resposta no Swagger e os " +
            "registros vinculados à escola."
        );
    }

    if (erro.status === 422) {
        return (
            "A API rejeitou a operação. " +
            "Confira os detalhes da resposta no Network."
        );
    }

    return erro.message || "Não foi possível excluir a escola.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function ExclusaoEscola({ token, onExclusaoRealizada }) {
    // ==========================================
    // ESCOLA SELECIONADA
    // ==========================================

    const [escolaId, setEscolaId] = useState("");
    const [escola, setEscola] = useState(null);

    // ==========================================
    // CONSULTA DOS DADOS
    // ==========================================

    const [carregando, setCarregando] = useState(false);
    const [erroConsulta, setErroConsulta] = useState("");
    const [versaoConsulta, setVersaoConsulta] = useState(0);

    // ==========================================
    // CONFIRMAÇÃO
    // ==========================================

    const [nomeConfirmacao, setNomeConfirmacao] = useState("");

    // ==========================================
    // EXCLUSÃO
    // ==========================================

    const [excluindo, setExcluindo] = useState(false);
    const [erroExclusao, setErroExclusao] = useState("");
    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // ATUALIZAR SELEÇÃO
    // ==========================================

    function selecionarEscola(novoId) {
        if (excluindo) return;

        setEscolaId(novoId);
        setEscola(null);
        setNomeConfirmacao("");
        setErroConsulta("");
        setErroExclusao("");
        setSucesso("");
        setCarregando(Boolean(novoId));
    }

    // ==========================================
    // CONSULTAR DADOS ATUAIS DA ESCOLA
    // ==========================================

    useEffect(() => {
        if (!escolaId) {
            return;
        }

        const controller = new AbortController();
        let ativo = true;

        async function carregarEscola() {
            try {
                const dados = await buscarEscolaParaEdicao({
                    escolaId,
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    // Não mantém dados de outra escola.
                    setEscola(dados);
                    setErroConsulta("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setEscola(null);
                setErroConsulta(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarEscola();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [escolaId, token, versaoConsulta]);

    // ==========================================
    // RECARREGAR DADOS
    // ==========================================

    function recarregarDados() {
        if (!escolaId || excluindo) return;

        setEscola(null);
        setNomeConfirmacao("");
        setErroConsulta("");
        setErroExclusao("");
        setSucesso("");
        setCarregando(true);

        setVersaoConsulta((anterior) => anterior + 1);
    }

    // ==========================================
    // VALIDAR NOME EXATO
    // ==========================================

    const nomeEsperado = escola?.nome ?? "";

    const nomeCorreto = Boolean(
        escola && nomeEsperado && nomeConfirmacao === nomeEsperado,
    );

    const podeExcluir = nomeCorreto && !carregando && !excluindo;

    // ==========================================
    // ENVIAR DELETE
    // ==========================================

    async function confirmarExclusao(evento) {
        evento.preventDefault();

        if (!podeExcluir) {
            return;
        }

        // Confirmação final antes do DELETE.
        const confirmou = window.confirm(
            "ATENÇÃO!\n\n" +
                `Você deseja solicitar a exclusão de:\n` +
                `${escola.nome} (ID ${escola.id})?\n\n` +
                "A operação poderá ser irreversível.\n" +
                "Continue somente em ambiente de testes.",
        );

        if (!confirmou) {
            return;
        }

        setExcluindo(true);
        setErroExclusao("");
        setSucesso("");

        try {
            await excluirEscola({
                escolaId: escola.id,
                token,
            });

            // O sucesso é confirmado somente
            // após a resposta HTTP de sucesso.
            setSucesso("Operação de exclusão confirmada pelo FastAPI.");

            setEscolaId("");
            setEscola(null);
            setNomeConfirmacao("");

            // Atualiza a listagem da página pai.
            onExclusaoRealizada?.();
        } catch (falha) {
            setErroExclusao(mensagemDeErro(falha));
        } finally {
            setExcluindo(false);
        }
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <section
            className="exclusao-escola"
            aria-labelledby="titulo-exclusao-escola"
        >
            <div className="exclusao-escola-topo">
                <h2 id="titulo-exclusao-escola">Excluir escola</h2>

                <p>
                    Utilize esta funcionalidade somente para instituições
                    fictícias e descartáveis.
                </p>
            </div>

            {/* ======================================
          AVISO
      ====================================== */}

            <div className="exclusao-escola-aviso" role="note">
                <strong>Atenção: operação destrutiva</strong>

                <p>
                    A exclusão pode ser irreversível. Instituições com turmas,
                    alunos ou outros registros vinculados poderão ter a exclusão
                    bloqueada pelo backend.
                </p>
            </div>

            {/* ======================================
          SELEÇÃO
      ====================================== */}

            <div className="exclusao-escola-selecao">
                <SeletorEscola
                    token={token}
                    valor={escolaId}
                    onChange={selecionarEscola}
                    disabled={carregando || excluindo}
                />

                <button
                    type="button"
                    className="exclusao-escola-botao-secundario"
                    onClick={recarregarDados}
                    disabled={!escolaId || carregando || excluindo}
                >
                    Recarregar dados
                </button>
            </div>

            {/* ======================================
          MENSAGENS DA CONSULTA
      ====================================== */}

            {carregando && (
                <p className="exclusao-escola-mensagem" role="status">
                    Consultando dados atuais da escola...
                </p>
            )}

            {erroConsulta && (
                <p
                    className="exclusao-escola-mensagem exclusao-escola-mensagem--erro"
                    role="alert"
                >
                    {erroConsulta}
                </p>
            )}

            {!escolaId && !sucesso && (
                <p className="exclusao-escola-orientacao">
                    Selecione uma escola para iniciar a conferência dos dados.
                </p>
            )}

            {/* ======================================
          ESCOLA SELECIONADA
      ====================================== */}

            {escola && !carregando && (
                <form onSubmit={confirmarExclusao}>
                    <div className="exclusao-escola-dados">
                        <h3>Confira a instituição</h3>

                        <dl>
                            <div>
                                <dt>ID</dt>
                                <dd>{escola.id}</dd>
                            </div>

                            <div>
                                <dt>Nome</dt>
                                <dd>{escola.nome}</dd>
                            </div>

                            <div>
                                <dt>Cidade</dt>
                                <dd>{escola.cidade || "Não informada"}</dd>
                            </div>

                            <div>
                                <dt>Situação</dt>
                                <dd>
                                    {escola.ativo === true
                                        ? "Ativa"
                                        : escola.ativo === false
                                          ? "Inativa"
                                          : "Não informada"}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* ==================================
              CONFIRMAÇÃO PELO NOME
          ================================== */}

                    <div className="exclusao-escola-confirmacao">
                        <label htmlFor="exclusao-nome-confirmacao">
                            Para confirmar, digite exatamente:
                        </label>

                        <strong className="exclusao-escola-nome">
                            {nomeEsperado}
                        </strong>

                        <input
                            id="exclusao-nome-confirmacao"
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            value={nomeConfirmacao}
                            placeholder="Digite o nome da escola"
                            onChange={(evento) => {
                                setNomeConfirmacao(evento.target.value);
                                setErroExclusao("");
                            }}
                            disabled={excluindo}
                            required
                        />

                        <p>
                            A confirmação diferencia letras, acentos e espaços.
                            Não exclua escolas utilizadas por outros testes.
                        </p>
                    </div>

                    {/* ==================================
              ERRO DA EXCLUSÃO
          ================================== */}

                    {erroExclusao && (
                        <p
                            className="exclusao-escola-mensagem exclusao-escola-mensagem--erro"
                            role="alert"
                        >
                            {erroExclusao}
                        </p>
                    )}

                    {/* ==================================
              BOTÃO DE EXCLUSÃO
          ================================== */}

                    <div className="exclusao-escola-acoes">
                        <button
                            type="submit"
                            className="exclusao-escola-botao-excluir"
                            disabled={!podeExcluir}
                        >
                            {excluindo
                                ? "Solicitando exclusão..."
                                : "Confirmar exclusão da escola"}
                        </button>
                    </div>
                </form>
            )}

            {/* ======================================
          SUCESSO
      ====================================== */}

            {sucesso && (
                <p
                    className="exclusao-escola-mensagem exclusao-escola-mensagem--sucesso"
                    role="status"
                >
                    {sucesso}
                </p>
            )}
        </section>
    );
}

export default ExclusaoEscola;
