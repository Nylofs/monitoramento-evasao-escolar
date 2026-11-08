import { useState } from "react";

import Alunos from "./Alunos";

import FormularioAluno from "../components/FormularioAluno";

import FormularioEdicaoAluno from "../components/FormularioEdicaoAluno";

import ExclusaoAluno from "../components/ExclusaoAluno";

// ============================================
// GESTÃO DE ALUNOS
// ============================================

function AlunosGestao({ token }) {
    // ==========================================
    // MODO ATUAL
    // null | cadastro | edicao | exclusao
    // ==========================================

    const [modoFormulario, setModoFormulario] = useState(null);

    // ==========================================
    // CONTROLE DA LISTAGEM
    // ==========================================

    const [versaoLista, setVersaoLista] = useState(0);

    // ==========================================
    // ABRIR OU FECHAR UM MODO
    // ==========================================

    function alterarModo(novoModo) {
        setModoFormulario((anterior) =>
            anterior === novoModo ? null : novoModo,
        );
    }

    // ==========================================
    // RECARREGAR LISTAGEM
    // ==========================================

    function atualizarListagem() {
        setVersaoLista((anterior) => anterior + 1);
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="alunos-gestao">
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <section className="alunos-gestao-acoes">
                <div>
                    <h2>Gestão de alunos</h2>

                    <p>
                        Consulte, cadastre, edite e exclua estudantes conforme
                        suas permissões.
                    </p>
                </div>

                <div className="alunos-gestao-botoes">
                    {/* CADASTRO */}

                    <button
                        type="button"
                        className="alunos-gestao-botao"
                        onClick={() => alterarModo("cadastro")}
                        aria-expanded={modoFormulario === "cadastro"}
                        aria-controls="alunos-gestao-formulario"
                    >
                        {modoFormulario === "cadastro"
                            ? "Fechar cadastro"
                            : "+ Novo aluno"}
                    </button>

                    {/* EDIÇÃO */}

                    <button
                        type="button"
                        className={
                            "alunos-gestao-botao " +
                            "alunos-gestao-botao--secundario"
                        }
                        onClick={() => alterarModo("edicao")}
                        aria-expanded={modoFormulario === "edicao"}
                        aria-controls="alunos-gestao-formulario"
                    >
                        {modoFormulario === "edicao"
                            ? "Fechar edição"
                            : "Editar aluno"}
                    </button>

                    {/* EXCLUSÃO */}

                    <button
                        type="button"
                        className={
                            "alunos-gestao-botao " +
                            "alunos-gestao-botao--perigo"
                        }
                        onClick={() => alterarModo("exclusao")}
                        aria-expanded={modoFormulario === "exclusao"}
                        aria-controls="alunos-gestao-formulario"
                    >
                        {modoFormulario === "exclusao"
                            ? "Fechar exclusão"
                            : "Excluir aluno"}
                    </button>
                </div>
            </section>

            {/* ======================================
          FORMULÁRIOS
      ====================================== */}

            {modoFormulario !== null && (
                <div id="alunos-gestao-formulario">
                    {modoFormulario === "cadastro" && (
                        <FormularioAluno
                            token={token}
                            onCadastroRealizado={atualizarListagem}
                        />
                    )}

                    {modoFormulario === "edicao" && (
                        <FormularioEdicaoAluno
                            token={token}
                            onAtualizacaoRealizada={atualizarListagem}
                        />
                    )}

                    {modoFormulario === "exclusao" && (
                        <ExclusaoAluno
                            token={token}
                            onExclusaoRealizada={atualizarListagem}
                        />
                    )}
                </div>
            )}

            {/* ======================================
          LISTAGEM EXISTENTE
      ====================================== */}

            <Alunos key={versaoLista} token={token} />
        </div>
    );
}

export default AlunosGestao;
