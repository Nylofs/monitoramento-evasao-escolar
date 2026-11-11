import { useEffect, useRef, useState } from "react";

import { apiRequest } from "../services/apiClient";

import {
    ETAPAS_INTERVENCAO,
    STATUS_INTERVENCAO,
} from "../services/cadastroIntervencaoService";

import {
    listarIntervencoesParaEdicao,
    buscarIntervencaoParaEdicao,
    atualizarIntervencao,
} from "../services/edicaoIntervencaoService";

// ============================================
// TRATAR ERROS
// ============================================

function mensagemDeErro(erro) {
    const detalhe = erro.detalhes?.detail;

    if (erro.status === 401) {
        return "Sessão expirada. Faça login novamente.";
    }

    if (erro.status === 403) {
        return "Você não possui permissão para esta operação.";
    }

    if (erro.status === 404) {
        return "Intervenção não encontrada ou sem acesso.";
    }

    if (erro.status === 405) {
        return (
            "Método não permitido. Confira a rota " + "PUT ou PATCH no Swagger."
        );
    }

    if (erro.status === 409) {
        return "A alteração foi bloqueada por uma regra de negócio.";
    }

    if (erro.status === 400) {
        return typeof detalhe === "string"
            ? detalhe
            : "Os dados não atendem às regras do backend.";
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

        return "Dados rejeitados. Confira IntervencaoUpdate.";
    }

    return erro.message || "Não foi possível concluir a operação.";
}

// ============================================
// NORMALIZAR DATA
// ============================================

function dataParaFormulario(valor) {
    if (!valor) return "";

    return String(valor).slice(0, 10);
}

// ============================================
// NORMALIZAR REGISTRO
// ============================================

function prepararDados(registro) {
    return {
        alunoId: String(registro.aluno_id ?? ""),
        etapa: String(registro.etapa ?? ""),
        status: String(registro.status ?? ""),
        dataIntervencao: dataParaFormulario(registro.data_intervencao),
        descricao: String(registro.descricao ?? ""),
        resultado: String(registro.resultado ?? ""),
        responsavel: String(registro.responsavel ?? ""),
        proximoContato: dataParaFormulario(registro.proximo_contato),
    };
}

// ============================================
// COMPARAR DADOS
// ============================================

function dadosIguais(a, b) {
    if (!a || !b) return false;

    return (
        a.alunoId === b.alunoId &&
        a.etapa === b.etapa &&
        a.status === b.status &&
        a.dataIntervencao === b.dataIntervencao &&
        a.descricao === b.descricao &&
        a.resultado === b.resultado &&
        a.responsavel === b.responsavel &&
        a.proximoContato === b.proximoContato
    );
}

// ============================================
// FORMATAR DATA PARA O SELETOR
// ============================================

