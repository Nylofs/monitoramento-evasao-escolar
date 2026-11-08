import { buscarItemMenu } from "../config/menu";

// ============================================
// CABEÇALHO DO SISTEMA
// ============================================

function Header({ paginaAtual, matricula, onSair, onAbrirMenu }) {
    const pagina = buscarItemMenu(paginaAtual);

    const tituloPagina = pagina ? pagina.titulo : "Sistema Escolar";

    return (
        <header className="header-interno">
            <div className="header-esquerda">
                <button
                    type="button"
                    className="header-menu-botao"
                    onClick={onAbrirMenu}
                    aria-label="Abrir menu lateral"
                >
                    ☰
                </button>

                <div>
                    <p className="header-localizacao">
                        Sistema / {tituloPagina}
                    </p>

                    <h1>{tituloPagina}</h1>
                </div>
            </div>

            <div className="header-direita">
                <div className="header-usuario">
                    <span className="header-avatar" aria-hidden="true">
                        👤
                    </span>

                    <div>
                        <small>Usuário autenticado</small>
                        <strong>{matricula}</strong>
                    </div>
                </div>

                <button type="button" className="header-sair" onClick={onSair}>
                    Sair
                </button>
            </div>
        </header>
    );
}

export default Header;
