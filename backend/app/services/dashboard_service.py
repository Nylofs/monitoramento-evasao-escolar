
from datetime import date

from sqlalchemy import select, func
from sqlalchemy.orm import Session

# ============================================
# MODELS DO SISTEMA
# ============================================

from app.models.escola_model import Escola
from app.models.turma_model import Turma
from app.models.aluno_model import Aluno
from app.models.frequencia_model import Frequencia
from app.models.intervencao_model import Intervencao
from app.models.usuario_model import Usuario

# ============================================
# VIEWS PYDANTIC
# ============================================

from app.views.indicador_view import (
    PeriodoIndicador,
    IndicadorAlunoResponse
)

from app.views.dashboard_view import (
    DashboardEscolaResumo,
    DashboardFrequenciaResumo,
    DashboardAlertasResumo,
    DashboardIntervencoesResumo,
    DashboardEscolaResponse
)

# ============================================
# REUTILIZAÇÃO DOS SERVICES EXISTENTES
# ============================================

from app.services.indicador_service import (
    validar_usuario_ativo,
    validar_periodo_indicador,
    aplicar_periodo_frequencia,
    montar_resumo_frequencia,
    calcular_percentuais,
    IndicadorNaoEncontradoError
)

from app.services.alerta_service import (
    classificar_indicador,
    MINIMO_REGISTROS
)


# ============================================
# CONSULTA DE ESCOLA AUTORIZADA
# ============================================

def buscar_escola_dashboard(
    db: Session,
    escola_id: int,
    usuario: Usuario
) -> Escola:
    """
    Confirma a existência da escola
    e as permissões do usuário.

    Administrador: acesso global.
    Gestor e coordenador: escola própria ativa.
    """

    validar_usuario_ativo(usuario)

    consulta = select(Escola).where(
        Escola.id == escola_id
    )

    if usuario.perfil != "ADMINISTRADOR":
        consulta = consulta.where(
            Escola.id == usuario.escola_id,
            Escola.ativo.is_(True)
        )

    escola = db.execute(
        consulta
    ).scalar_one_or_none()

    if escola is None:
        raise IndicadorNaoEncontradoError(
            "Escola não encontrada ou sem acesso."
        )

    return escola


# ============================================
# CONSULTAR TURMAS E ALUNOS ATIVOS
# ============================================

def buscar_dados_escolares(
    db: Session,
    escola_id: int
) -> tuple[list[int], list[dict]]:
    """
    Busca as turmas ativas e os alunos
    ativos dessas turmas.

    A autorização da escola deve ser
    verificada antes de chamar esta função.
    """

    consulta_turmas = (
        select(Turma.id)
        .where(
            Turma.escola_id == escola_id,
            Turma.ativo.is_(True)
        )
        .order_by(Turma.id)
    )

    turmas_ids = list(
        db.execute(
            consulta_turmas
        ).scalars().all()
    )

    if not turmas_ids:
        return [], []

    consulta_alunos = (
        select(
            Aluno.id,
            Aluno.codigo_aluno,
            Aluno.nome,
            Aluno.turma_id,
            Turma.nome
        )
        .join(
            Turma,
            Aluno.turma_id == Turma.id
        )
        .where(
            Aluno.turma_id.in_(turmas_ids),
            Aluno.ativo.is_(True)
        )
        .order_by(Aluno.id)
    )

    resultados = db.execute(
        consulta_alunos
    ).all()

    alunos = []

    for (
        aluno_id,
        codigo_aluno,
        nome_aluno,
        turma_id,
        nome_turma
    ) in resultados:

        alunos.append({
            "aluno_id": aluno_id,
            "codigo_aluno": codigo_aluno,
            "nome_aluno": nome_aluno,
            "turma_id": turma_id,
            "nome_turma": nome_turma
        })

    return turmas_ids, alunos


# ============================================
# CONSULTAR CONTAGENS DE FREQUÊNCIA
# ============================================

def consultar_contagens_frequencia(
    db: Session,
    alunos_ids: list[int],
    periodo: PeriodoIndicador
) -> dict[int, dict[str, int]]:
    """
    Agrupa as frequências dos alunos
    por aluno e situação.

    Faz uma consulta SQL agrupada,
    evitando consultar um aluno por vez.
    """

    contagens = {
        aluno_id: {
            "PRESENTE": 0,
            "AUSENTE": 0,
            "JUSTIFICADA": 0
        }
        for aluno_id in alunos_ids
    }

    if not alunos_ids:
        return contagens

    consulta = (
        select(
            Frequencia.aluno_id,
            Frequencia.situacao,
            func.count(Frequencia.id)
        )
        .where(
            Frequencia.aluno_id.in_(alunos_ids)
        )
        .group_by(
            Frequencia.aluno_id,
            Frequencia.situacao
        )
    )

    consulta = aplicar_periodo_frequencia(
        consulta,
        periodo
    )

    resultados = db.execute(
        consulta
    ).all()

    for aluno_id, situacao, quantidade in resultados:

        if situacao in contagens[aluno_id]:
            contagens[aluno_id][situacao] = int(
                quantidade
            )

    return contagens


