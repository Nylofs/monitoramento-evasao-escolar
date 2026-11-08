import { useState } from "react";

import SeletorEscola from "./SeletorEscola";

import { criarTurma } from "../services/cadastroTurmaService";

// ============================================
// ANO LETIVO INICIAL
// ============================================

const ANO_ATUAL = new Date().getFullYear();

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
            "cadastrar turmas nesta instituição."
        );
    }

    if (erro.status === 404) {
        return "Escola não encontrada ou sem acesso.";
    }

    if (erro.status === 409) {
        return "O cadastro entrou em conflito com " + "um registro existente.";
    }

    if (erro.status === 422) {
        return (
            "Os dados foram rejeitados pelo FastAPI. " +
            "Confira o Request Body no Swagger " +
            "e o retorno na aba Network."
        );
    }

    return erro.message || "Não foi possível cadastrar a turma.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function FormularioTurma({ token, onCadastroRealizado }) {
    // ==========================================
    // CAMPOS
    // ==========================================

    const [escolaId, setEscolaId] = useState("");
    const [nome, setNome] = useState("");
    const [serie, setSerie] = useState("");
    const [turno, setTurno] = useState("");
    const [anoLetivo, setAnoLetivo] = useState(String(ANO_ATUAL));
    const [ativo, setAtivo] = useState(true);

    // ==========================================
    // ESTADOS DO FORMULÁRIO
    // ==========================================

    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // LIMPAR FORMULÁRIO
    // ==========================================

    function limparCampos() {
        if (salvando) return;

        setEscolaId("");
        setNome("");
        setSerie("");
        setTurno("");
        setAnoLetivo(String(ANO_ATUAL));
        setAtivo(true);
        setErro("");
        setSucesso("");
    }

    // ==========================================
    // ALTERAR ESCOLA
    // ==========================================

    function alterarEscola(novoId) {
        setEscolaId(novoId);
        setErro("");
        setSucesso("");
    }

    // ==========================================
    // ENVIAR CADASTRO
    // ==========================================

    async function enviarCadastro(evento) {
        evento.preventDefault();

        if (salvando) return;

        setErro("");
        setSucesso("");

        const nomeLimpo = nome.trim();
        const serieLimpa = serie.trim();

        if (!escolaId) {
            setErro("Selecione uma escola.");
            return;
        }

        if (!nomeLimpo || !serieLimpa) {
            setErro("Informe o nome e a série da turma.");
            return;
        }

        if (!turno) {
            setErro("Selecione um turno.");
            return;
        }

        if (!anoLetivo) {
            setErro("Informe o ano letivo.");
            return;
        }

        setSalvando(true);

        try {
            const resposta = await criarTurma({
                escolaId,
                nome: nomeLimpo,
                serie: serieLimpa,
                turno,
                anoLetivo,
                ativo,
                token,
            });

            // Só confirmamos o sucesso depois
            // da resposta bem-sucedida do FastAPI.
            setSucesso("Turma cadastrada com sucesso!");

            // Mantemos a escola e o ano letivo
            // para facilitar outro cadastro.
            setNome("");
            setSerie("");
            setTurno("");
            setAtivo(true);

            onCadastroRealizado?.(resposta);
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
        <section
            className="cadastro-turma"
            aria-labelledby="titulo-cadastro-turma"
        >
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <div className="cadastro-turma-topo">
                <div>
                    <h2 id="titulo-cadastro-turma">Cadastrar nova turma</h2>

                    <p>
                        Preencha os dados da turma e selecione a instituição
                        responsável.
                    </p>
                </div>

                <span aria-hidden="true">👥</span>
            </div>

            {/* ======================================
          FORMULÁRIO
      ====================================== */}

            <form onSubmit={enviarCadastro}>
                {/* SELECIONAR ESCOLA */}

                <div className="cadastro-turma-escola">
                    <SeletorEscola
                        token={token}
                        valor={escolaId}
                        onChange={alterarEscola}
                        disabled={salvando}
                    />
                </div>

                <div className="cadastro-turma-campos">
                    {/* NOME DA TURMA */}

                    <div className="cadastro-turma-campo">
                        <label htmlFor="turma-nome">Nome da turma *</label>

                        <input
                            id="turma-nome"
                            name="nome"
                            type="text"
                            placeholder="Ex.: 6º Ano A"
                            value={nome}
                            maxLength={20}
                            onChange={(evento) => {
                                setNome(evento.target.value);
                                setErro("");
                                setSucesso("");
                            }}
                            disabled={salvando}
                            required
                        />
                    </div>

                    {/* SÉRIE */}

                    <div className="cadastro-turma-campo">
                        <label htmlFor="turma-serie">Série *</label>

                        <input
                            id="turma-serie"
                            name="serie"
                            type="text"
                            placeholder="Ex.: 6º Ano"
                            value={serie}
                            maxLength={100}
                            onChange={(evento) => {
                                setSerie(evento.target.value);
                                setErro("");
                                setSucesso("");
                            }}
                            disabled={salvando}
                            required
                        />
                    </div>

                    {/* TURNO */}

                    <div className="cadastro-turma-campo">
                        <label htmlFor="turma-turno">Turno *</label>

                        <select
                            id="turma-turno"
                            name="turno"
                            value={turno}
                            onChange={(evento) => {
                                setTurno(evento.target.value);
                                setErro("");
                                setSucesso("");
                            }}
                            disabled={salvando}
                            required
                        >
                            <option value="">Selecione o turno</option>
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                            <option value="Integral">Integral</option>
                        </select>
                    </div>

                    {/* ANO LETIVO */}

                    <div className="cadastro-turma-campo">
                        <label htmlFor="turma-ano-letivo">Ano letivo *</label>

                        <input
                            id="turma-ano-letivo"
                            name="ano_letivo"
                            type="number"
                            min="2000"
                            max="2100"
                            step="1"
                            value={anoLetivo}
                            onChange={(evento) => {
                                setAnoLetivo(evento.target.value);
                                setErro("");
                                setSucesso("");
                            }}
                            disabled={salvando}
                            required
                        />
                    </div>
                </div>

                {/* ====================================
            SITUAÇÃO
        ==================================== */}

                <label className="cadastro-turma-checkbox">
                    <input
                        type="checkbox"
                        checked={ativo}
                        onChange={(evento) => {
                            setAtivo(evento.target.checked);
                            setErro("");
                            setSucesso("");
                        }}
                        disabled={salvando}
                    />

                    <span>
                        <strong>Turma ativa</strong>

                        <small>
                            Desmarque para solicitar um cadastro inicialmente
                            inativo.
                        </small>
                    </span>
                </label>

                {/* ====================================
            ERRO E SUCESSO
        ==================================== */}

                {erro && (
                    <p
                        className="cadastro-turma-mensagem cadastro-turma-mensagem--erro"
                        role="alert"
                    >
                        {erro}
                    </p>
                )}

                {sucesso && (
                    <p
                        className="cadastro-turma-mensagem cadastro-turma-mensagem--sucesso"
                        role="status"
                    >
                        {sucesso}
                    </p>
                )}

                {/* ====================================
            BOTÕES
        ==================================== */}

                <div className="cadastro-turma-acoes">
                    <button
                        type="submit"
                        className="cadastro-turma-botao-salvar"
                        disabled={salvando}
                    >
                        {salvando ? "Salvando turma..." : "Cadastrar turma"}
                    </button>

                    <button
                        type="button"
                        className="cadastro-turma-botao-limpar"
                        onClick={limparCampos}
                        disabled={salvando}
                    >
                        Limpar formulário
                    </button>
                </div>
            </form>

            <p className="cadastro-turma-observacao">
                A turma será vinculada à escola selecionada. O FastAPI
                verificará os dados, a existência da instituição e as permissões
                da conta.
            </p>
        </section>
    );
}

export default FormularioTurma;
