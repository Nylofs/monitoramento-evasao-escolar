import { useRef, useState } from "react";

import SeletorAluno from "./SeletorAluno";

import {
    criarFrequencia,
    SITUACOES_FREQUENCIA,
} from "../services/cadastroFrequenciaService";

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sua sessão expirou ou foi rejeitada. " + "Faça login novamente."
        );
    }

    if (erro.status === 403) {
        return (
            "Você não possui permissão para " +
            "registrar frequência para este aluno."
        );
    }

    if (erro.status === 404) {
        return "Aluno não encontrado ou sem acesso.";
    }

    if (erro.status === 409) {
        return (
            "O lançamento entrou em conflito " +
            "com um registro existente. " +
            "Confira a frequência do aluno nesta data."
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
            "O FastAPI rejeitou os dados. " +
            "Confira o Request Body no Swagger."
        );
    }

    return erro.message || "Não foi possível registrar a frequência.";
}

// ============================================
// FORMULÁRIO PRINCIPAL
// ============================================

function FormularioFrequencia({ token, onCadastroRealizado }) {
    // ==========================================
    // CAMPOS
    // ==========================================

    const [alunoId, setAlunoId] = useState("");
    const [data, setData] = useState("");
    const [situacao, setSituacao] = useState("");
    const [observacao, setObservacao] = useState("");

    // ==========================================
    // ESTADOS DA REQUISIÇÃO
    // ==========================================

    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // Bloqueio imediato para cliques repetidos.
    const envioPendente = useRef(false);

    // ==========================================
    // LIMPAR MENSAGENS
    // ==========================================

    function limparMensagens() {
        setErro("");
        setSucesso("");
    }

    // ==========================================
    // SELECIONAR ALUNO
    // ==========================================

    function selecionarAluno(novoId) {
        if (envioPendente.current) return;

        setAlunoId(novoId);
        limparMensagens();
    }

    // ==========================================
    // LIMPAR O FORMULÁRIO
    // ==========================================

    function limparFormulario() {
        if (envioPendente.current) return;

        setAlunoId("");
        setData("");
        setSituacao("");
        setObservacao("");

        limparMensagens();
    }

    // ==========================================
    // CADASTRAR FREQUÊNCIA
    // ==========================================

    async function enviarCadastro(evento) {
        evento.preventDefault();

        if (envioPendente.current) return;

        setErro("");
        setSucesso("");

        if (!alunoId) {
            setErro("Selecione um aluno.");
            return;
        }

        if (!data) {
            setErro("Informe a data da frequência.");
            return;
        }

        if (!situacao) {
            setErro("Selecione Presente, Ausente ou Justificada.");
            return;
        }

        envioPendente.current = true;
        setSalvando(true);

        try {
            const resposta = await criarFrequencia({
                alunoId,
                data,
                situacao,
                observacao,
                token,
            });

            // Somente depois de HTTP 2xx.
            setSucesso("Frequência registrada com sucesso!");

            // Mantemos o aluno selecionado para
            // facilitar outro lançamento, mas
            // apagamos data, situação e observação.
            setData("");
            setSituacao("");
            setObservacao("");

            onCadastroRealizado?.(resposta);
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
            className="cadastro-frequencia"
            aria-labelledby="cadastro-frequencia-titulo"
        >
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <div className="cadastro-frequencia-topo">
                <div>
                    <h2 id="cadastro-frequencia-titulo">
                        Registrar frequência
                    </h2>

                    <p>
                        Selecione o estudante, a data e a situação do registro
                        escolar.
                    </p>
                </div>

                <span aria-hidden="true">📅</span>
            </div>

            <form onSubmit={enviarCadastro}>
                {/* ====================================
            SELECIONAR ALUNO
        ==================================== */}

                <div className="cadastro-frequencia-aluno">
                    <SeletorAluno
                        token={token}
                        valor={alunoId}
                        onChange={selecionarAluno}
                        disabled={salvando}
                    />
                </div>

                {/* ====================================
            DATA
        ==================================== */}

                <div className="cadastro-frequencia-campos">
                    <div className="cadastro-frequencia-campo">
                        <label htmlFor="frequencia-data">
                            Data da frequência *
                        </label>

                        <input
                            id="frequencia-data"
                            name="data"
                            type="date"
                            value={data}
                            onChange={(evento) => {
                                setData(evento.target.value);
                                limparMensagens();
                            }}
                            disabled={salvando}
                            required
                        />
                    </div>

                    {/* ==================================
              SITUAÇÃO
          ================================== */}

                    <div className="cadastro-frequencia-campo">
                        <label htmlFor="frequencia-situacao">Situação *</label>

                        <select
                            id="frequencia-situacao"
                            name="situacao"
                            value={situacao}
                            onChange={(evento) => {
                                setSituacao(evento.target.value);
                                limparMensagens();
                            }}
                            disabled={salvando}
                            required
                        >
                            <option value="">Selecione a situação</option>

                            {SITUACOES_FREQUENCIA.map((item) => (
                                <option key={item.valor} value={item.valor}>
                                    {item.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ====================================
            OBSERVAÇÃO
        ==================================== */}

                <div className="cadastro-frequencia-campo cadastro-frequencia-observacao">
                    <label htmlFor="frequencia-observacao">Observação</label>

                    <textarea
                        id="frequencia-observacao"
                        name="observacao"
                        rows={4}
                        placeholder={"Digite uma observação, se necessário."}
                        value={observacao}
                        onChange={(evento) => {
                            setObservacao(evento.target.value);
                            limparMensagens();
                        }}
                        disabled={salvando}
                    />

                    <small>
                        Não inclua informações pessoais sensíveis
                        desnecessárias.
                    </small>
                </div>

                {/* ====================================
            MENSAGENS
        ==================================== */}

                {erro && (
                    <p
                        className="cadastro-frequencia-mensagem cadastro-frequencia-mensagem--erro"
                        role="alert"
                    >
                        {erro}
                    </p>
                )}

                {sucesso && (
                    <p
                        className="cadastro-frequencia-mensagem cadastro-frequencia-mensagem--sucesso"
                        role="status"
                    >
                        {sucesso}
                    </p>
                )}

                {/* ====================================
            BOTÕES
        ==================================== */}

                <div className="cadastro-frequencia-acoes">
                    <button
                        type="submit"
                        className="cadastro-frequencia-botao-salvar"
                        disabled={salvando}
                    >
                        {salvando
                            ? "Registrando frequência..."
                            : "Registrar frequência"}
                    </button>

                    <button
                        type="button"
                        className="cadastro-frequencia-botao-limpar"
                        onClick={limparFormulario}
                        disabled={salvando}
                    >
                        Limpar formulário
                    </button>
                </div>
            </form>

            <p className="cadastro-frequencia-observacao-final">
                O registro será enviado com JWT. O FastAPI verificará as
                permissões, os campos e as regras de lançamento.
            </p>
        </section>
    );
}

export default FormularioFrequencia;
