import { useEffect, useRef, useState } from "react";

import {
    listarFrequenciasParaEdicao,
    buscarFrequenciaParaEdicao,
    atualizarFrequencia,
    SITUACOES_EDICAO,
} from "../services/edicaoFrequenciaService";

import { apiRequest } from "../services/apiClient";

// ============================================
// MENSAGENS DE ERRO
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return "Sessão inválida ou expirada. Faça login novamente.";
    }

    if (erro.status === 403) {
        return "Você não possui permissão para consultar ou editar este registro.";
    }

    if (erro.status === 404) {
        return "Frequência ou aluno não encontrado, ou sem acesso.";
    }

    if (erro.status === 405) {
        return "Método não permitido. Confira PUT ou PATCH no Swagger.";
    }

    if (erro.status === 409) {
        return "A alteração entrou em conflito com uma regra do sistema.";
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

        return "O FastAPI rejeitou os dados. Confira o schema no Swagger.";
    }

    return erro.message || "Não foi possível concluir a operação.";
}

// ============================================
// NORMALIZAR DATA
// ============================================

function dataParaFormulario(valor) {
    if (!valor) return "";

    // Aceita data ISO ou datetime ISO.
    // Usa somente a parte da data, sem
    // converter fuso horário.
    return String(valor).slice(0, 10);
}

// ============================================
// PREPARAR DADOS ORIGINAIS
// ============================================

function prepararDados(registro) {
    return {
        alunoId: String(registro.aluno_id ?? ""),
        data: dataParaFormulario(registro.data),
        situacao: String(registro.situacao ?? ""),
        observacao: String(registro.observacao ?? ""),
    };
}

// ============================================
// COMPARAR DADOS
// ============================================

function dadosIguais(a, b) {
    if (!a || !b) return false;

    return (
        a.alunoId === b.alunoId &&
        a.data === b.data &&
        a.situacao === b.situacao &&
        a.observacao === b.observacao
    );
}

// ============================================
// EXTRAIR LISTA DE ALUNOS
// ============================================

function extrairAlunos(resposta) {
    if (Array.isArray(resposta)) return resposta;
    if (Array.isArray(resposta?.items)) return resposta.items;
    if (Array.isArray(resposta?.resultados)) {
        return resposta.resultados;
    }
    if (Array.isArray(resposta?.data)) return resposta.data;
    return [];
}

// ============================================
// FORMATAR IDENTIFICAÇÃO
// ============================================

