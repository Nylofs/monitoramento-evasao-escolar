import { useState } from "react";

import Frequencias from "./Frequencias";

import FormularioFrequencia from "../components/FormularioFrequencia";

import FormularioEdicaoFrequencia from "../components/FormularioEdicaoFrequencia";

// ============================================
// GESTÃO DE FREQUÊNCIAS
// ============================================

function FrequenciasGestao({ token }) {
    // ==========================================
    // MODO DO FORMULÁRIO
    //
    // null | cadastro | edicao
    // ==========================================

    const [modoFormulario, setModoFormulario] = useState(null);

    // ==========================================
    // CONTROLE DA LISTAGEM
    // ==========================================

    const [versaoLista, setVersaoLista] = useState(0);

    // ==========================================
    // ALTERNAR FORMULÁRIO
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
        <div className="frequencias-gestao">
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <section className="frequencias-gestao-acoes">
                <div>
                    <h2>Gestão de frequências</h2>

                    <p>
                        Consulte, registre e atualize os lançamentos escolares.
                    </p>
                </div>

                <div className="frequencias-gestao-botoes">
                    {/* CADASTRO */}

                    <button
                        type="button"
                        className="frequencias-gestao-botao"
                        onClick={() => alterarModo("cadastro")}
                        aria-expanded={modoFormulario === "cadastro"}
                        aria-controls="frequencias-gestao-formulario"
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
                        onClick={() => alterarModo("edicao")}
                        aria-expanded={modoFormulario === "edicao"}
                        aria-controls="frequencias-gestao-formulario"
                    >
                        {modoFormulario === "edicao"
                            ? "Fechar edição"
                            : "Editar frequência"}
                    </button>
                </div>
            </section>

            {/* ======================================
          ÁREA DOS FORMULÁRIOS
      ====================================== */}

            {modoFormulario !== null && (
                <div id="frequencias-gestao-formulario">
                    {/* CADASTRO EXISTENTE */}

                    {modoFormulario === "cadastro" && (
                        <FormularioFrequencia
                            token={token}
                            onCadastroRealizado={atualizarListagem}
                        />
                    )}

                    {/* NOVA EDIÇÃO */}

                    {modoFormulario === "edicao" && (
                        <FormularioEdicaoFrequencia
                            token={token}
                            onAtualizacaoRealizada={atualizarListagem}
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
