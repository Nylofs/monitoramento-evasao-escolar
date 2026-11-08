import { useEffect, useState } from "react";

import SeletorTurma from "./SeletorTurma";
import SeletorEscola from "./SeletorEscola";

import {
    buscarTurmaParaEdicao,
    atualizarTurma,
} from "../services/edicaoTurmaService";

// ============================================
// VALORES ACEITOS PELO FASTAPI
// ============================================

const TURNOS = [
    { valor: "Manhã", nome: "Manhã" },
    { valor: "Tarde", nome: "Tarde" },
    { valor: "Noite", nome: "Noite" },
    { valor: "Integral", nome: "Integral" },
];

// ============================================
// MENSAGENS DE ERRO
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sua sessão foi rejeitada ou expirou. " +
            "Saia e faça login novamente."
        );
    }

    if (erro.status === 403) {
        return (
            "Você não possui permissão para " +
            "consultar ou editar esta turma."
        );
    }

    if (erro.status === 404) {
        return "Turma ou escola não encontrada ou sem acesso.";
    }

    if (erro.status === 405) {
        return (
            "Método HTTP não permitido. " + "Confirme PUT ou PATCH no Swagger."
        );
    }

    if (erro.status === 409) {
        return (
            "A atualização entrou em conflito " + "com uma regra do sistema."
        );
    }

    if (erro.status === 422) {
        const detalhes = erro.detalhes?.detail;

        if (Array.isArray(detalhes)) {
            const mensagens = detalhes.map((item) => {
                const campo = Array.isArray(item.loc)
                    ? item.loc.slice(1).join(".")
                    : "Campo";

                return `${campo}: ${item.msg}`;
            });

            return mensagens.join(" | ");
        }

        return (
            "Os dados não correspondem ao schema " +
            "do FastAPI. Confira o Swagger."
        );
    }

    return erro.message || "Não foi possível atualizar a turma.";
}

// ============================================
// NORMALIZAR DADOS RECEBIDOS DA API
// ============================================

function prepararFormulario(turma) {
    return {
        escolaId: String(turma.escola_id ?? ""),
        nome: String(turma.nome ?? ""),
        serie: String(turma.serie ?? ""),
        turno: String(turma.turno ?? ""),
        anoLetivo: String(turma.ano_letivo ?? ""),
        ativo: turma.ativo === true,
    };
}

// ============================================
// COMPARAR FORMULÁRIOS
// ============================================

