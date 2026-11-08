
from datetime import date

from sqlalchemy import select
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
# IMPORTAÇÃO DOS SCHEMAS
# ============================================

from app.views.indicador_view import (
    IndicadorAlunoResponse
)

from app.views.alerta_view import (
    AlertaAlunoResponse,
    AlertaTurmaResponse
)

# ============================================
# REUTILIZAÇÃO DO SERVICE DE INDICADORES
# ============================================

from app.services.indicador_service import (
    obter_indicador_aluno,
    buscar_turma_autorizada,
    validar_periodo_indicador
)


# ============================================
# PARÂMETROS INICIAIS DOS ALERTAS
# ============================================

MINIMO_REGISTROS = 5

LIMITE_ATENCAO = 15.0

LIMITE_PRIORITARIO = 30.0


# ============================================
# EXCEÇÃO DE CONFIGURAÇÃO
# ============================================

class AlertaConfiguracaoInvalidaError(Exception):
    pass


# ============================================
# VALIDAÇÃO DOS PARÂMETROS
# ============================================

def validar_minimo_registros(
    minimo_registros: int
):
    """
    Garante que o mínimo de registros
    seja um número inteiro positivo.
    """

    if (
        type(minimo_registros) is not int
        or minimo_registros < 1
    ):
        raise AlertaConfiguracaoInvalidaError(
            "O mínimo de registros deve ser "
            "um número inteiro maior que zero."
        )


def validar_limites_alerta():
    """
    Verifica se os limites de atenção
    e prioridade estão em ordem correta.
    """

    if not (
        0 <= LIMITE_ATENCAO
        < LIMITE_PRIORITARIO
        <= 100
    ):
        raise AlertaConfiguracaoInvalidaError(
            "Os limites de alerta estão inválidos."
        )


# ============================================
# CLASSIFICAÇÃO DE UM INDICADOR
# ============================================

def classificar_indicador(
    indicador: IndicadorAlunoResponse,
    minimo_registros: int = MINIMO_REGISTROS
) -> AlertaAlunoResponse:
    """
    Recebe um indicador previamente calculado
    e produz uma classificação explicável.

    Não acessa diretamente o MySQL.
    """

    validar_minimo_registros(
        minimo_registros
    )

    validar_limites_alerta()

    resumo = indicador.resumo

    total = resumo.total_registros

    # ----------------------------------------
    # CASO 1 - NENHUM REGISTRO
    # ----------------------------------------

    if total == 0:

        return AlertaAlunoResponse(
            indicador=indicador,
            nivel_alerta="SEM_DADOS",
            minimo_registros=minimo_registros,
            requer_acompanhamento=False,
            motivos=[
                "Não existem frequências registradas "
                "no período analisado.",
                "É necessário verificar os lançamentos "
                "antes de avaliar a frequência."
            ]
        )

    # ----------------------------------------
    # CASO 2 - DADOS INSUFICIENTES
    # ----------------------------------------

    if total < minimo_registros:

        return AlertaAlunoResponse(
            indicador=indicador,
            nivel_alerta="DADOS_INSUFICIENTES",
            minimo_registros=minimo_registros,
            requer_acompanhamento=False,
            motivos=[
                (
                    f"O aluno possui {total} registro(s) "
                    f"de frequência."
                ),
                (
                    f"O mínimo configurado para "
                    f"classificação é {minimo_registros}."
                ),
                "É necessário ampliar ou verificar "
                "os registros disponíveis."
            ]
        )

    # ----------------------------------------
    # CASO 3 - DADOS SUFICIENTES
    # ----------------------------------------

    # Usamos as contagens originais para evitar
    # decisões baseadas em percentuais arredondados.
    percentual_ausencia = (
        resumo.total_ausencias / total
    ) * 100

    # ----------------------------------------
    # CLASSIFICAÇÃO PRIORITÁRIA
    # ----------------------------------------

    if percentual_ausencia >= LIMITE_PRIORITARIO:

        nivel = "PRIORITARIO"

        motivos = [
            (
                f"Ausências não justificadas: "
                f"{resumo.total_ausencias} "
                f"em {total} registros."
            ),
            (
                f"Percentual de ausência não "
                f"justificada: "
                f"{percentual_ausencia:.2f}%."
            ),
            (
                f"O percentual atingiu o limite "
                f"de prioridade de "
                f"{LIMITE_PRIORITARIO:.2f}%."
            )
        ]

    # ----------------------------------------
    # CLASSIFICAÇÃO DE ATENÇÃO
    # ----------------------------------------

    elif percentual_ausencia >= LIMITE_ATENCAO:

        nivel = "ATENCAO"

        motivos = [
            (
                f"Ausências não justificadas: "
                f"{resumo.total_ausencias} "
                f"em {total} registros."
            ),
            (
                f"Percentual de ausência não "
                f"justificada: "
                f"{percentual_ausencia:.2f}%."
            ),
            (
                f"O percentual atingiu o limite "
                f"de atenção de "
                f"{LIMITE_ATENCAO:.2f}%."
            )
        ]

    # ----------------------------------------
    # CLASSIFICAÇÃO REGULAR
    # ----------------------------------------

    else:

        nivel = "REGULAR"

        motivos = [
            (
                f"Ausências não justificadas: "
                f"{resumo.total_ausencias} "
                f"em {total} registros."
            ),
            (
                f"Percentual de ausência não "
                f"justificada: "
                f"{percentual_ausencia:.2f}%."
            ),
            (
                f"O percentual está abaixo do "
                f"limite de atenção de "
                f"{LIMITE_ATENCAO:.2f}%."
            )
        ]

    # ----------------------------------------
    # MONTAGEM DA RESPOSTA
    # ----------------------------------------

    requer_acompanhamento = nivel in (
        "ATENCAO",
        "PRIORITARIO"
    )

    return AlertaAlunoResponse(
        indicador=indicador,
        nivel_alerta=nivel,
        minimo_registros=minimo_registros,
        requer_acompanhamento=requer_acompanhamento,
        motivos=motivos
    )


