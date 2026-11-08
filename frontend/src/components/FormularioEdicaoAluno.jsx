import { useEffect, useState } from "react";

import SeletorAluno from "./SeletorAluno";
import SeletorTurma from "./SeletorTurma";

import {
    buscarAlunoParaEdicao,
    atualizarAluno,
} from "../services/edicaoAlunoService";

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sessão inválida ou expirada. " +
            "Saia do sistema e faça login novamente."
        );
    }

    if (erro.status === 403) {
        return (
            "Você não possui permissão para " +
            "consultar ou editar este aluno."
        );
    }

    if (erro.status === 404) {
        return (
            "Aluno ou turma não encontrado, " + "ou sem acesso para esta conta."
        );
    }

    if (erro.status === 405) {
        return (
            "Método HTTP não permitido. " +
            "Confira se o Swagger utiliza PUT ou PATCH."
        );
    }

    if (erro.status === 409) {
        return (
            "A alteração entrou em conflito " +
            "com outro registro ou regra do sistema."
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
            "Os dados foram rejeitados pelo FastAPI. " +
            "Confira o Request Body no Swagger."
        );
    }

    return erro.message || "Não foi possível atualizar o aluno.";
}

// ============================================
// PREPARAR DADOS PARA O FORMULÁRIO
// ============================================

function prepararDados(aluno) {
    return {
        nome: String(aluno.nome ?? ""),
        codigoAluno: String(aluno.codigo_aluno ?? ""),
        turmaId: String(aluno.turma_id ?? ""),
        ativo: aluno.ativo === true,
    };
}

// ============================================
// CONFERIR SE EXISTEM ALTERAÇÕES
// ============================================

function dadosSaoIguais(a, b) {
    if (!a || !b) return false;

    return (
        a.nome === b.nome &&
        a.codigoAluno === b.codigoAluno &&
        a.turmaId === b.turmaId &&
        a.ativo === b.ativo
    );
}

// ============================================
// FORMULÁRIO INTERNO
// ============================================

