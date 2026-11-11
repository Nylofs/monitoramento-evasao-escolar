import { useState } from "react";

import Alertas from "./Alertas";

import PainelTriagemAlertas from "../components/PainelTriagemAlertas";

// ============================================
// ETAPA 15 - PARTE 31
// GESTÃO DE ALERTAS
// ============================================

function AlertasGestao({ token }) {
    const [modo, setModo] = useState("triagem");

    return (
        <div className="alertas-gestao">
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <section className="alertas-gestao-topo">
                <div>
                    <h2>Gestão de Alertas</h2>

                    <p>
                        Acompanhe os alertas escolares e consulte os registros
                        de risco.
                    </p>
                </div>

                <div
                    className="alertas-gestao-botoes"
                    role="group"
                    aria-label="Visualização de alertas"
                >
                    <button
                        type="button"
                        className={
                            "alertas-gestao-botao " +
                            (modo === "triagem"
                                ? "alertas-gestao-botao--ativo"
                                : "")
                        }
                        aria-pressed={modo === "triagem"}
                        onClick={() => setModo("triagem")}
                    >
                        Painel de triagem
                    </button>

                    <button
                        type="button"
                        className={
                            "alertas-gestao-botao " +
                            (modo === "consulta"
                                ? "alertas-gestao-botao--ativo"
                                : "")
                        }
                        aria-pressed={modo === "consulta"}
                        onClick={() => setModo("consulta")}
                    >
                        Consulta original
                    </button>
                </div>
            </section>

            {/* ======================================
          NOVO PAINEL
      ====================================== */}

            {modo === "triagem" && <PainelTriagemAlertas token={token} />}

            {/* ======================================
          PÁGINA JÁ EXISTENTE
      ====================================== */}

            {modo === "consulta" && <Alertas token={token} />}
        </div>
    );
}

export default AlertasGestao;