# ============================================
# ALERTA INDIVIDUAL DO ALUNO
# ============================================

def gerar_alerta_aluno(
    db: Session,
    aluno_id: int,
    usuario: Usuario,
    data_inicio: date | None = None,
    data_fim: date | None = None
) -> AlertaAlunoResponse:
    """
    Gera um alerta para um aluno
    utilizando o Service de Indicadores.

    A autorização por escola é aplicada
    antes de consultar as frequências.
    """

    indicador = obter_indicador_aluno(
        db=db,
        aluno_id=aluno_id,
        usuario=usuario,
        data_inicio=data_inicio,
        data_fim=data_fim
    )

    return classificar_indicador(
        indicador=indicador,
        minimo_registros=MINIMO_REGISTROS
    )


# ============================================
# RESUMO DE ALERTAS POR TURMA
# ============================================

def gerar_alertas_turma(
    db: Session,
    turma_id: int,
    usuario: Usuario,
    data_inicio: date | None = None,
    data_fim: date | None = None
) -> AlertaTurmaResponse:
    """
    Classifica os alunos ativos de uma turma
    e contabiliza os níveis de alerta.

    A turma deve ser acessível ao usuário.
    """

    validar_minimo_registros(
        MINIMO_REGISTROS
    )

    validar_limites_alerta()

    # ----------------------------------------
    # VALIDAR O PERÍODO
    # ----------------------------------------

    periodo = validar_periodo_indicador(
        data_inicio=data_inicio,
        data_fim=data_fim
    )

    # ----------------------------------------
    # VERIFICAR O ACESSO À TURMA
    # ----------------------------------------

    turma, escola = buscar_turma_autorizada(
        db=db,
        turma_id=turma_id,
        usuario=usuario
    )

    # ----------------------------------------
    # BUSCAR OS ALUNOS ATIVOS
    # ----------------------------------------

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

    # ----------------------------------------
    # INICIALIZAR CONTADORES
    # ----------------------------------------

    contagens = {
        "SEM_DADOS": 0,
        "DADOS_INSUFICIENTES": 0,
        "REGULAR": 0,
        "ATENCAO": 0,
        "PRIORITARIO": 0
    }

    # ----------------------------------------
    # CLASSIFICAR CADA ALUNO
    # ----------------------------------------

    for aluno_id in alunos_ids:

        alerta = gerar_alerta_aluno(
            db=db,
            aluno_id=aluno_id,
            usuario=usuario,
            data_inicio=periodo.data_inicio,
            data_fim=periodo.data_fim
        )

        contagens[alerta.nivel_alerta] += 1

    # ----------------------------------------
    # TOTAL DE ACOMPANHAMENTO
    # ----------------------------------------

    total_acompanhamento = (
        contagens["ATENCAO"]
        + contagens["PRIORITARIO"]
    )

    # ----------------------------------------
    # MONTAR A RESPOSTA DA TURMA
    # ----------------------------------------

    return AlertaTurmaResponse(
        turma_id=turma.id,
        nome_turma=turma.nome,
        escola_id=escola.id,
        periodo=periodo,
        minimo_registros=MINIMO_REGISTROS,
        total_alunos=len(alunos_ids),
        total_sem_dados=contagens["SEM_DADOS"],
        total_dados_insuficientes=(
            contagens["DADOS_INSUFICIENTES"]
        ),
        total_regular=contagens["REGULAR"],
        total_atencao=contagens["ATENCAO"],
        total_prioritario=contagens["PRIORITARIO"],
        total_requer_acompanhamento=(
            total_acompanhamento
        )
    )
