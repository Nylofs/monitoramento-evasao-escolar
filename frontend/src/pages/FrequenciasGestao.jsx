import { useState } from "react";

import Frequencias from "./Frequencias";

import FormularioFrequencia from "../components/FormularioFrequencia";

// ============================================
// PÁGINA DE GESTÃO DE FREQUÊNCIAS
// ============================================

function FrequenciasGestao({ token }) {
    // ==========================================
    // MOSTRAR FORMULÁRIO
    // ==========================================

    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    // ==========================================
    // VERSÃO DA LISTAGEM
    // ==========================================

    const [versaoLista, setVersaoLista] = useState(0);

    // ==========================================
    // ABRIR / FECHAR FORMULÁRIO
    // ==========================================

    function alternarFormulario() {
        setMostrarFormulario((anterior) => !anterior);
    }

    // ==========================================
    // CADASTRO CONFIRMADO
    // ==========================================

    function cadastroRealizado() {
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
                        Consulte presenças e ausências e registre novas
                        frequências escolares.
                    </p>
                </div>

                <button
                    type="button"
                    className="frequencias-gestao-botao"
                    onClick={alternarFormulario}
                    aria-expanded={mostrarFormulario}
                    aria-controls="frequencias-gestao-formulario"
                >
                    {mostrarFormulario
                        ? "Fechar cadastro"
                        : "+ Registrar frequência"}
                </button>
            </section>

            {/* ======================================
          FORMULÁRIO
      ====================================== */}

            {mostrarFormulario && (
                <div id="frequencias-gestao-formulario">
                    <FormularioFrequencia
                        token={token}
                        onCadastroRealizado={cadastroRealizado}
                    />
                </div>
            )}

            {/* ======================================
          LISTAGEM EXISTENTE
      ====================================== */}

            <Frequencias key={versaoLista} token={token} />
        </div>
    );
}

export default FrequenciasGestao;
