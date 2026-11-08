
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

# ============================================
# IMPORTAÇÃO DOS MODELS
# ============================================

from app.models.escola_model import Escola
from app.models.turma_model import Turma
from app.models.aluno_model import Aluno
from app.models.frequencia_model import Frequencia
from app.models.intervencao_model import Intervencao
from app.models.usuario_model import Usuario

# ============================================
# IMPORTAÇÃO DOS SCHEMAS PYDANTIC
# ============================================

from app.views.indicador_view import (
    PeriodoIndicador,
    ResumoFrequencia,
    PercentuaisFrequencia,
    IndicadorAlunoResponse,
    IndicadorTurmaResponse
)


# ============================================
# EXCEÇÕES PERSONALIZADAS
# ============================================

class IndicadorNaoEncontradoError(Exception):
    pass


class IndicadorPermissaoError(Exception):
    pass


class IndicadorPeriodoInvalidoError(Exception):
    pass


# ============================================
# VALIDAÇÃO DO USUÁRIO
# ============================================

def validar_usuario_ativo(usuario: Usuario):
    """
    Confirma que o usuário está ativo
    e possui um perfil reconhecido.
    """

    if not usuario.ativo:
        raise IndicadorPermissaoError(
            "Usuário sem acesso ao sistema."
        )

    perfis_permitidos = (
        "ADMINISTRADOR",
        "GESTOR",
        "COORDENADOR"
    )

    if usuario.perfil not in perfis_permitidos:
        raise IndicadorPermissaoError(
            "Perfil de usuário não autorizado."
        )


# ============================================
# VALIDAÇÃO DO PERÍODO
# ============================================

def validar_periodo_indicador(
    data_inicio: date | None = None,
    data_fim: date | None = None
) -> PeriodoIndicador:
    """
    Valida as datas e devolve um objeto
    PeriodoIndicador para a resposta da API.
    """

    if (
        data_inicio is not None
        and data_fim is not None
        and data_inicio > data_fim
    ):
        raise IndicadorPeriodoInvalidoError(
            "A data inicial não pode ser "
            "posterior à data final."
        )

    return PeriodoIndicador(
        data_inicio=data_inicio,
        data_fim=data_fim
    )


# ============================================
# CONSULTA DE ALUNO AUTORIZADO
# ============================================

def buscar_aluno_autorizado(
    db: Session,
    aluno_id: int,
    usuario: Usuario
) -> tuple[Aluno, Turma, Escola]:
    """
    Busca o aluno e seus vínculos.

    ADMINISTRADOR consulta todas as escolas.
    Outros perfis consultam apenas a
    própria escola ativa.
    """

    validar_usuario_ativo(usuario)

    consulta = (
        select(Aluno, Turma, Escola)
        .join(
            Turma,
            Aluno.turma_id == Turma.id
        )
        .join(
            Escola,
            Turma.escola_id == Escola.id
        )
        .where(
            Aluno.id == aluno_id
        )
    )

    if usuario.perfil != "ADMINISTRADOR":
        consulta = consulta.where(
            Escola.id == usuario.escola_id,
            Escola.ativo.is_(True)
        )

    resultado = db.execute(
        consulta
    ).one_or_none()

    if resultado is None:
        raise IndicadorNaoEncontradoError(
            "Aluno não encontrado ou sem acesso."
        )

    aluno, turma, escola = resultado

    return aluno, turma, escola


# ============================================
# CONSULTA DE TURMA AUTORIZADA
# ============================================

def buscar_turma_autorizada(
    db: Session,
    turma_id: int,
    usuario: Usuario
) -> tuple[Turma, Escola]:
    """
    Busca a turma e sua escola, respeitando
    as permissões do usuário.
    """

    validar_usuario_ativo(usuario)

    consulta = (
        select(Turma, Escola)
        .join(
            Escola,
            Turma.escola_id == Escola.id
        )
        .where(
            Turma.id == turma_id
        )
    )

    if usuario.perfil != "ADMINISTRADOR":
        consulta = consulta.where(
            Escola.id == usuario.escola_id,
            Escola.ativo.is_(True)
        )

    resultado = db.execute(
        consulta
    ).one_or_none()

    if resultado is None:
        raise IndicadorNaoEncontradoError(
            "Turma não encontrada ou sem acesso."
        )

    turma, escola = resultado

    return turma, escola


