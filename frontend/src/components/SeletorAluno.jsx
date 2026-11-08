import { useEffect, useState } from "react";

import { listarAlunos } from "../services/alunoService";

// ==========================================
// COMPONENTE SELETOR DE ALUNOS
// ==========================================

function SeletorAluno({ token, valor, onChange, disabled = false }) {
    const [alunos, setAlunos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [versao, setVersao] = useState(0);

    // ========================================
    // BUSCAR ALUNOS NA API
    // ========================================

    useEffect(() => {
        const controller = new AbortController();
        let ativo = true;

        async function carregarAlunos() {
            try {
                const dados = await listarAlunos({
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setAlunos(dados);
                    setErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setAlunos([]);

                if (falha.status === 401) {
                    setErro("Sessão inválida. Faça login novamente.");
                } else if (falha.status === 403) {
                    setErro("Você não tem permissão para listar alunos.");
                } else {
                    setErro(falha.message || "Erro ao carregar alunos.");
                }
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarAlunos();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [token, versao]);

    // ========================================
    // ATUALIZAR LISTA
    // ========================================

    function atualizarLista() {
        onChange("");
        setAlunos([]);
        setErro("");
        setCarregando(true);
        setVersao((anterior) => anterior + 1);
    }

    // ========================================
    // VALIDAR OPÇÃO ATUAL
    // ========================================

    const existeOpcao = alunos.some(
        (aluno) => String(aluno.id) === String(valor),
    );

    const valorSelect = existeOpcao ? String(valor) : "";

    // ========================================
    // INTERFACE
    // ========================================

    return (
        <div className="seletor-entidade">
            <label htmlFor="seletor-aluno-id">Aluno</label>

            <div className="seletor-entidade-linha">
                <select
                    id="seletor-aluno-id"
                    value={valorSelect}
                    onChange={(evento) => {
                        onChange(evento.target.value);
                    }}
                    disabled={
                        disabled ||
                        carregando ||
                        Boolean(erro) ||
                        alunos.length === 0
                    }
                    required
                >
                    <option value="">
                        {carregando
                            ? "Carregando alunos..."
                            : "Selecione um aluno"}
                    </option>

                    {alunos.map((aluno) => (
                        <option key={aluno.id} value={String(aluno.id)}>
                            {aluno.nome}
                            {" — "}
                            {aluno.codigo_aluno || `ID ${aluno.id}`}
                            {" — Turma "}
                            {aluno.turma_id}
                            {aluno.ativo === false ? " (Inativo)" : ""}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="seletor-entidade-atualizar"
                    onClick={atualizarLista}
                    disabled={disabled || carregando}
                    aria-label="Atualizar lista de alunos"
                    title="Atualizar lista de alunos"
                >
                    ↻
                </button>
            </div>

            {carregando && (
                <p className="seletor-entidade-ajuda" role="status">
                    Consultando alunos no FastAPI...
                </p>
            )}

            {erro && (
                <p className="seletor-entidade-erro" role="alert">
                    {erro}
                </p>
            )}

            {!carregando && !erro && alunos.length === 0 && (
                <p className="seletor-entidade-ajuda">
                    Nenhum aluno disponível para sua conta.
                </p>
            )}

            {!carregando && !erro && alunos.length > 0 && (
                <p className="seletor-entidade-ajuda">
                    {alunos.length} aluno(s) disponível(is).
                </p>
            )}
        </div>
    );
}

export default SeletorAluno;