# ============================================
# MONTAR RESUMO GERAL DE FREQUÊNCIA
# ============================================

def montar_dashboard_frequencia(
    contagens: dict[int, dict[str, int]]
) -> DashboardFrequenciaResumo:
    """
    Soma as frequências de todos os alunos
    e calcula a taxa geral de presença.

    Utiliza os totais agregados, não a
    média simples das taxas individuais.
    """

    total_presencas = 0
    total_ausencias = 0
    total_justificadas = 0

    alunos_com_registros = 0
    alunos_sem_registros = 0

    for dados in contagens.values():

        presencas = dados["PRESENTE"]
        ausencias = dados["AUSENTE"]
        justificadas = dados["JUSTIFICADA"]

        total_aluno = (
            presencas
            + ausencias
            + justificadas
        )

        if total_aluno > 0:
            alunos_com_registros += 1
        else:
            alunos_sem_registros += 1

        total_presencas += presencas
        total_ausencias += ausencias
        total_justificadas += justificadas

    resumo = montar_resumo_frequencia(
        presencas=total_presencas,
        ausencias=total_ausencias,
        justificadas=total_justificadas
    )

    percentuais = calcular_percentuais(
        resumo
    )

    return DashboardFrequenciaResumo(
        alunos_com_registros=alunos_com_registros,
        alunos_sem_registros=alunos_sem_registros,
        resumo=resumo,
        percentuais=percentuais
    )


# ============================================
# MONTAR DISTRIBUIÇÃO DOS ALERTAS
# ============================================

def montar_dashboard_alertas(
    alunos: list[dict],
    contagens: dict[int, dict[str, int]],
    escola: Escola,
    periodo: PeriodoIndicador
) -> DashboardAlertasResumo:
    """
    Constrói os indicadores individuais
    em memória e reutiliza o classificador
    do Service de Alertas.

    Não realiza consultas extras ao banco.
    """

    niveis = {
        "SEM_DADOS": 0,
        "DADOS_INSUFICIENTES": 0,
        "REGULAR": 0,
        "ATENCAO": 0,
        "PRIORITARIO": 0
    }

    for aluno in alunos:

        aluno_id = aluno["aluno_id"]

        dados = contagens[aluno_id]

        resumo = montar_resumo_frequencia(
            presencas=dados["PRESENTE"],
            ausencias=dados["AUSENTE"],
            justificadas=dados["JUSTIFICADA"]
        )

        percentuais = calcular_percentuais(
            resumo
        )

        indicador = IndicadorAlunoResponse(
            aluno_id=aluno_id,
            codigo_aluno=aluno["codigo_aluno"],
            nome_aluno=aluno["nome_aluno"],
            turma_id=aluno["turma_id"],
            nome_turma=aluno["nome_turma"],
            escola_id=escola.id,
            nome_escola=escola.nome,
            periodo=periodo,
            resumo=resumo,
            percentuais=percentuais,
            possui_registros=(
                resumo.total_registros > 0
            )
        )

        alerta = classificar_indicador(
            indicador=indicador,
            minimo_registros=MINIMO_REGISTROS
        )

        niveis[alerta.nivel_alerta] += 1

    total_acompanhamento = (
        niveis["ATENCAO"]
        + niveis["PRIORITARIO"]
    )

    return DashboardAlertasResumo(
        minimo_registros=MINIMO_REGISTROS,
        total_sem_dados=niveis["SEM_DADOS"],
        total_dados_insuficientes=(
            niveis["DADOS_INSUFICIENTES"]
        ),
        total_regular=niveis["REGULAR"],
        total_atencao=niveis["ATENCAO"],
        total_prioritario=niveis["PRIORITARIO"],
        total_requer_acompanhamento=(
            total_acompanhamento
        )
    )


# ============================================
# CONSULTAR INTERVENÇÕES DA ESCOLA
# ============================================

