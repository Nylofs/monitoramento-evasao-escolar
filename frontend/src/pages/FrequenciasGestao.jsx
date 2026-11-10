import { useState } from "react";

import Frequencias from "./Frequencias";

import FormularioFrequencia from "../components/FormularioFrequencia";

import FormularioEdicaoFrequencia from "../components/FormularioEdicaoFrequencia";

import ExclusaoFrequencia from "../components/ExclusaoFrequencia";

// ============================================
// GESTÃO DE FREQUÊNCIAS
// ============================================

function FrequenciasGestao({ token }) {
    // ==========================================
    // MODO DO FORMULÁRIO
    // null | cadastro | edicao | exclusao
    // ==========================================

    const [modoFormulario, setModoFormulario] = useState(null);

    // ==========================================
    // CONTROLE DA LISTAGEM
    // ==========================================

    const [versaoLista, setVersaoLista] = useState(0);

    // ==========================================
    // ABRIR OU FECHAR FORMULÁRIO
    // ==========================================

    function alterarModo(novoModo) {
        setModoFormulario((anterior) =>
            anterior === novoModo ? null : novoModo,
        );
    }

    // ==========================================
    // ATUALIZAR LISTAGEM
    // ==========================================

    function atualizarListagem() {
        setVersaoLista((anterior) => anterior + 1);
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="frequencias-gestao">
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <section className="frequencias-gestao-acoes">
                <div>
                    <h2>Gestão de frequências</h2>

                    <p>
                        Consulte, registre, edite e exclua frequências conforme
                        suas permissões.
                    </p>
                </div>

                <div className="frequencias-gestao-botoes">
                    {/* CADASTRO */}

                    <button
                        type="button"
                        className="frequencias-gestao-botao"
                        aria-expanded={modoFormulario === "cadastro"}
                        aria-controls="frequencias-gestao-formulario"
                        onClick={() => alterarModo("cadastro")}
                    >
                        {modoFormulario === "cadastro"
                            ? "Fechar cadastro"
                            : "+ Registrar frequência"}
                    </button>

                    {/* EDIÇÃO */}

                    <button
                        type="button"
                        className={
                            "frequencias-gestao-botao " +
                            "frequencias-gestao-botao--secundario"
                        }
                        aria-expanded={modoFormulario === "edicao"}
                        aria-controls="frequencias-gestao-formulario"
                        onClick={() => alterarModo("edicao")}
                    >
                        {modoFormulario === "edicao"
                            ? "Fechar edição"
                            : "Editar frequência"}
                    </button>

                    {/* EXCLUSÃO */}

                    <button
                        type="button"
                        className={
                            "frequencias-gestao-botao " +
                            "frequencias-gestao-botao--perigo"
                        }
                        aria-expanded={modoFormulario === "exclusao"}
                        aria-controls="frequencias-gestao-formulario"
                        onClick={() => alterarModo("exclusao")}
                    >
                        {modoFormulario === "exclusao"
                            ? "Fechar exclusão"
                            : "Excluir frequência"}
                    </button>
                </div>
            </section>

            {/* ======================================
          FORMULÁRIOS
      ====================================== */}

            {modoFormulario !== null && (
                <div id="frequencias-gestao-formulario">
                    {modoFormulario === "cadastro" && (
                        <FormularioFrequencia
                            token={token}
                            onCadastroRealizado={atualizarListagem}
                        />
                    )}

                    {modoFormulario === "edicao" && (
                        <FormularioEdicaoFrequencia
                            token={token}
                            onAtualizacaoRealizada={atualizarListagem}
                        />
                    )}

                    {modoFormulario === "exclusao" && (
                        <ExclusaoFrequencia
                            token={token}
                            onExclusaoRealizada={atualizarListagem}
                        />
                    )}
                </div>
            )}

            {/* ======================================
          LISTAGEM ORIGINAL
      ====================================== */}

            <Frequencias key={versaoLista} token={token} />
        </div>
    );
}

export default FrequenciasGestao;