# ============================================
# FILTRO DE FREQUÊNCIAS POR PERÍODO
# ============================================

def aplicar_periodo_frequencia(
    consulta,
    periodo: PeriodoIndicador
):
    """
    Acrescenta os filtros de data à
    consulta SQLAlchemy recebida.
    """

    if periodo.data_inicio is not None:
        consulta = consulta.where(
            Frequencia.data >= periodo.data_inicio
        )

    if periodo.data_fim is not None:
        consulta = consulta.where(
            Frequencia.data <= periodo.data_fim
        )

    return consulta


# ============================================
# CÁLCULO DAS QUANTIDADES
# ============================================

def montar_resumo_frequencia(
    presencas: int,
    ausencias: int,
    justificadas: int
) -> ResumoFrequencia:
    """
    Monta o resumo usando as contagens
    obtidas no MySQL.
    """

    total = (
        presencas
        + ausencias
        + justificadas
    )

    return ResumoFrequencia(
        total_registros=total,
        total_presencas=presencas,
        total_ausencias=ausencias,
        total_justificadas=justificadas
    )


def calcular_resumo_frequencia(
    db: Session,
    aluno_id: int,
    periodo: PeriodoIndicador
) -> ResumoFrequencia:
    """
    Consulta as frequências de um aluno,
    agrupando pela situação registrada.
    """

    consulta = (
        select(
            Frequencia.situacao,
            func.count(Frequencia.id)
        )
        .where(
            Frequencia.aluno_id == aluno_id
        )
        .group_by(
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

    contagens = {
        "PRESENTE": 0,
        "AUSENTE": 0,
        "JUSTIFICADA": 0
    }

    for situacao, quantidade in resultados:
        if situacao in contagens:
            contagens[situacao] = quantidade

    return montar_resumo_frequencia(
        presencas=contagens["PRESENTE"],
        ausencias=contagens["AUSENTE"],
        justificadas=contagens["JUSTIFICADA"]
    )


# ============================================
# CÁLCULO DOS PERCENTUAIS
# ============================================

def calcular_percentuais(
    resumo: ResumoFrequencia
) -> PercentuaisFrequencia:
    """
    Calcula percentuais usando os registros
    existentes, sem dividir por zero.
    """

    total = resumo.total_registros

    if total == 0:
        return PercentuaisFrequencia(
            percentual_presenca=None,
            percentual_ausencia=None,
            percentual_justificada=None,
            percentual_ausencia_total=None
        )

    percentual_presenca = round(
        resumo.total_presencas / total * 100,
        2
    )

    percentual_ausencia = round(
        resumo.total_ausencias / total * 100,
        2
    )

    percentual_justificada = round(
        resumo.total_justificadas / total * 100,
        2
    )

    percentual_ausencia_total = round(
        (
            resumo.total_ausencias
            + resumo.total_justificadas
        ) / total * 100,
        2
    )

    return PercentuaisFrequencia(
        percentual_presenca=percentual_presenca,
        percentual_ausencia=percentual_ausencia,
        percentual_justificada=percentual_justificada,
        percentual_ausencia_total=percentual_ausencia_total
    )


# ============================================
# INDICADOR INDIVIDUAL DO ALUNO
# ============================================

def obter_indicador_aluno(
    db: Session,
    aluno_id: int,
    usuario: Usuario,
    data_inicio: date | None = None,
    data_fim: date | None = None
) -> IndicadorAlunoResponse:
    """
    Consulta o aluno autorizado e calcula
    seus indicadores de frequência.
    """

    periodo = validar_periodo_indicador(
        data_inicio=data_inicio,
        data_fim=data_fim
    )

    aluno, turma, escola = buscar_aluno_autorizado(
        db=db,
        aluno_id=aluno_id,
        usuario=usuario
    )

    resumo = calcular_resumo_frequencia(
        db=db,
        aluno_id=aluno.id,
        periodo=periodo
    )

    percentuais = calcular_percentuais(
        resumo
    )

    return IndicadorAlunoResponse(
        aluno_id=aluno.id,
        codigo_aluno=aluno.codigo_aluno,
        nome_aluno=aluno.nome,
        turma_id=turma.id,
        nome_turma=turma.nome,
        escola_id=escola.id,
        nome_escola=escola.nome,
        periodo=periodo,
        resumo=resumo,
        percentuais=percentuais,
        possui_registros=(
            resumo.total_registros > 0
        )
    )


# ============================================
# INDICADOR GERAL DA TURMA
# ============================================

def obter_indicador_turma(
    db: Session,
    turma_id: int,
    usuario: Usuario,
    data_inicio: date | None = None,
    data_fim: date | None = None
) -> IndicadorTurmaResponse:
    """
    Calcula a média simples dos percentuais
    individuais de presença dos alunos
    ativos de uma turma.

    Alunos sem registros não entram
    no cálculo da média.
    """

    periodo = validar_periodo_indicador(
        data_inicio=data_inicio,
        data_fim=data_fim
    )

    turma, escola = buscar_turma_autorizada(
        db=db,
        turma_id=turma_id,
        usuario=usuario
    )

    # Consideramos os alunos atualmente ativos.
    consulta_alunos = (
        select(Aluno.id)
        .where(
            Aluno.turma_id == turma.id,
            Aluno.ativo.is_(True)
        )
        .order_by(
            Aluno.id
        )
    )

    alunos_ids = db.execute(
        consulta_alunos
    ).scalars().all()

    total_alunos = len(alunos_ids)

    # Turma sem alunos ativos.
    if total_alunos == 0:
        return IndicadorTurmaResponse(
            turma_id=turma.id,
            nome_turma=turma.nome,
            escola_id=escola.id,
            periodo=periodo,
            total_alunos=0,
            alunos_com_registros=0,
            alunos_sem_registros=0,
            media_percentual_presenca=None
        )

    # Uma única consulta agrupada para obter
    # as contagens de todos os alunos ativos.
    consulta_frequencias = (
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

    consulta_frequencias = aplicar_periodo_frequencia(
        consulta_frequencias,
        periodo
    )

    resultados = db.execute(
        consulta_frequencias
    ).all()

    # Inicializamos os contadores dos alunos.
    contagens_por_aluno = {
        aluno_id: {
            "PRESENTE": 0,
            "AUSENTE": 0,
            "JUSTIFICADA": 0
        }
        for aluno_id in alunos_ids
    }

    # Preenchemos os valores retornados
    # pelo GROUP BY do SQLAlchemy.
    for aluno_id, situacao, quantidade in resultados:

        if situacao in contagens_por_aluno[aluno_id]:
            contagens_por_aluno[aluno_id][
                situacao
            ] = quantidade

    alunos_com_registros = 0
    soma_percentuais = 0.0

    # Calculamos o percentual de cada aluno.
    for aluno_id in alunos_ids:

        contagens = contagens_por_aluno[aluno_id]

        resumo = montar_resumo_frequencia(
            presencas=contagens["PRESENTE"],
            ausencias=contagens["AUSENTE"],
            justificadas=contagens["JUSTIFICADA"]
        )

        # Ignoramos alunos sem registros.
        if resumo.total_registros == 0:
            continue

        alunos_com_registros += 1

        # Média baseada em taxas individuais
        # calculadas sem arredondamento prévio.
        soma_percentuais += (
            resumo.total_presencas
            / resumo.total_registros
            * 100
        )

    alunos_sem_registros = (
        total_alunos - alunos_com_registros
    )

    if alunos_com_registros == 0:
        media_percentual_presenca = None

    else:
        media_percentual_presenca = round(
            soma_percentuais / alunos_com_registros,
            2
        )

    return IndicadorTurmaResponse(
        turma_id=turma.id,
        nome_turma=turma.nome,
        escola_id=escola.id,
        periodo=periodo,
        total_alunos=total_alunos,
        alunos_com_registros=alunos_com_registros,
        alunos_sem_registros=alunos_sem_registros,
        media_percentual_presenca=(
            media_percentual_presenca
        )
    )