function identificarRegistro(registro, nomes) {
    const nomeAluno =
        nomes[String(registro.aluno_id)] || `Aluno ID ${registro.aluno_id}`;

    const data = dataParaFormulario(registro.data);

    return (
        `#${registro.id} — ${nomeAluno} — ` +
        `${data || "sem data"} — ${registro.situacao ?? ""}`
    );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function FormularioEdicaoFrequencia({ token, onAtualizacaoRealizada }) {
    // ==========================================
    // SELETOR
    // ==========================================

    const [frequencias, setFrequencias] = useState([]);
    const [nomesAlunos, setNomesAlunos] = useState({});
    const [frequenciaId, setFrequenciaId] = useState("");

    // ==========================================
    // CONSULTA E FORMULÁRIO
    // ==========================================

    const [registro, setRegistro] = useState(null);
    const [dados, setDados] = useState(null);
    const [originais, setOriginais] = useState(null);

    // ==========================================
    // CONTROLES
    // ==========================================

    const [carregandoLista, setCarregandoLista] = useState(true);

    const [carregandoRegistro, setCarregandoRegistro] = useState(false);

    const [salvando, setSalvando] = useState(false);

    const [versaoLista, setVersaoLista] = useState(0);
    const [versaoRegistro, setVersaoRegistro] = useState(0);

    const envioPendente = useRef(false);

    // ==========================================
    // MENSAGENS
    // ==========================================

    const [erroLista, setErroLista] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // CARREGAR LISTAGEM E NOMES DOS ALUNOS
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();
        let ativo = true;

        async function carregarLista() {
            try {
                const lista = await listarFrequenciasParaEdicao({
                    token,
                    signal: controller.signal,
                });

                if (!ativo) return;

                setFrequencias(lista);
                setErroLista("");

                // A consulta de nomes é complementar:
                // não deve bloquear a lista de frequências.
                try {
                    const respostaAlunos = await apiRequest("/api/alunos", {
                        method: "GET",
                        token,
                        signal: controller.signal,
                    });

                    if (!ativo) return;

                    const mapa = {};

                    for (const aluno of extrairAlunos(respostaAlunos)) {
                        mapa[String(aluno.id)] =
                            aluno.nome || `Aluno ID ${aluno.id}`;
                    }

                    setNomesAlunos(mapa);
                } catch {
                    if (ativo) {
                        setNomesAlunos({});
                    }
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setFrequencias([]);
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
    // SELECIONAR REGISTRO
    // ==========================================

    function selecionarRegistro(id) {
        if (envioPendente.current) return;

        setFrequenciaId(id);
        setRegistro(null);
        setDados(null);
        setOriginais(null);

        setErro("");
        setSucesso("");
        setCarregandoRegistro(Boolean(id));
    }

    // ==========================================
    // CONSULTAR REGISTRO INDIVIDUAL
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

                const valores = prepararDados(resposta);

                setRegistro(resposta);
                setDados(valores);
                setOriginais({ ...valores });
                setErro("");
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setRegistro(null);
                setDados(null);
                setOriginais(null);
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
    // ALTERAR CAMPO
    // ==========================================

    function alterarCampo(campo, valor) {
        if (envioPendente.current) return;

        setDados((anterior) =>
            anterior ? { ...anterior, [campo]: valor } : anterior,
        );

        setErro("");
        setSucesso("");
    }

    // ==========================================
    // VERIFICAR ALTERAÇÕES
    // ==========================================

    const alterado = Boolean(
        dados && originais && !dadosIguais(dados, originais),
    );

    // ==========================================
    // DESFAZER ALTERAÇÕES LOCAIS
    // ==========================================

    function desfazerAlteracoes() {
        if (!originais || envioPendente.current) return;

        setDados({ ...originais });
        setErro("");
        setSucesso("");
    }

    // ==========================================
    // RECARREGAR REGISTRO
    // ==========================================

    function recarregarRegistro() {
        if (!frequenciaId || carregandoRegistro || envioPendente.current) {
            return;
        }

        setRegistro(null);
        setDados(null);
        setOriginais(null);
        setErro("");
        setSucesso("");

        setCarregandoRegistro(true);
        setVersaoRegistro((anterior) => anterior + 1);
    }

    // ==========================================
    // RECARREGAR OPÇÕES
    // ==========================================

    function recarregarLista() {
        if (envioPendente.current || carregandoLista) {
            return;
        }

        // Descarta a seleção e as mudanças locais.
        selecionarRegistro("");
        setCarregandoLista(true);
        setVersaoLista((anterior) => anterior + 1);
    }

    // ==========================================
    // SALVAR ATUALIZAÇÃO
    // ==========================================

    async function salvarAlteracoes(evento) {
        evento.preventDefault();

        if (envioPendente.current || !registro || !dados || !alterado) {
            return;
        }

        envioPendente.current = true;
        setSalvando(true);
        setErro("");
        setSucesso("");

        try {
            await atualizarFrequencia({
                frequenciaId: registro.id,
                alunoId: dados.alunoId,
                data: dados.data,
                situacao: dados.situacao,
                observacao: dados.observacao,
                token,
            });

            // Confirmação somente após HTTP 2xx.
            setSucesso("Frequência atualizada com sucesso!");

            // Atualizar os dados originais locais.
            setOriginais({ ...dados });

            // Recarregar o seletor e a listagem.
            setVersaoLista((anterior) => anterior + 1);
            setCarregandoLista(true);

            onAtualizacaoRealizada?.();
        } catch (falha) {
            setErro(mensagemDeErro(falha));
        } finally {
            envioPendente.current = false;
            setSalvando(false);
        }
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <section
            className="edicao-frequencia"
            aria-labelledby="edicao-frequencia-titulo"
        >
            <div className="edicao-frequencia-topo">
                <h2 id="edicao-frequencia-titulo">Editar frequência</h2>

                <p>
                    Selecione um lançamento existente, confira seus dados e
                    atualize apenas as informações permitidas.
                </p>
            </div>

            {/* ======================================
          SELEÇÃO DO REGISTRO
      ====================================== */}

            <div className="edicao-frequencia-selecao">
                <label htmlFor="edicao-frequencia-registro">
                    Registro de frequência *
                </label>

                <select
                    id="edicao-frequencia-registro"
                    value={frequenciaId}
                    onChange={(evento) => {
                        selecionarRegistro(evento.target.value);
                    }}
                    disabled={carregandoLista || carregandoRegistro || salvando}
                >
                    <option value="">
                        {carregandoLista
                            ? "Carregando registros..."
                            : "Selecione uma frequência"}
                    </option>

                    {frequencias.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                            {identificarRegistro(item, nomesAlunos)}
                        </option>
                    ))}
                </select>

                <small>
                    Selecione pelo ID, aluno e data. Os registros disponíveis
                    dependem das permissões e da resposta da API.
                </small>
            </div>

            <div className="edicao-frequencia-acoes">
                <button
                    type="button"
                    className="edicao-frequencia-botao-secundario"
                    onClick={recarregarLista}
                    disabled={carregandoLista || salvando}
                >
                    Atualizar lista de registros
                </button>

                <button
                    type="button"
                    className="edicao-frequencia-botao-secundario"
                    onClick={recarregarRegistro}
                    disabled={!frequenciaId || carregandoRegistro || salvando}
                >
                    Recarregar registro selecionado
                </button>
            </div>

            {/* ======================================
          ESTADOS DE CARREGAMENTO
      ====================================== */}

            {carregandoLista && (
                <p className="edicao-frequencia-mensagem" role="status">
                    Carregando frequências disponíveis...
                </p>
            )}

            {carregandoRegistro && (
                <p className="edicao-frequencia-mensagem" role="status">
                    Consultando os dados atuais do registro...
                </p>
            )}

            {erroLista && (
                <p
                    className="edicao-frequencia-mensagem edicao-frequencia-mensagem--erro"
                    role="alert"
                >
                    {erroLista}
                </p>
            )}

            {erro && (
                <p
                    className="edicao-frequencia-mensagem edicao-frequencia-mensagem--erro"
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {!frequenciaId && !carregandoLista && (
                <p className="edicao-frequencia-orientacao">
                    Escolha um lançamento para visualizar seus dados antes de
                    editar.
                </p>
            )}

            {/* ======================================
          FORMULÁRIO DE EDIÇÃO
      ====================================== */}

            {registro && dados && !carregandoRegistro && (
                <form onSubmit={salvarAlteracoes}>
                    <div className="edicao-frequencia-identificacao">
                        <strong>Frequência ID {registro.id}</strong>

                        <span>
                            {nomesAlunos[String(registro.aluno_id)] ||
                                `Aluno ID ${registro.aluno_id}`}
                        </span>
                    </div>

                    <div className="edicao-frequencia-campos">
                        {/* ALUNO VINCULADO */}

                        <div className="edicao-frequencia-campo">
                            <label htmlFor="edicao-frequencia-aluno">
                                ID do aluno
                            </label>

                            <input
                                id="edicao-frequencia-aluno"
                                type="number"
                                value={dados.alunoId}
                                readOnly
                            />

                            <small>
                                O vínculo com o aluno será mantido nesta etapa.
                            </small>
                        </div>

                        {/* DATA */}

                        <div className="edicao-frequencia-campo">
                            <label htmlFor="edicao-frequencia-data">
                                Data *
                            </label>

                            <input
                                id="edicao-frequencia-data"
                                type="date"
                                value={dados.data}
                                onChange={(evento) => {
                                    alterarCampo("data", evento.target.value);
                                }}
                                disabled={salvando}
                                required
                            />
                        </div>

                        {/* SITUAÇÃO */}

                        <div className="edicao-frequencia-campo">
                            <label htmlFor="edicao-frequencia-situacao">
                                Situação *
                            </label>

                            <select
                                id="edicao-frequencia-situacao"
                                value={dados.situacao}
                                onChange={(evento) => {
                                    alterarCampo(
                                        "situacao",
                                        evento.target.value,
                                    );
                                }}
                                disabled={salvando}
                                required
                            >
                                <option value="">Selecione</option>

                                {SITUACOES_EDICAO.map((item) => (
                                    <option key={item.valor} value={item.valor}>
                                        {item.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* OBSERVAÇÃO */}

                    <div className="edicao-frequencia-campo edicao-frequencia-observacao">
                        <label htmlFor="edicao-frequencia-observacao">
                            Observação
                        </label>

                        <textarea
                            id="edicao-frequencia-observacao"
                            rows={4}
                            value={dados.observacao}
                            onChange={(evento) => {
                                alterarCampo("observacao", evento.target.value);
                            }}
                            disabled={salvando}
                            placeholder="Observação do lançamento"
                        />
                    </div>

                    {/* SUCESSO */}

                    {sucesso && (
                        <p
                            className="edicao-frequencia-mensagem edicao-frequencia-mensagem--sucesso"
                            role="status"
                        >
                            {sucesso}
                        </p>
                    )}

                    {/* BOTÕES */}

                    <div className="edicao-frequencia-acoes">
                        <button
                            type="submit"
                            className="edicao-frequencia-botao-salvar"
                            disabled={
                                !alterado || carregandoRegistro || salvando
                            }
                        >
                            {salvando
                                ? "Salvando alterações..."
                                : "Salvar alterações"}
                        </button>

                        <button
                            type="button"
                            className="edicao-frequencia-botao-secundario"
                            onClick={desfazerAlteracoes}
                            disabled={!alterado || salvando}
                        >
                            Desfazer alterações locais
                        </button>
                    </div>

                    <p className="edicao-frequencia-observacao-final">
                        O FastAPI validará o JWT, a data, a situação e as regras
                        de atualização. Use somente registros fictícios nos
                        testes de edição.
                    </p>
                </form>
            )}
        </section>
    );
}

export default FormularioEdicaoFrequencia;