function CamposEdicaoAluno({ aluno, token, onAtualizacaoRealizada }) {
    // ==========================================
    // DADOS ATUAIS E ORIGINAIS
    // ==========================================

    const [dados, setDados] = useState(() => prepararDados(aluno));

    const [originais, setOriginais] = useState(() => prepararDados(aluno));

    // ==========================================
    // ESTADOS DE SALVAMENTO
    // ==========================================

    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // ALTERAR UM CAMPO
    // ==========================================

    function alterarCampo(campo, valor) {
        if (salvando) return;

        setDados((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));

        setErro("");
        setSucesso("");
    }

    // ==========================================
    // IDENTIFICAR ALTERAÇÕES
    // ==========================================

    const alterado = !dadosSaoIguais(dados, originais);

    // ==========================================
    // DESFAZER ALTERAÇÕES LOCAIS
    // ==========================================

    function desfazerAlteracoes() {
        if (salvando) return;

        setDados({ ...originais });
        setErro("");
        setSucesso("");
    }

    // ==========================================
    // SALVAR ALTERAÇÕES
    // ==========================================

    async function salvarAlteracoes(evento) {
        evento.preventDefault();

        if (salvando || !alterado) {
            return;
        }

        if (!dados.nome.trim()) {
            setErro("Informe o nome completo do aluno.");
            return;
        }

        if (!dados.codigoAluno.trim()) {
            setErro("Informe o código do aluno.");
            return;
        }

        if (!dados.turmaId) {
            setErro("Selecione uma turma.");
            return;
        }

        setErro("");
        setSucesso("");
        setSalvando(true);

        try {
            await atualizarAluno({
                alunoId: aluno.id,
                nome: dados.nome,
                codigoAluno: dados.codigoAluno,
                turmaId: dados.turmaId,
                ativo: dados.ativo,
                token,
            });

            // ======================================
            // SUCESSO CONFIRMADO PELO FASTAPI
            // ======================================

            const valoresEnviados = {
                nome: dados.nome.trim(),
                codigoAluno: dados.codigoAluno.trim(),
                turmaId: String(Number(dados.turmaId)),
                ativo: dados.ativo,
            };

            setDados(valoresEnviados);
            setOriginais(valoresEnviados);

            setSucesso("Aluno atualizado com sucesso!");

            // Atualizar a listagem existente.
            onAtualizacaoRealizada?.();
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
        <form className="edicao-aluno-formulario" onSubmit={salvarAlteracoes}>
            {/* ======================================
          IDENTIFICAÇÃO
      ====================================== */}

            <div className="edicao-aluno-identificacao">
                <strong>Aluno ID {aluno.id}</strong>

                <span>Dados atuais carregados pelo FastAPI.</span>
            </div>

            {/* ======================================
          TURMA
      ====================================== */}

            <div className="edicao-aluno-turma">
                <SeletorTurma
                    token={token}
                    valor={dados.turmaId}
                    onChange={(novoId) => {
                        alterarCampo("turmaId", novoId);
                    }}
                    disabled={salvando}
                />
            </div>

            {/* ======================================
          CAMPOS
      ====================================== */}

            <div className="edicao-aluno-campos">
                {/* NOME */}

                <div className="edicao-aluno-campo">
                    <label htmlFor="edicao-aluno-nome">Nome completo *</label>

                    <input
                        id="edicao-aluno-nome"
                        type="text"
                        value={dados.nome}
                        required
                        disabled={salvando}
                        placeholder="Nome completo do estudante"
                        onChange={(evento) => {
                            alterarCampo("nome", evento.target.value);
                        }}
                    />
                </div>

                {/* CÓDIGO */}

                <div className="edicao-aluno-campo">
                    <label htmlFor="edicao-aluno-codigo">
                        Código do aluno *
                    </label>

                    <input
                        id="edicao-aluno-codigo"
                        type="text"
                        value={dados.codigoAluno}
                        required
                        disabled={salvando}
                        placeholder="Código cadastral"
                        onChange={(evento) => {
                            alterarCampo("codigoAluno", evento.target.value);
                        }}
                    />
                </div>
            </div>

            {/* ======================================
          SITUAÇÃO
      ====================================== */}

            <label className="edicao-aluno-checkbox">
                <input
                    type="checkbox"
                    checked={dados.ativo}
                    disabled={salvando}
                    onChange={(evento) => {
                        alterarCampo("ativo", evento.target.checked);
                    }}
                />

                <span>
                    <strong>Aluno ativo</strong>

                    <small>
                        Desmarcar pode modificar a disponibilidade do estudante
                        em outros módulos.
                    </small>
                </span>
            </label>

            {/* ======================================
          MENSAGENS
      ====================================== */}

            {erro && (
                <p
                    className="edicao-aluno-mensagem edicao-aluno-mensagem--erro"
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {sucesso && (
                <p
                    className="edicao-aluno-mensagem edicao-aluno-mensagem--sucesso"
                    role="status"
                >
                    {sucesso}
                </p>
            )}

            {/* ======================================
          AÇÕES
      ====================================== */}

            <div className="edicao-aluno-acoes">
                <button
                    type="submit"
                    className="edicao-aluno-botao-salvar"
                    disabled={salvando || !alterado}
                >
                    {salvando ? "Salvando alterações..." : "Salvar alterações"}
                </button>

                <button
                    type="button"
                    className="edicao-aluno-botao-secundario"
                    onClick={desfazerAlteracoes}
                    disabled={salvando || !alterado}
                >
                    Desfazer alterações locais
                </button>
            </div>

            <p className="edicao-aluno-observacao">
                As atualizações serão enviadas ao FastAPI com autenticação JWT.
                Alterações de turma e situação podem afetar consultas e
                indicadores escolares.
            </p>
        </form>
    );
}

// ============================================
// COMPONENTE DE SELEÇÃO E CONSULTA
// ============================================

function FormularioEdicaoAluno({ token, onAtualizacaoRealizada }) {
    // ==========================================
    // IDENTIFICAÇÃO DO ALUNO
    // ==========================================

    const [alunoId, setAlunoId] = useState("");
    const [aluno, setAluno] = useState(null);

    // ==========================================
    // CONTROLE DAS CONSULTAS
    // ==========================================

    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");

    const [versaoConsulta, setVersaoConsulta] = useState(0);

    // ==========================================
    // SELECIONAR ALUNO
    // ==========================================

    function selecionarAluno(novoId) {
        setAlunoId(novoId);
        setAluno(null);
        setErro("");
        setCarregando(Boolean(novoId));
    }

    // ==========================================
    // BUSCAR DADOS DO ALUNO
    // ==========================================

    useEffect(() => {
        if (!alunoId) return;

        const controller = new AbortController();
        let ativo = true;

        async function carregarAluno() {
            try {
                const dados = await buscarAlunoParaEdicao({
                    alunoId,
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setAluno(dados);
                    setErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setAluno(null);
                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarAluno();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [alunoId, token, versaoConsulta]);

    // ==========================================
    // RECARREGAR DADOS
    // ==========================================

    function recarregarAluno() {
        if (!alunoId || carregando) return;

        setAluno(null);
        setErro("");
        setCarregando(true);

        setVersaoConsulta((anterior) => anterior + 1);
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <section className="edicao-aluno" aria-labelledby="titulo-edicao-aluno">
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <div className="edicao-aluno-topo">
                <h2 id="titulo-edicao-aluno">Editar aluno</h2>

                <p>
                    Selecione um estudante, consulte seus dados e atualize as
                    informações permitidas.
                </p>
            </div>

            {/* ======================================
          SELETOR DE ALUNOS
      ====================================== */}

            <div className="edicao-aluno-selecao">
                <SeletorAluno
                    token={token}
                    valor={alunoId}
                    onChange={selecionarAluno}
                    disabled={carregando}
                />

                <button
                    type="button"
                    className="edicao-aluno-botao-secundario"
                    onClick={recarregarAluno}
                    disabled={!alunoId || carregando}
                >
                    Recarregar dados do aluno
                </button>
            </div>

            {/* ======================================
          CARREGAMENTO
      ====================================== */}

            {carregando && (
                <p className="edicao-aluno-mensagem" role="status">
                    Consultando os dados atuais do aluno...
                </p>
            )}

            {/* ======================================
          ERRO DA CONSULTA
      ====================================== */}

            {erro && (
                <p
                    className="edicao-aluno-mensagem edicao-aluno-mensagem--erro"
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {/* ======================================
          NENHUM ALUNO SELECIONADO
      ====================================== */}

            {!alunoId && (
                <p className="edicao-aluno-orientacao">
                    Escolha um aluno na lista acima para carregar o formulário.
                </p>
            )}

            {/* ======================================
          CAMPOS EDITÁVEIS
      ====================================== */}

            {aluno && !carregando && (
                <CamposEdicaoAluno
                    key={`${aluno.id}-${versaoConsulta}`}
                    aluno={aluno}
                    token={token}
                    onAtualizacaoRealizada={onAtualizacaoRealizada}
                />
            )}
        </section>
    );
}

export default FormularioEdicaoAluno;
