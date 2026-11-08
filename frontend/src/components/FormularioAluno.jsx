import { useState } from "react";

import SeletorTurma from "./SeletorTurma";

import { criarAluno } from "../services/cadastroAlunoService";

// ============================================
// TRATAR ERROS HTTP
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return "Sessão inválida ou expirada. Faça login novamente.";
    }

    if (erro.status === 403) {
        return "Você não possui permissão para cadastrar alunos.";
    }

    if (erro.status === 404) {
        return "Turma não encontrada ou sem acesso.";
    }

    if (erro.status === 409) {
        return "Já existe um registro conflitante. Verifique o código do aluno.";
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

        return "Dados rejeitados pelo FastAPI. Confira o schema no Swagger.";
    }

    return erro.message || "Não foi possível cadastrar o aluno.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function FormularioAluno({ token, onCadastroRealizado }) {
    // ==========================================
    // ESTADOS DO FORMULÁRIO
    // ==========================================

    const [turmaId, setTurmaId] = useState("");
    const [nome, setNome] = useState("");
    const [codigoAluno, setCodigoAluno] = useState("");
    const [ativo, setAtivo] = useState(true);

    // ==========================================
    // ESTADOS DA REQUISIÇÃO
    // ==========================================

    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // LIMPAR FORMULÁRIO
    // ==========================================

    function limparFormulario() {
        if (salvando) return;

        setTurmaId("");
        setNome("");
        setCodigoAluno("");
        setAtivo(true);
        setErro("");
        setSucesso("");
    }

    // ==========================================
    // SELECIONAR TURMA
    // ==========================================

    function selecionarTurma(id) {
        setTurmaId(id);
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

        if (!turmaId) {
            setErro("Selecione a turma do aluno.");
            return;
        }

        if (!nome.trim()) {
            setErro("Informe o nome completo do aluno.");
            return;
        }

        if (!codigoAluno.trim()) {
            setErro("Informe o código do aluno.");
            return;
        }

        setSalvando(true);

        try {
            const resposta = await criarAluno({
                nome,
                codigoAluno,
                turmaId,
                ativo,
                token,
            });

            setSucesso("Aluno cadastrado com sucesso!");

            // Mantemos a turma selecionada para
            // facilitar cadastros da mesma turma.
            setNome("");
            setCodigoAluno("");
            setAtivo(true);

            // Comunica o sucesso à página de gestão.
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
            className="cadastro-aluno"
            aria-labelledby="cadastro-aluno-titulo"
        >
            <div className="cadastro-aluno-topo">
                <div>
                    <h2 id="cadastro-aluno-titulo">Cadastrar novo aluno</h2>

                    <p>
                        Preencha os dados do estudante e selecione a turma
                        correspondente.
                    </p>
                </div>

                <span aria-hidden="true">🎓</span>
            </div>

            <form onSubmit={enviarCadastro}>
                {/* ====================================
            TURMA
        ==================================== */}

                <div className="cadastro-aluno-turma">
                    <SeletorTurma
                        token={token}
                        valor={turmaId}
                        onChange={selecionarTurma}
                        disabled={salvando}
                    />
                </div>

                {/* ====================================
            CAMPOS
        ==================================== */}

                <div className="cadastro-aluno-campos">
                    <div className="cadastro-aluno-campo">
                        <label htmlFor="cadastro-aluno-nome">
                            Nome completo *
                        </label>

                        <input
                            id="cadastro-aluno-nome"
                            type="text"
                            placeholder="Digite o nome do estudante"
                            value={nome}
                            onChange={(evento) => {
                                setNome(evento.target.value);
                                setErro("");
                                setSucesso("");
                            }}
                            disabled={salvando}
                            required
                        />
                    </div>

                    <div className="cadastro-aluno-campo">
                        <label htmlFor="cadastro-aluno-codigo">
                            Código do aluno *
                        </label>

                        <input
                            id="cadastro-aluno-codigo"
                            type="text"
                            placeholder="Ex.: TESTE-001"
                            value={codigoAluno}
                            onChange={(evento) => {
                                setCodigoAluno(evento.target.value);
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

                <label className="cadastro-aluno-checkbox">
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
                        <strong>Aluno ativo</strong>
                        <small>
                            Desmarque somente se o schema permitir cadastro
                            inicialmente inativo.
                        </small>
                    </span>
                </label>

                {/* ====================================
            MENSAGENS
        ==================================== */}

                {erro && (
                    <p
                        className="cadastro-aluno-mensagem cadastro-aluno-mensagem--erro"
                        role="alert"
                    >
                        {erro}
                    </p>
                )}

                {sucesso && (
                    <p
                        className="cadastro-aluno-mensagem cadastro-aluno-mensagem--sucesso"
                        role="status"
                    >
                        {sucesso}
                    </p>
                )}

                {/* ====================================
            BOTÕES
        ==================================== */}

                <div className="cadastro-aluno-acoes">
                    <button
                        type="submit"
                        className="cadastro-aluno-botao-salvar"
                        disabled={salvando}
                    >
                        {salvando ? "Cadastrando aluno..." : "Cadastrar aluno"}
                    </button>

                    <button
                        type="button"
                        className="cadastro-aluno-botao-limpar"
                        onClick={limparFormulario}
                        disabled={salvando}
                    >
                        Limpar formulário
                    </button>
                </div>
            </form>

            <p className="cadastro-aluno-observacao">
                O cadastro será enviado ao FastAPI com o JWT da sessão. A
                validação da turma e das permissões acontece no backend.
            </p>
        </section>
    );
}

export default FormularioAluno;
