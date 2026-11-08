export const MENU_ITEMS = [
    {
        id: "inicio",
        titulo: "Início",
        icone: "🏠",
        descricao: "Página inicial do sistema.",
    },
    {
        id: "dashboard",
        titulo: "Dashboard",
        icone: "📊",
        descricao: "Visão consolidada das informações escolares.",
    },
    {
        id: "escolas",
        titulo: "Escolas",
        icone: "🏫",
        descricao: "Cadastro e organização das escolas.",
    },
    {
        id: "turmas",
        titulo: "Turmas",
        icone: "👥",
        descricao: "Gerenciamento de turmas escolares.",
    },
    {
        id: "alunos",
        titulo: "Alunos",
        icone: "🎓",
        descricao: "Cadastro e acompanhamento de estudantes.",
    },
    {
        id: "frequencias",
        titulo: "Frequências",
        icone: "📅",
        descricao: "Registro de presenças e ausências.",
    },
    {
        id: "indicadores",
        titulo: "Indicadores",
        icone: "📈",
        descricao: "Análise dos indicadores de frequência.",
    },
    {
        id: "alertas",
        titulo: "Alertas",
        icone: "⚠️",
        descricao: "Classificações de acompanhamento escolar.",
    },
    {
        id: "intervencoes",
        titulo: "Intervenções",
        icone: "📋",
        descricao: "Registro das ações de acompanhamento.",
    },
];

// ============================================
// BUSCAR ITEM PELO IDENTIFICADOR
// ============================================

export function buscarItemMenu(id) {
    return MENU_ITEMS.find((item) => item.id === id);
}
