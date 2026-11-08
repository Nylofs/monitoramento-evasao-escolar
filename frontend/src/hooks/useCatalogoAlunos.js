import { useEffect, useMemo, useState } from "react";

import { listarAlunos } from "../services/alunoService";

// ============================================
// HOOK PERSONALIZADO
// ============================================

export default function useCatalogoAlunos(token) {
    const [alunos, setAlunos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [versao, setVersao] = useState(0);

    // ==========================================
    // CONSULTAR ALUNOS
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();
        let ativo = true;

        async function carregar() {
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
                    setErro("Sessão inválida ou expirada.");
                } else if (falha.status === 403) {
                    setErro("Sem permissão para listar alunos.");
                } else {
                    setErro(
                        falha.message ||
                            "Não foi possível carregar os nomes dos alunos.",
                    );
                }
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregar();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [token, versao]);

    // ==========================================
    // CRIAR MAPA DE ALUNOS
    // ==========================================

    const alunosPorId = useMemo(() => {
        const mapa = new Map();

        for (const aluno of alunos) {
            mapa.set(String(aluno.id), aluno);
        }

        return mapa;
    }, [alunos]);

    // ==========================================
    // OBTER CADASTRO PELO ID
    // ==========================================

    function obterAluno(id) {
        if (id === null || id === undefined) {
            return null;
        }

        return alunosPorId.get(String(id)) || null;
    }

    // ==========================================
    // IDENTIFICAÇÃO PARA A INTERFACE
    // ==========================================

    function nomeDoAluno(id) {
        const aluno = obterAluno(id);

        return aluno?.nome || `Aluno ID ${id ?? "não informado"}`;
    }

    // ==========================================
    // RECARREGAR CATÁLOGO
    // ==========================================

    function atualizar() {
        setAlunos([]);
        setErro("");
        setCarregando(true);
        setVersao((anterior) => anterior + 1);
    }

    return {
        alunos,
        alunosPorId,
        carregando,
        erro,
        obterAluno,
        nomeDoAluno,
        atualizar,
    };
}
