import { useEffect, useRef, useState } from "react";

import {
    ETAPAS_INTERVENCAO,
    STATUS_INTERVENCAO,
} from "../services/cadastroIntervencaoService";

import {
    listarIntervencoesParaEdicao,
    buscarIntervencaoParaEdicao,
} from "../services/edicaoIntervencaoService";

import { excluirIntervencao } from "../services/exclusaoIntervencaoService";

// ============================================
// ETAPA 15 - PARTE 30
// COMPONENTE DE EXCLUSÃO DE INTERVENÇÕES
// ============================================

// ============================================
// TRATAMENTO DE ERROS HTTP
// ============================================

function mensagemDeErro(erro) {
    const detalhe = erro.detalhes?.detail;

    if (erro.status === 401) {
        return (
            "Sua sessão expirou ou foi rejeitada. " + "Faça login novamente."
        );
    }

    if (erro.status === 403) {
        return "Você não possui permissão para " + "excluir esta intervenção.";
    }

    if (erro.status === 404) {
        return (
            "Intervenção não encontrada ou " + "sem acesso. Atualize a lista."
        );
    }

    if (erro.status === 405) {
        return (
            "O método DELETE não está disponível " +
            "nessa rota. Confira o Swagger."
        );
    }

    if (erro.status === 409) {
        return typeof detalhe === "string"
            ? detalhe
            : "A exclusão foi bloqueada por " + "uma regra de integridade.";
    }

    if (erro.status === 400) {
        return typeof detalhe === "string"
            ? detalhe
            : "A operação foi rejeitada pelo backend.";
    }

    if (erro.status === 422) {
        if (Array.isArray(detalhe)) {
            return detalhe
                .map((item) => {
                    const campo = Array.isArray(item.loc)
                        ? item.loc.slice(1).join(".")
                        : "Campo";

                    return `${campo}: ${item.msg}`;
                })
                .join(" | ");
        }

        return "A API rejeitou os parâmetros " + "da exclusão.";
    }

    return erro.message || "Não foi possível excluir a intervenção.";
}

// ============================================
// FORMATAR DATA
// ============================================

function formatarData(valor) {
    if (!valor) return "Não informada";

    const data = String(valor).slice(0, 10);

    const partes = data.split("-");

    if (partes.length !== 3) {
        return data;
    }

    const [ano, mes, dia] = partes;

    return `${dia}/${mes}/${ano}`;
}

// ============================================
// FORMATAR ETAPA
// ============================================

function formatarEtapa(valor) {
    return (
        ETAPAS_INTERVENCAO.find((item) => item.valor === valor)?.nome ||
        valor ||
        "Não informada"
    );
}

// ============================================
// FORMATAR STATUS
// ============================================

function formatarStatus(valor) {
    return (
        STATUS_INTERVENCAO.find((item) => item.valor === valor)?.nome ||
        valor ||
        "Não informado"
    );
}

// ============================================
// IDENTIFICAÇÃO PARA O SELECT
// ============================================