def consultar_intervencoes_dashboard(
    db: Session,
    alunos_ids: list[int],
    periodo: PeriodoIndicador
) -> DashboardIntervencoesResumo:
    """
    Conta as intervenções dos alunos
    considerados no dashboard.

    O período utiliza data_intervencao.
    O status é o estado atual do registro.
    """

    contagens = {
        "ABERTO": 0,
        "EM_ANDAMENTO": 0,
        "CONCLUIDO": 0
    }

    if alunos_ids:

        consulta = (
            select(
                Intervencao.status,
                func.count(Intervencao.id)
            )
            .where(
                Intervencao.aluno_id.in_(
                    alunos_ids
                )
            )
            .group_by(
                Intervencao.status
            )
        )

        if periodo.data_inicio is not None:
            consulta = consulta.where(
                Intervencao.data_intervencao
                >= periodo.data_inicio
            )

        if periodo.data_fim is not None:
            consulta = consulta.where(
                Intervencao.data_intervencao
                <= periodo.data_fim
            )

        resultados = db.execute(
            consulta
        ).all()

        for situacao, quantidade in resultados:

            if situacao in contagens:
                contagens[situacao] = int(
                    quantidade
                )

    total = sum(
        contagens.values()
    )

    return DashboardIntervencoesResumo(
        total_intervencoes=total,
        total_abertas=contagens["ABERTO"],
        total_em_andamento=(
            contagens["EM_ANDAMENTO"]
        ),
        total_concluidas=(
            contagens["CONCLUIDO"]
        )
    )


# ============================================
# GERAR DASHBOARD COMPLETO DA ESCOLA
# ============================================

def gerar_dashboard_escola(
    db: Session,
    escola_id: int,
    usuario: Usuario,
    data_inicio: date | None = None,
    data_fim: date | None = None
) -> DashboardEscolaResponse:
    """
    Coordena a construção do dashboard.

    1. Valida o período.
    2. Confirma o acesso à escola.
    3. Busca turmas e alunos ativos.
    4. Consulta frequências agrupadas.
    5. Calcula o resumo de frequência.
    6. Classifica os alertas.
    7. Consulta intervenções.
    8. Monta a resposta Pydantic.
    """

    # ----------------------------------------
    # 1. VALIDAR O PERÍODO
    # ----------------------------------------

    periodo = validar_periodo_indicador(
        data_inicio=data_inicio,
        data_fim=data_fim
    )

    # ----------------------------------------
    # 2. VALIDAR A ESCOLA
    # ----------------------------------------

    escola = buscar_escola_dashboard(
        db=db,
        escola_id=escola_id,
        usuario=usuario
    )

    # ----------------------------------------
    # 3. BUSCAR TURMAS E ALUNOS ATIVOS
    # ----------------------------------------

    turmas_ids, alunos = buscar_dados_escolares(
        db=db,
        escola_id=escola.id
    )

    alunos_ids = [
        aluno["aluno_id"]
        for aluno in alunos
    ]

    # ----------------------------------------
    # 4. CONSULTAR AS FREQUÊNCIAS
    # ----------------------------------------

    contagens = consultar_contagens_frequencia(
        db=db,
        alunos_ids=alunos_ids,
        periodo=periodo
    )

    # ----------------------------------------
    # 5. CALCULAR RESUMO DE FREQUÊNCIA
    # ----------------------------------------

    frequencia = montar_dashboard_frequencia(
        contagens=contagens
    )

    # ----------------------------------------
    # 6. CLASSIFICAR OS ALERTAS
    # ----------------------------------------

    alertas = montar_dashboard_alertas(
        alunos=alunos,
        contagens=contagens,
        escola=escola,
        periodo=periodo
    )

    # ----------------------------------------
    # 7. CONSULTAR INTERVENÇÕES
    # ----------------------------------------

    intervencoes = consultar_intervencoes_dashboard(
        db=db,
        alunos_ids=alunos_ids,
        periodo=periodo
    )

    # ----------------------------------------
    # 8. IDENTIFICAR A ESCOLA
    # ----------------------------------------

    escola_resumo = DashboardEscolaResumo(
        escola_id=escola.id,
        nome_escola=escola.nome,
        total_turmas_ativas=len(turmas_ids),
        total_alunos_ativos=len(alunos_ids)
    )

    # ----------------------------------------
    # 9. MONTAR O DASHBOARD COMPLETO
    # ----------------------------------------

    return DashboardEscolaResponse(
        escola=escola_resumo,
        periodo=periodo,
        frequencia=frequencia,
        alertas=alertas,
        intervencoes=intervencoes
    )