function formulariosIguais(a, b) {
    if (!a || !b) return false;

    return (
        a.escolaId === b.escolaId &&
        a.nome === b.nome &&
        a.serie === b.serie &&
        a.turno === b.turno &&
        a.anoLetivo === b.anoLetivo &&
        a.ativo === b.ativo
    );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function FormularioEdicaoTurma({ token, onAtualizacaoRealizada }) {
    // ==========================================
    // IDENTIFICAÇÃO DA TURMA
    // ==========================================

    const [turmaId, setTurmaId] = useState("");

    const [turma, setTurma] = useState(null);

    // ==========================================
    // DADOS DO FORMULÁRIO
    // ==========================================

    const [dados, setDados] = useState(null);

    const [dadosOriginais, setDadosOriginais] = useState(null);

    // ==========================================
    // CONSULTA
    // ==========================================

    const [carregando, setCarregando] = useState(false);

    const [versaoConsulta, setVersaoConsulta] = useState(0);

    const [versaoSeletor, setVersaoSeletor] = useState(0);

    // ==========================================
    // SALVAMENTO E MENSAGENS
    // ==========================================

    const [salvando, setSalvando] = useState(false);

    const [erro, setErro] = useState("");

    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // SELECIONAR TURMA
    // ==========================================

    function selecionarTurma(novoId) {
        if (salvando) return;

        setTurmaId(novoId);

        setTurma(null);
        setDados(null);
        setDadosOriginais(null);

        setErro("");
        setSucesso("");

        setCarregando(Boolean(novoId));
    }

    // ==========================================
    // CONSULTAR TURMA SELECIONADA
    // ==========================================

    useEffect(() => {
        if (!turmaId) return;

        const controller = new AbortController();
        let ativo = true;

        async function carregarTurma() {
            try {
                const resposta = await buscarTurmaParaEdicao({
                    turmaId,
                    token,
                    signal: controller.signal,
                });

                if (!ativo) return;

                const formulario = prepararFormulario(resposta);

                setTurma(resposta);
                setDados(formulario);
                setDadosOriginais(formulario);

                setErro("");
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setTurma(null);
                setDados(null);
                setDadosOriginais(null);

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
    // ATUALIZAR UM CAMPO
    // ==========================================

    function alterarCampo(campo, valor) {
        setDados((anterior) => {
            if (!anterior) return anterior;

            return {
                ...anterior,
                [campo]: valor,
            };
        });

        setErro("");
        setSucesso("");
    }

    // ==========================================
    // VERIFICAR ALTERAÇÕES
    // ==========================================

    const alterado = Boolean(
        dados && dadosOriginais && !formulariosIguais(dados, dadosOriginais),
    );

    // ==========================================
    // RESTAURAR ALTERAÇÕES LOCAIS
    // ==========================================

    function desfazerAlteracoes() {
        if (salvando || !dadosOriginais) return;

        setDados({ ...dadosOriginais });

        setErro("");
        setSucesso("");
    }

    // ==========================================
    // RECARREGAR REGISTRO
    // ==========================================

    function recarregarTurma() {
        if (!turmaId || salvando) return;

        setTurma(null);
        setDados(null);
        setDadosOriginais(null);

        setErro("");
        setSucesso("");
        setCarregando(true);

        setVersaoConsulta((anterior) => anterior + 1);
    }

    // ==========================================
    // SALVAR ALTERAÇÕES
    // ==========================================

    async function salvarAlteracoes(evento) {
        evento.preventDefault();

        if (salvando || carregando || !turma || !dados || !alterado) {
            return;
        }

        setErro("");
        setSucesso("");
        setSalvando(true);

        try {
            await atualizarTurma({
                turmaId: turma.id,
                escolaId: dados.escolaId,
                nome: dados.nome,
                serie: dados.serie,
                turno: dados.turno,
                anoLetivo: dados.anoLetivo,
                ativo: dados.ativo,
                token,
            });

            // Backend confirmou a atualização.
            setSucesso("Turma atualizada com sucesso!");

            // Os dados salvos passam a ser a
            // referência para próximas alterações.
            setDadosOriginais({ ...dados });

            // Atualiza a listagem da página pai.
            onAtualizacaoRealizada?.();

            // Atualiza as opções do seletor,
            // especialmente se o nome mudou.
            setVersaoSeletor((anterior) => anterior + 1);
        } catch (falha) {
            setErro(mensagemDeErro(falha));
        } finally {
            setSalvando(false);
        }
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <section className="edicao-turma" aria-labelledby="titulo-edicao-turma">
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <div className="edicao-turma-topo">
                <h2 id="titulo-edicao-turma">Editar turma</h2>

                <p>
                    Selecione uma turma, revise os dados atuais e salve as
                    alterações desejadas.
                </p>
            </div>

            {/* ======================================
          SELECIONAR TURMA
      ====================================== */}

            <div className="edicao-turma-selecao">
                <SeletorTurma
                    key={versaoSeletor}
                    token={token}
                    valor={turmaId}
                    onChange={selecionarTurma}
                    disabled={carregando || salvando}
                />

                <button
                    type="button"
                    className="edicao-turma-botao-secundario"
                    onClick={recarregarTurma}
                    disabled={!turmaId || carregando || salvando}
                >
                    Recarregar dados da turma
                </button>
            </div>

            {/* ======================================
          ESTADOS DE CARREGAMENTO
      ====================================== */}

            {carregando && (
                <p className="edicao-turma-mensagem" role="status">
                    Consultando os dados atuais da turma...
                </p>
            )}

            {erro && (
                <p
                    className="edicao-turma-mensagem edicao-turma-mensagem--erro"
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {!turmaId && (
                <p className="edicao-turma-orientacao">
                    Selecione uma turma na lista acima para carregar o
                    formulário de edição.
                </p>
            )}

            {/* ======================================
          FORMULÁRIO
      ====================================== */}

            {turma && dados && !carregando && (
                <form
                    className="edicao-turma-formulario"
                    onSubmit={salvarAlteracoes}
                >
                    {/* IDENTIFICAÇÃO */}

                    <div className="edicao-turma-identificacao">
                        <strong>Turma ID {turma.id}</strong>

                        <span>Dados atuais carregados do FastAPI.</span>
                    </div>

                    {/* SELEÇÃO DA ESCOLA */}

                    <div className="edicao-turma-escola">
                        <SeletorEscola
                            token={token}
                            valor={dados.escolaId}
                            onChange={(valor) => {
                                alterarCampo("escolaId", valor);
                            }}
                            disabled={salvando}
                        />
                    </div>

                    {/* CAMPOS */}

                    <div className="edicao-turma-campos">
                        {/* NOME */}

                        <div className="edicao-turma-campo">
                            <label htmlFor="edicao-turma-nome">
                                Nome da turma *
                            </label>

                            <input
                                id="edicao-turma-nome"
                                type="text"
                                maxLength={20}
                                value={dados.nome}
                                required
                                disabled={salvando}
                                onChange={(evento) => {
                                    alterarCampo("nome", evento.target.value);
                                }}
                            />
                        </div>

                        {/* SÉRIE */}

                        <div className="edicao-turma-campo">
                            <label htmlFor="edicao-turma-serie">Série *</label>

                            <input
                                id="edicao-turma-serie"
                                type="text"
                                maxLength={100}
                                value={dados.serie}
                                required
                                disabled={salvando}
                                onChange={(evento) => {
                                    alterarCampo("serie", evento.target.value);
                                }}
                            />
                        </div>

                        {/* TURNO */}

                        <div className="edicao-turma-campo">
                            <label htmlFor="edicao-turma-turno">Turno *</label>

                            <select
                                id="edicao-turma-turno"
                                value={dados.turno}
                                required
                                disabled={salvando}
                                onChange={(evento) => {
                                    alterarCampo("turno", evento.target.value);
                                }}
                            >
                                <option value="">Selecione o turno</option>

                                {TURNOS.map((turno) => (
                                    <option
                                        key={turno.valor}
                                        value={turno.valor}
                                    >
                                        {turno.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ANO LETIVO */}

                        <div className="edicao-turma-campo">
                            <label htmlFor="edicao-turma-ano">
                                Ano letivo *
                            </label>

                            <input
                                id="edicao-turma-ano"
                                type="number"
                                min="2000"
                                max="2100"
                                step="1"
                                value={dados.anoLetivo}
                                required
                                disabled={salvando}
                                onChange={(evento) => {
                                    alterarCampo(
                                        "anoLetivo",
                                        evento.target.value,
                                    );
                                }}
                            />
                        </div>
                    </div>

                    {/* SITUAÇÃO */}

                    <label className="edicao-turma-checkbox">
                        <input
                            type="checkbox"
                            checked={dados.ativo}
                            disabled={salvando}
                            onChange={(evento) => {
                                alterarCampo("ativo", evento.target.checked);
                            }}
                        />

                        <span>
                            <strong>Turma ativa</strong>

                            <small>
                                Desmarcar pode afetar a disponibilidade da turma
                                em outras consultas.
                            </small>
                        </span>
                    </label>

                    {/* SUCESSO */}

                    {sucesso && (
                        <p
                            className="edicao-turma-mensagem edicao-turma-mensagem--sucesso"
                            role="status"
                        >
                            {sucesso}
                        </p>
                    )}

                    {/* BOTÕES */}

                    <div className="edicao-turma-acoes">
                        <button
                            type="submit"
                            className="edicao-turma-botao-salvar"
                            disabled={salvando || carregando || !alterado}
                        >
                            {salvando
                                ? "Salvando alterações..."
                                : "Salvar alterações"}
                        </button>

                        <button
                            type="button"
                            className="edicao-turma-botao-secundario"
                            onClick={desfazerAlteracoes}
                            disabled={salvando || !alterado}
                        >
                            Desfazer alterações locais
                        </button>
                    </div>

                    <p className="edicao-turma-observacao">
                        A atualização será enviada ao FastAPI utilizando o JWT
                        da sessão. Alterações na escola ou na situação da turma
                        podem impactar outros módulos.
                    </p>
                </form>
            )}
        </section>
    );
}

export default FormularioEdicaoTurma;