function identificarIntervencao(item) {
    return (
        `#${item.id} — Aluno ID ${item.aluno_id} — ` +
        `${formatarEtapa(item.etapa)} — ` +
        `${formatarData(item.data_intervencao)}`
    );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function ExclusaoIntervencao({ token, onExclusaoRealizada }) {
    // ==========================================
    // LISTAGEM
    // ==========================================

    const [lista, setLista] = useState([]);

    const [carregandoLista, setCarregandoLista] = useState(true);

    const [versaoLista, setVersaoLista] = useState(0);

    const [erroLista, setErroLista] = useState("");

    // ==========================================
    // REGISTRO INDIVIDUAL
    // ==========================================

    const [intervencaoId, setIntervencaoId] = useState("");

    const [intervencao, setIntervencao] = useState(null);

    const [carregandoRegistro, setCarregandoRegistro] = useState(false);

    const [versaoRegistro, setVersaoRegistro] = useState(0);

    // ==========================================
    // CONFIRMAÇÃO E ENVIO
    // ==========================================

    const [confirmacao, setConfirmacao] = useState("");

    const [excluindo, setExcluindo] = useState(false);

    const exclusaoPendente = useRef(false);

    // ==========================================
    // MENSAGENS
    // ==========================================

    const [erro, setErro] = useState("");

    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // CARREGAR LISTA DE INTERVENÇÕES
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();

        let ativo = true;

        async function carregarLista() {
            try {
                const registros = await listarIntervencoesParaEdicao({
                    token,
                    signal: controller.signal,
                });

                if (!ativo) return;

                setLista(registros);
                setErroLista("");
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setLista([]);
                setErroLista(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregandoLista(false);
                }
            }
        }

        carregarLista();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [token, versaoLista]);

    // ==========================================
    // SELECIONAR INTERVENÇÃO
    // ==========================================

    function selecionarIntervencao(novoId) {
        if (exclusaoPendente.current) return;

        setIntervencaoId(novoId);

        setIntervencao(null);
        setConfirmacao("");

        setErro("");
        setSucesso("");

        setCarregandoRegistro(Boolean(novoId));
    }

    // ==========================================
    // CARREGAR REGISTRO INDIVIDUAL
    // ==========================================

    useEffect(() => {
        if (!intervencaoId) return;

        const controller = new AbortController();

        let ativo = true;

        async function carregarRegistro() {
            try {
                const registro = await buscarIntervencaoParaEdicao({
                    intervencaoId,
                    token,
                    signal: controller.signal,
                });

                if (!ativo) return;

                if (String(registro.id) !== String(intervencaoId)) {
                    throw new Error(
                        "A API retornou uma intervenção " +
                            "diferente da selecionada.",
                    );
                }

                setIntervencao(registro);
                setErro("");
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setIntervencao(null);
                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregandoRegistro(false);
                }
            }
        }

        carregarRegistro();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [intervencaoId, token, versaoRegistro]);

    // ==========================================
    // ATUALIZAR LISTA
    // ==========================================

    function recarregarLista() {
        if (carregandoLista || carregandoRegistro || exclusaoPendente.current) {
            return;
        }

        selecionarIntervencao("");

        setCarregandoLista(true);
        setErroLista("");

        setVersaoLista((anterior) => anterior + 1);
    }

    // ==========================================
    // ATUALIZAR DADOS DO REGISTRO
    // ==========================================

    function recarregarRegistro() {
        if (!intervencaoId || carregandoRegistro || exclusaoPendente.current) {
            return;
        }

        setIntervencao(null);
        setConfirmacao("");

        setErro("");
        setSucesso("");

        setCarregandoRegistro(true);

        setVersaoRegistro((anterior) => anterior + 1);
    }

    // ==========================================
    // VALIDAR CONFIRMAÇÃO
    // ==========================================

    const textoEsperado = intervencao ? `EXCLUIR ${intervencao.id}` : "";

    const confirmacaoCorreta = Boolean(
        intervencao && confirmacao === textoEsperado,
    );

    const podeExcluir = Boolean(
        confirmacaoCorreta &&
        !carregandoRegistro &&
        !carregandoLista &&
        !excluindo,
    );

    // ==========================================
    // CONFIRMAR EXCLUSÃO
    // ==========================================

    async function confirmarExclusao(evento) {
        evento.preventDefault();

        if (!podeExcluir || exclusaoPendente.current || !intervencao) {
            return;
        }

        // Guarda uma identificação imutável
        // para a operação iniciada.
        const registroAtual = intervencao;

        const id = registroAtual.id;

        // ========================================
        // SEGUNDA CONFIRMAÇÃO
        // ========================================

        const confirmou = window.confirm(
            "EXCLUSÃO DE INTERVENÇÃO\n\n" +
                `ID: ${id}\n` +
                `Aluno ID: ${registroAtual.aluno_id}\n` +
                `Etapa: ${formatarEtapa(registroAtual.etapa)}\n` +
                `Data: ${formatarData(registroAtual.data_intervencao)}\n\n` +
                "Esta operação pode remover informações " +
                "importantes do acompanhamento escolar.\n\n" +
                "Confirme somente se o registro for " +
                "fictício e descartável.\n\n" +
                "Deseja continuar?",
        );

        if (!confirmou) return;

        // ========================================
        // BLOQUEAR SEGUNDO ENVIO
        // ========================================

        exclusaoPendente.current = true;

        setExcluindo(true);
        setErro("");
        setSucesso("");

        try {
            // ======================================
            // DELETE NO FASTAPI
            // ======================================

            await excluirIntervencao({
                intervencaoId: id,
                token,
            });

            // ======================================
            // SUCESSO HTTP
            // ======================================

            setSucesso("Solicitação de exclusão " + "confirmada pelo FastAPI.");

            // Limpa os dados selecionados.
            setIntervencaoId("");
            setIntervencao(null);
            setConfirmacao("");

            // Atualiza as opções.
            setCarregandoLista(true);

            setVersaoLista((anterior) => anterior + 1);

            // Atualiza a listagem principal.
            onExclusaoRealizada?.();
        } catch (falha) {
            setErro(mensagemDeErro(falha));

            // Exige nova confirmação
            // antes de outra tentativa.
            setConfirmacao("");
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
            className="exclusao-intervencao"
            aria-labelledby="exclusao-intervencao-titulo"
        >
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <div className="exclusao-intervencao-topo">
                <h2 id="exclusao-intervencao-titulo">Excluir intervenção</h2>

                <p>
                    Consulte o registro selecionado e confirme a operação com
                    atenção.
                </p>
            </div>

            {/* ======================================
          AVISO
      ====================================== */}

            <div className="exclusao-intervencao-aviso" role="note">
                <strong>Atenção: possível perda de histórico</strong>

                <p>
                    Intervenções documentam ações de acompanhamento escolar.
                    Utilize apenas registros fictícios descartáveis nos testes
                    de exclusão.
                </p>
            </div>

            {/* ======================================
          SELETOR
      ====================================== */}

            <div className="exclusao-intervencao-selecao">
                <label htmlFor="exclusao-intervencao-registro">
                    Intervenção *
                </label>

                <select
                    id="exclusao-intervencao-registro"
                    value={intervencaoId}
                    onChange={(evento) => {
                        selecionarIntervencao(evento.target.value);
                    }}
                    disabled={
                        carregandoLista || carregandoRegistro || excluindo
                    }
                >
                    <option value="">
                        {carregandoLista
                            ? "Carregando intervenções..."
                            : "Selecione uma intervenção"}
                    </option>

                    {lista.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                            {identificarIntervencao(item)}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="exclusao-intervencao-botao-secundario"
                    onClick={recarregarLista}
                    disabled={
                        carregandoLista || carregandoRegistro || excluindo
                    }
                >
                    Atualizar lista
                </button>

                <small>
                    Confirme o ID, o aluno, a etapa e a data antes de
                    prosseguir.
                </small>
            </div>

            {/* ======================================
          CARREGAMENTO
      ====================================== */}

            {carregandoLista && (
                <p className="exclusao-intervencao-mensagem" role="status">
                    Carregando intervenções...
                </p>
            )}

            {carregandoRegistro && (
                <p className="exclusao-intervencao-mensagem" role="status">
                    Consultando os dados do registro...
                </p>
            )}

            {/* ======================================
          ERROS
      ====================================== */}

            {erroLista && (
                <p
                    className={
                        "exclusao-intervencao-mensagem " +
                        "exclusao-intervencao-mensagem--erro"
                    }
                    role="alert"
                >
                    {erroLista}
                </p>
            )}

            {erro && (
                <p
                    className={
                        "exclusao-intervencao-mensagem " +
                        "exclusao-intervencao-mensagem--erro"
                    }
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {!intervencaoId && !sucesso && (
                <p className="exclusao-intervencao-orientacao">
                    Selecione um registro na lista para visualizar seus dados e
                    habilitar a confirmação.
                </p>
            )}

            {/* ======================================
          DADOS DA INTERVENÇÃO
      ====================================== */}

            {intervencao && !carregandoRegistro && (
                <form onSubmit={confirmarExclusao}>
                    <div className="exclusao-intervencao-dados">
                        <h3>Confira os dados da intervenção</h3>

                        <dl>
                            <div>
                                <dt>ID da intervenção</dt>
                                <dd>{intervencao.id}</dd>
                            </div>

                            <div>
                                <dt>ID do aluno</dt>
                                <dd>{intervencao.aluno_id}</dd>
                            </div>

                            <div>
                                <dt>Etapa</dt>
                                <dd>{formatarEtapa(intervencao.etapa)}</dd>
                            </div>

                            <div>
                                <dt>Status</dt>
                                <dd>{formatarStatus(intervencao.status)}</dd>
                            </div>

                            <div>
                                <dt>Data da intervenção</dt>
                                <dd>
                                    {formatarData(intervencao.data_intervencao)}
                                </dd>
                            </div>

                            <div>
                                <dt>Responsável</dt>
                                <dd>
                                    {intervencao.responsavel || "Não informado"}
                                </dd>
                            </div>

                            <div>
                                <dt>Próximo contato</dt>
                                <dd>
                                    {formatarData(intervencao.proximo_contato)}
                                </dd>
                            </div>

                            <div>
                                <dt>Descrição</dt>
                                <dd>
                                    {intervencao.descricao || "Não informada"}
                                </dd>
                            </div>

                            <div>
                                <dt>Resultado</dt>
                                <dd>
                                    {intervencao.resultado || "Não informado"}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* ==================================
              CONFIRMAÇÃO DIGITADA
          ================================== */}

                    <div className="exclusao-intervencao-confirmacao">
                        <label htmlFor="exclusao-intervencao-texto">
                            Para habilitar a exclusão, digite exatamente:
                        </label>

                        <strong>{textoEsperado}</strong>

                        <input
                            id="exclusao-intervencao-texto"
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            placeholder={textoEsperado}
                            value={confirmacao}
                            onChange={(evento) => {
                                setConfirmacao(evento.target.value);
                                setErro("");
                            }}
                            disabled={excluindo}
                            required
                        />

                        <small>
                            A confirmação diferencia maiúsculas e espaços.
                        </small>
                    </div>

                    {/* ==================================
              BOTÕES
          ================================== */}

                    <div className="exclusao-intervencao-acoes">
                        <button
                            type="submit"
                            className="exclusao-intervencao-botao-excluir"
                            disabled={!podeExcluir}
                        >
                            {excluindo
                                ? "Solicitando exclusão..."
                                : "Confirmar exclusão"}
                        </button>

                        <button
                            type="button"
                            className="exclusao-intervencao-botao-secundario"
                            onClick={recarregarRegistro}
                            disabled={carregandoRegistro || excluindo}
                        >
                            Recarregar dados
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
                        "exclusao-intervencao-mensagem " +
                        "exclusao-intervencao-mensagem--sucesso"
                    }
                    role="status"
                >
                    {sucesso}
                </p>
            )}
        </section>
    );
}

export default ExclusaoIntervencao;
