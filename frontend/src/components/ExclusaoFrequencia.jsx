import { useEffect, useRef, useState } from "react";

import {
    listarFrequenciasParaEdicao,
    buscarFrequenciaParaEdicao,
} from "../services/edicaoFrequenciaService";

import { excluirFrequencia } from "../services/exclusaoFrequenciaService";

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return "Sessão inválida ou expirada. " + "Faça login novamente.";
    }

    if (erro.status === 403) {
        return "Você não possui permissão para " + "excluir esta frequência.";
    }

    if (erro.status === 404) {
        return (
            "Registro não encontrado ou sem acesso. " + "Recarregue a listagem."
        );
    }

    if (erro.status === 405) {
        return (
            "O método DELETE não está disponível. " +
            "Confira o endpoint no Swagger."
        );
    }

    if (erro.status === 409) {
        return (
            "A exclusão foi bloqueada por uma " +
            "regra de integridade ou conflito."
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

        return "A API rejeitou a operação. " + "Confira a resposta no Network.";
    }

    return erro.message || "Não foi possível excluir a frequência.";
}

// ============================================
// FORMATAR DATA PARA EXIBIÇÃO
// ============================================

function formatarData(valor) {
    if (!valor) return "Não informada";

    const texto = String(valor).slice(0, 10);

    const partes = texto.split("-");

    if (partes.length !== 3) {
        return texto;
    }

    const [ano, mes, dia] = partes;

    return `${dia}/${mes}/${ano}`;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function ExclusaoFrequencia({ token, onExclusaoRealizada }) {
    // ==========================================
    // LISTAGEM
    // ==========================================

    const [lista, setLista] = useState([]);
    const [carregandoLista, setCarregandoLista] = useState(true);

    const [versaoLista, setVersaoLista] = useState(0);

    // ==========================================
    // REGISTRO SELECIONADO
    // ==========================================

    const [frequenciaId, setFrequenciaId] = useState("");

    const [frequencia, setFrequencia] = useState(null);

    const [carregandoRegistro, setCarregandoRegistro] = useState(false);

    const [versaoRegistro, setVersaoRegistro] = useState(0);

    // ==========================================
    // CONFIRMAÇÃO
    // ==========================================

    const [confirmacao, setConfirmacao] = useState("");

    const [excluindo, setExcluindo] = useState(false);

    const exclusaoPendente = useRef(false);

    // ==========================================
    // MENSAGENS
    // ==========================================

    const [erroLista, setErroLista] = useState("");

    const [erro, setErro] = useState("");

    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // CARREGAR LISTA DE FREQUÊNCIAS
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();
        let ativo = true;

        async function carregarLista() {
            try {
                const resposta = await listarFrequenciasParaEdicao({
                    token,
                    signal: controller.signal,
                });

                if (!ativo) return;

                setLista(resposta);
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
    // SELECIONAR UMA FREQUÊNCIA
    // ==========================================

    function selecionarFrequencia(novoId) {
        if (exclusaoPendente.current) return;

        setFrequenciaId(novoId);
        setFrequencia(null);

        setConfirmacao("");
        setErro("");
        setSucesso("");

        setCarregandoRegistro(Boolean(novoId));
    }

    // ==========================================
    // BUSCAR DADOS INDIVIDUAIS
    // ==========================================

    useEffect(() => {
        if (!frequenciaId) return;

        const controller = new AbortController();
        let ativo = true;

        async function carregarRegistro() {
            try {
                const resposta = await buscarFrequenciaParaEdicao({
                    frequenciaId,
                    token,
                    signal: controller.signal,
                });

                if (!ativo) return;

                if (String(resposta.id) !== String(frequenciaId)) {
                    throw new Error("A API retornou outra frequência.");
                }

                setFrequencia(resposta);
                setErro("");
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setFrequencia(null);
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
    }, [frequenciaId, token, versaoRegistro]);

    // ==========================================
    // RECARREGAR LISTA
    // ==========================================

    function recarregarLista() {
        if (carregandoLista || exclusaoPendente.current) {
            return;
        }

        selecionarFrequencia("");

        setCarregandoLista(true);
        setErroLista("");

        setVersaoLista((anterior) => anterior + 1);
    }

    // ==========================================
    // RECARREGAR REGISTRO
    // ==========================================

    function recarregarRegistro() {
        if (!frequenciaId || carregandoRegistro || exclusaoPendente.current) {
            return;
        }

        setFrequencia(null);
        setConfirmacao("");

        setErro("");
        setSucesso("");

        setCarregandoRegistro(true);

        setVersaoRegistro((anterior) => anterior + 1);
    }

    // ==========================================
    // VALIDAÇÃO DA CONFIRMAÇÃO
    // ==========================================

    const textoEsperado = frequencia ? `EXCLUIR ${frequencia.id}` : "";

    const confirmacaoCorreta = Boolean(
        frequencia && confirmacao === textoEsperado,
    );

    const podeExcluir = Boolean(
        confirmacaoCorreta &&
        !carregandoRegistro &&
        !carregandoLista &&
        !excluindo,
    );

    // ==========================================
    // SOLICITAR EXCLUSÃO
    // ==========================================

    async function confirmarExclusao(evento) {
        evento.preventDefault();

        if (!podeExcluir || exclusaoPendente.current) {
            return;
        }

        const id = frequencia.id;
        const alunoId = frequencia.aluno_id;

        const data = formatarData(frequencia.data);

        const situacao = frequencia.situacao;

        // ========================================
        // SEGUNDA CONFIRMAÇÃO
        // ========================================

        const confirmou = window.confirm(
            "ATENÇÃO: EXCLUSÃO DE FREQUÊNCIA\n\n" +
                `Registro ID: ${id}\n` +
                `Aluno ID: ${alunoId}\n` +
                `Data: ${data}\n` +
                `Situação: ${situacao}\n\n` +
                "Este lançamento pode fazer parte " +
                "do histórico escolar e dos " +
                "indicadores de evasão.\n\n" +
                "Exclua somente um registro " +
                "fictício e descartável.\n\n" +
                "Deseja realmente continuar?",
        );

        if (!confirmou) return;

        exclusaoPendente.current = true;

        setExcluindo(true);
        setErro("");
        setSucesso("");

        try {
            await excluirFrequencia({
                frequenciaId: id,
                token,
            });

            // Operação confirmada pelo FastAPI.
            setSucesso("Operação de exclusão confirmada pelo FastAPI.");

            // Limpar seleção e confirmação.
            setFrequenciaId("");
            setFrequencia(null);
            setConfirmacao("");

            // Atualizar o seletor.
            setCarregandoLista(true);
            setVersaoLista((anterior) => anterior + 1);

            // Atualizar a listagem principal.
            onExclusaoRealizada?.();
        } catch (falha) {
            setErro(mensagemDeErro(falha));

            // Nova tentativa exige nova confirmação.
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
            className="exclusao-frequencia"
            aria-labelledby="exclusao-frequencia-titulo"
        >
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <div className="exclusao-frequencia-topo">
                <h2 id="exclusao-frequencia-titulo">Excluir frequência</h2>

                <p>
                    Consulte os dados de um lançamento e confirme a exclusão
                    apenas se o registro for fictício.
                </p>
            </div>

            {/* ======================================
          AVISO
      ====================================== */}

            <div className="exclusao-frequencia-aviso" role="note">
                <strong>Atenção: operação destrutiva</strong>

                <p>
                    Registros de frequência podem alimentar indicadores, alertas
                    e históricos escolares. Não exclua lançamentos reais apenas
                    para testar o sistema.
                </p>
            </div>

            {/* ======================================
          SELETOR DE FREQUÊNCIAS
      ====================================== */}

            <div className="exclusao-frequencia-selecao">
                <label htmlFor="exclusao-frequencia-registro">
                    Registro de frequência *
                </label>

                <select
                    id="exclusao-frequencia-registro"
                    value={frequenciaId}
                    onChange={(evento) => {
                        selecionarFrequencia(evento.target.value);
                    }}
                    disabled={
                        carregandoLista || carregandoRegistro || excluindo
                    }
                >
                    <option value="">
                        {carregandoLista
                            ? "Carregando frequências..."
                            : "Selecione uma frequência"}
                    </option>

                    {lista.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                            {`#${item.id} — Aluno ID ${
                                item.aluno_id
                            } — ${formatarData(item.data)} — ${
                                item.situacao ?? ""
                            }`}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="exclusao-frequencia-botao-secundario"
                    onClick={recarregarLista}
                    disabled={carregandoLista || excluindo}
                >
                    Atualizar lista
                </button>
            </div>

            {/* ======================================
          MENSAGENS
      ====================================== */}

            {carregandoLista && (
                <p className="exclusao-frequencia-mensagem" role="status">
                    Carregando registros disponíveis...
                </p>
            )}

            {carregandoRegistro && (
                <p className="exclusao-frequencia-mensagem" role="status">
                    Consultando a frequência selecionada...
                </p>
            )}

            {erroLista && (
                <p
                    className={
                        "exclusao-frequencia-mensagem " +
                        "exclusao-frequencia-mensagem--erro"
                    }
                    role="alert"
                >
                    {erroLista}
                </p>
            )}

            {erro && (
                <p
                    className={
                        "exclusao-frequencia-mensagem " +
                        "exclusao-frequencia-mensagem--erro"
                    }
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {!frequenciaId && !sucesso && (
                <p className="exclusao-frequencia-orientacao">
                    Selecione um lançamento na lista para carregar a
                    identificação antes de confirmar.
                </p>
            )}

            {/* ======================================
          DADOS E CONFIRMAÇÃO
      ====================================== */}

            {frequencia && !carregandoRegistro && (
                <form onSubmit={confirmarExclusao}>
                    <div className="exclusao-frequencia-dados">
                        <h3>Confira o lançamento</h3>

                        <dl>
                            <div>
                                <dt>ID da frequência</dt>
                                <dd>{frequencia.id}</dd>
                            </div>

                            <div>
                                <dt>ID do aluno</dt>
                                <dd>{frequencia.aluno_id}</dd>
                            </div>

                            <div>
                                <dt>Data</dt>
                                <dd>{formatarData(frequencia.data)}</dd>
                            </div>

                            <div>
                                <dt>Situação</dt>
                                <dd>
                                    {frequencia.situacao ?? "Não informada"}
                                </dd>
                            </div>

                            <div>
                                <dt>Observação</dt>
                                <dd>{frequencia.observacao || "Nenhuma"}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="exclusao-frequencia-confirmacao">
                        <label htmlFor="exclusao-frequencia-texto">
                            Para habilitar a exclusão, digite exatamente:
                        </label>

                        <strong>{textoEsperado}</strong>

                        <input
                            id="exclusao-frequencia-texto"
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            value={confirmacao}
                            placeholder={textoEsperado}
                            onChange={(evento) => {
                                setConfirmacao(evento.target.value);
                                setErro("");
                            }}
                            disabled={excluindo}
                            required
                        />

                        <p>A confirmação diferencia maiúsculas e espaços.</p>
                    </div>

                    <div className="exclusao-frequencia-acoes">
                        <button
                            type="submit"
                            className="exclusao-frequencia-botao-excluir"
                            disabled={!podeExcluir}
                        >
                            {excluindo
                                ? "Solicitando exclusão..."
                                : "Confirmar exclusão"}
                        </button>

                        <button
                            type="button"
                            className="exclusao-frequencia-botao-secundario"
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
                        "exclusao-frequencia-mensagem " +
                        "exclusao-frequencia-mensagem--sucesso"
                    }
                    role="status"
                >
                    {sucesso}
                </p>
            )}
        </section>
    );
}

export default ExclusaoFrequencia;
