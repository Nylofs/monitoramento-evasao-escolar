import ApiStatus from "../components/ApiStatus";

import { MENU_ITEMS } from "../config/menu";

// ============================================
// PÁGINA INICIAL DO SISTEMA
// ============================================

function Home({ matricula, onNavegar }) {
    const modulos = MENU_ITEMS.filter((item) => item.id !== "inicio");

    return (
        <div className="pagina-home">
            <section className="home-boas-vindas">
                <span className="home-identificador">
                    SISTEMA DE MONITORAMENTO ESCOLAR
                </span>

                <h2>Bem-vindo ao sistema!</h2>

                <p>
                    Você está autenticado com a matrícula
                    <strong> {matricula}</strong>.
                </p>

                <p>
                    Utilize os módulos abaixo ou o menu lateral para navegar
                    pela aplicação.
                </p>
            </section>

            <ApiStatus />

            <section
                className="home-modulos"
                aria-labelledby="home-titulo-modulos"
            >
                <div className="home-secao-titulo">
                    <h2 id="home-titulo-modulos">Módulos do sistema</h2>

                    <p>Selecione uma funcionalidade.</p>
                </div>

                <div className="home-grade">
                    {modulos.map((modulo) => (
                        <button
                            type="button"
                            className="home-cartao"
                            key={modulo.id}
                            onClick={() => onNavegar(modulo.id)}
                        >
                            <span
                                className="home-cartao-icone"
                                aria-hidden="true"
                            >
                                {modulo.icone}
                            </span>

                            <h3>{modulo.titulo}</h3>

                            <p>{modulo.descricao}</p>

                            <span className="home-cartao-acao">
                                Acessar módulo →
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="home-informativo">
                <h2>Sobre esta etapa</h2>

                <p>
                    O layout e a navegação já estão funcionando. As páginas dos
                    módulos serão integradas aos dados reais da API nas próximas
                    etapas.
                </p>
            </section>
        </div>
    );
}

export default Home;