function formatarData(valor) {
    const data = dataParaFormulario(valor);

    const partes = data.split("-");

    if (partes.length !== 3) {
        return "Data não informada";
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
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
// IDENTIFICAR INTERVENÇÃO
// ============================================

function identificarIntervencao(item, nomesAlunos) {
    const nome =
        nomesAlunos[String(item.aluno_id)] || `Aluno ID ${item.aluno_id}`;

    const etapa =
        ETAPAS_INTERVENCAO.find((opcao) => opcao.valor === item.etapa)?.nome ||
        item.etapa ||
        "Etapa não informada";

    return (
        `#${item.id} — ${nome} — ` +
        `${formatarData(item.data_intervencao)} — ${etapa}`
    );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function FormularioEdicaoIntervencao({ token, onAtualizacaoRealizada }) {
    // ==========================================
    // LISTAGEM E NOMES
    // ==========================================

    const [lista, setLista] = useState([]);
    const [nomesAlunos, setNomesAlunos] = useState({});

    const [carregandoLista, setCarregandoLista] = useState(true);

    const [versaoLista, setVersaoLista] = useState(0);

    // ==========================================
    // INTERVENÇÃO SELECIONADA
    // ==========================================

    const [intervencaoId, setIntervencaoId] = useState("");

    const [registro, setRegistro] = useState(null);

    const [dados, setDados] = useState(null);

    const [originais, setOriginais] = useState(null);

    const [carregandoRegistro, setCarregandoRegistro] = useState(false);

    const [versaoRegistro, setVersaoRegistro] = useState(0);

    // ==========================================
    // SALVAMENTO
    // ==========================================

    const [salvando, setSalvando] = useState(false);

    const envioPendente = useRef(false);

    // ==========================================
    // MENSAGENS
    // ==========================================

    const [erroLista, setErroLista] = useState("");

    const [erro, setErro] = useState("");

    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // CARREGAR INTERVENÇÕES DISPONÍVEIS
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();
        let ativo = true;

        async function carregarLista() {
            try {
                const resposta = await listarIntervencoesParaEdicao({
                    token,
                    signal: controller.signal,
                });

                if (!ativo) return;

                setLista(resposta);
                setErroLista("");

                // Consulta complementar para exibir
                // os nomes no seletor.
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
                    // A listagem deve continuar
                    // funcionando mesmo se a consulta
                    // complementar falhar.
                    if (ativo) {
                        setNomesAlunos({});
                    }
                }
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
        if (envioPendente.current) return;

        setIntervencaoId(novoId);

        setRegistro(null);
        setDados(null);
        setOriginais(null);

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
                const resposta = await buscarIntervencaoParaEdicao({
                    intervencaoId,
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
    }, [intervencaoId, token, versaoRegistro]);

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
    // DETECTAR ALTERAÇÕES
    // ==========================================

    const alterado = Boolean(
        dados && originais && !dadosIguais(dados, originais),
    );

    // ==========================================
    // DESFAZER ALTERAÇÕES LOCAIS
    // ==========================================

    function desfazerAlteracoes() {
        if (!originais || envioPendente.current) {
            return;
        }

        setDados({ ...originais });
        setErro("");
        setSucesso("");
    }

    // ==========================================
    // RECARREGAR INTERVENÇÃO
    // ==========================================

    function recarregarRegistro() {
        if (!intervencaoId || carregandoRegistro || envioPendente.current) {
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
    // RECARREGAR LISTAGEM
    // ==========================================

    function recarregarLista() {
        if (carregandoLista || envioPendente.current) {
            return;
        }

        selecionarIntervencao("");

        setCarregandoLista(true);

        setVersaoLista((anterior) => anterior + 1);
    }

    // ==========================================
    // SALVAR ALTERAÇÕES
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
            const resposta = await atualizarIntervencao({
                intervencaoId: registro.id,
                alunoId: dados.alunoId,
                etapa: dados.etapa,
                status: dados.status,
                dataIntervencao: dados.dataIntervencao,
                descricao: dados.descricao,
                resultado: dados.resultado,
                responsavel: dados.responsavel,
                proximoContato: dados.proximoContato,
                token,
            });

            // Apenas após sucesso HTTP.
            setSucesso("Intervenção atualizada com sucesso!");

            // Se a API retornou o registro atualizado,
            // usamos os valores persistidos na resposta.
            if (
                resposta &&
                typeof resposta === "object" &&
                String(resposta.id) === String(registro.id)
            ) {
                const valores = prepararDados(resposta);

                setRegistro(resposta);
                setDados(valores);
                setOriginais({ ...valores });
            } else {
                // Caso o endpoint retorne 204,
                // guardamos os valores enviados.
                // A conferência definitiva será pelo GET.
                setOriginais({ ...dados });
            }

            // Recarrega as opções e a listagem.
            setCarregandoLista(true);

            setVersaoLista((anterior) => anterior + 1);

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
            className="edicao-intervencao"
            aria-labelledby="edicao-intervencao-titulo"
        >
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <div className="edicao-intervencao-topo">
                <h2 id="edicao-intervencao-titulo">Editar intervenção</h2>

                <p>
                    Selecione um acompanhamento existente, confira seus dados e
                    atualize as informações permitidas.
                </p>
            </div>

            {/* ======================================
          SELETOR DO REGISTRO
      ====================================== */}

            <div className="edicao-intervencao-selecao">
                <label htmlFor="edicao-intervencao-registro">
                    Intervenção *
                </label>

                <select
                    id="edicao-intervencao-registro"
                    value={intervencaoId}
                    onChange={(evento) => {
                        selecionarIntervencao(evento.target.value);
                    }}
                    disabled={carregandoLista || carregandoRegistro || salvando}
                >
                    <option value="">
                        {carregandoLista
                            ? "Carregando intervenções..."
                            : "Selecione uma intervenção"}
                    </option>

                    {lista.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                            {identificarIntervencao(item, nomesAlunos)}
                        </option>
                    ))}
                </select>

                <small>
                    Selecione pelo ID, nome do aluno, data e etapa da
                    intervenção.
                </small>
            </div>

            {/* ======================================
          BOTÕES DE ATUALIZAÇÃO
      ====================================== */}

            <div className="edicao-intervencao-acoes">
                <button
                    type="button"
                    className="edicao-intervencao-botao-secundario"
                    onClick={recarregarLista}
                    disabled={carregandoLista || salvando}
                >
                    Atualizar lista
                </button>

                <button
                    type="button"
                    className="edicao-intervencao-botao-secundario"
                    onClick={recarregarRegistro}
                    disabled={!intervencaoId || carregandoRegistro || salvando}
                >
                    Recarregar registro
                </button>
            </div>

            {/* ======================================
          MENSAGENS
      ====================================== */}

            {carregandoLista && (
                <p className="edicao-intervencao-mensagem" role="status">
                    Carregando intervenções disponíveis...
                </p>
            )}

            {carregandoRegistro && (
                <p className="edicao-intervencao-mensagem" role="status">
                    Consultando os dados atuais...
                </p>
            )}

            {erroLista && (
                <p
                    className="edicao-intervencao-mensagem edicao-intervencao-mensagem--erro"
                    role="alert"
                >
                    {erroLista}
                </p>
            )}

            {erro && (
                <p
                    className="edicao-intervencao-mensagem edicao-intervencao-mensagem--erro"
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {!intervencaoId && !carregandoLista && (
                <p className="edicao-intervencao-orientacao">
                    Selecione uma intervenção para carregar os dados antes de
                    realizar alterações.
                </p>
            )}

            {/* ======================================
          FORMULÁRIO DE EDIÇÃO
      ====================================== */}

            {registro && dados && !carregandoRegistro && (
                <form onSubmit={salvarAlteracoes}>
                    {/* IDENTIFICAÇÃO */}

                    <div className="edicao-intervencao-identificacao">
                        <strong>Intervenção ID {registro.id}</strong>

                        <span>
                            {nomesAlunos[String(registro.aluno_id)] ||
                                `Aluno ID ${registro.aluno_id}`}
                        </span>
                    </div>

                    <div className="edicao-intervencao-campos">
                        {/* ALUNO - SOMENTE LEITURA */}

                        <div className="edicao-intervencao-campo">
                            <label htmlFor="edicao-intervencao-aluno">
                                ID do aluno
                            </label>

                            <input
                                id="edicao-intervencao-aluno"
                                type="text"
                                value={dados.alunoId}
                                readOnly
                            />

                            <small>O aluno vinculado não será alterado.</small>
                        </div>

                        {/* DATA ORIGINAL - SOMENTE LEITURA */}

                        <div className="edicao-intervencao-campo">
                            <label htmlFor="edicao-intervencao-data">
                                Data da intervenção
                            </label>

                            <input
                                id="edicao-intervencao-data"
                                type="date"
                                value={dados.dataIntervencao}
                                readOnly
                            />

                            <small>Data original preservada nesta parte.</small>
                        </div>

                        {/* ETAPA */}

                        <div className="edicao-intervencao-campo">
                            <label htmlFor="edicao-intervencao-etapa">
                                Etapa *
                            </label>

                            <select
                                id="edicao-intervencao-etapa"
                                value={dados.etapa}
                                onChange={(evento) => {
                                    alterarCampo("etapa", evento.target.value);
                                }}
                                disabled={salvando}
                                required
                            >
                                <option value="">Selecione a etapa</option>

                                {ETAPAS_INTERVENCAO.map((item) => (
                                    <option key={item.valor} value={item.valor}>
                                        {item.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* STATUS */}

                        <div className="edicao-intervencao-campo">
                            <label htmlFor="edicao-intervencao-status">
                                Status *
                            </label>

                            <select
                                id="edicao-intervencao-status"
                                value={dados.status}
                                onChange={(evento) => {
                                    alterarCampo("status", evento.target.value);
                                }}
                                disabled={salvando}
                                required
                            >
                                <option value="">Selecione o status</option>

                                {STATUS_INTERVENCAO.map((item) => (
                                    <option key={item.valor} value={item.valor}>
                                        {item.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* PRÓXIMO CONTATO */}

                        <div className="edicao-intervencao-campo">
                            <label htmlFor="edicao-intervencao-proximo">
                                Próximo contato
                            </label>

                            <input
                                id="edicao-intervencao-proximo"
                                type="date"
                                value={dados.proximoContato}
                                onChange={(evento) => {
                                    alterarCampo(
                                        "proximoContato",
                                        evento.target.value,
                                    );
                                }}
                                disabled={salvando}
                            />
                        </div>

                        {/* RESPONSÁVEL */}

                        <div className="edicao-intervencao-campo">
                            <label htmlFor="edicao-intervencao-responsavel">
                                Responsável *
                            </label>

                            <input
                                id="edicao-intervencao-responsavel"
                                type="text"
                                value={dados.responsavel}
                                onChange={(evento) => {
                                    alterarCampo(
                                        "responsavel",
                                        evento.target.value,
                                    );
                                }}
                                disabled={salvando}
                                minLength={3}
                                required
                            />
                        </div>
                    </div>

                    {/* DESCRIÇÃO */}

                    <div className="edicao-intervencao-campo edicao-intervencao-texto">
                        <label htmlFor="edicao-intervencao-descricao">
                            Descrição *
                        </label>

                        <textarea
                            id="edicao-intervencao-descricao"
                            rows={5}
                            value={dados.descricao}
                            onChange={(evento) => {
                                alterarCampo("descricao", evento.target.value);
                            }}
                            disabled={salvando}
                            required
                        />
                    </div>

                    {/* RESULTADO */}

                    <div className="edicao-intervencao-campo edicao-intervencao-texto">
                        <label htmlFor="edicao-intervencao-resultado">
                            Resultado
                        </label>

                        <textarea
                            id="edicao-intervencao-resultado"
                            rows={4}
                            value={dados.resultado}
                            onChange={(evento) => {
                                alterarCampo("resultado", evento.target.value);
                            }}
                            disabled={salvando}
                            placeholder="Resultado do acompanhamento"
                        />
                    </div>

                    {/* SUCESSO */}

                    {sucesso && (
                        <p
                            className="edicao-intervencao-mensagem edicao-intervencao-mensagem--sucesso"
                            role="status"
                        >
                            {sucesso}
                        </p>
                    )}

                    {/* AÇÕES */}

                    <div className="edicao-intervencao-acoes">
                        <button
                            type="submit"
                            className="edicao-intervencao-botao-salvar"
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
                            className="edicao-intervencao-botao-secundario"
                            onClick={desfazerAlteracoes}
                            disabled={!alterado || salvando}
                        >
                            Desfazer alterações locais
                        </button>
                    </div>

                    <p className="edicao-intervencao-observacao">
                        O FastAPI validará as permissões e as regras de
                        atualização. Utilize apenas intervenções fictícias nos
                        testes.
                    </p>
                </form>
            )}
        </section>
    );
}

export default FormularioEdicaoIntervencao;
