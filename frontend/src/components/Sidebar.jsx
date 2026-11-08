import { MENU_ITEMS } from "../config/menu";

// ============================================
// COMPONENTE DO MENU LATERAL
// ============================================

function Sidebar({ paginaAtual, onNavegar, menuAberto, onFechar }) {
    function selecionarPagina(id) {
        onNavegar(id);
        onFechar();
    }

    return (
        <>
            {/* FUNDO ESCURO NO CELULAR */}

            {menuAberto && (
                <button
                    type="button"
                    className="sidebar-overlay"
                    onClick={onFechar}
                    aria-label="Fechar menu lateral"
                />
            )}

            {/* MENU LATERAL */}

            <aside
                className={menuAberto ? "sidebar sidebar--aberta" : "sidebar"}
                aria-label="Menu principal"
            >
                <div className="sidebar-marca">
                    <span className="sidebar-marca-icone" aria-hidden="true">
                        🎓
                    </span>

                    <div>
                        <h2>Monitoramento</h2>
                        <p>Gestão Escolar</p>
                    </div>

                    <button
                        type="button"
                        className="sidebar-fechar"
                        onClick={onFechar}
                        aria-label="Fechar menu"
                    >
                        ✕
                    </button>
                </div>

                <nav
                    className="sidebar-navegacao"
                    aria-label="Módulos do sistema"
                >
                    <p className="sidebar-secao">MENU PRINCIPAL</p>

                    {MENU_ITEMS.map((item) => {
                        const ativo = paginaAtual === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={
                                    ativo
                                        ? "sidebar-item sidebar-item--ativo"
                                        : "sidebar-item"
                                }
                                onClick={() => selecionarPagina(item.id)}
                                aria-current={ativo ? "page" : undefined}
                            >
                                <span
                                    className="sidebar-item-icone"
                                    aria-hidden="true"
                                >
                                    {item.icone}
                                </span>

                                <span>{item.titulo}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-rodape">
                    <p>Sistema de Prevenção de Evasão</p>
                    <small>Frontend React</small>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
