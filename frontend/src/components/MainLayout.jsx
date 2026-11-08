import { useState } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";

// ============================================
// LAYOUT PRINCIPAL DA ÁREA AUTENTICADA
// ============================================

function MainLayout({ paginaAtual, onNavegar, matricula, onSair, children }) {
    const [menuAberto, setMenuAberto] = useState(false);

    // ==========================================
    // CONTROLE DO MENU
    // ==========================================

    function abrirMenu() {
        setMenuAberto(true);
    }

    function fecharMenu() {
        setMenuAberto(false);
    }

    // ==========================================
    // INTERFACE PRINCIPAL
    // ==========================================

    return (
        <div className="layout-principal">
            <Sidebar
                paginaAtual={paginaAtual}
                onNavegar={onNavegar}
                menuAberto={menuAberto}
                onFechar={fecharMenu}
            />

            <div className="layout-area">
                <Header
                    paginaAtual={paginaAtual}
                    matricula={matricula}
                    onSair={onSair}
                    onAbrirMenu={abrirMenu}
                />

                <main className="layout-conteudo" id="conteudo-principal">
                    {children}
                </main>

                <footer className="layout-rodape">
                    <span>Sistema de Monitoramento Escolar</span>

                    <span>React + FastAPI</span>
                </footer>
            </div>
        </div>
    );
}

export default MainLayout;
