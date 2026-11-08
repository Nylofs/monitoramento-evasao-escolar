
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    Path,
    Query,
    status
)

from sqlalchemy.orm import Session

# ============================================
# CONEXÃO COM O BANCO DE DADOS
# ============================================

from app.database.connection import get_db

# ============================================
# MODEL DE USUÁRIO
# ============================================

from app.models.usuario_model import Usuario

# ============================================
# AUTENTICAÇÃO JWT EXISTENTE
# ============================================

from app.routes.escola_routes import (
    obter_usuario_atual
)

# ============================================
# SCHEMAS PYDANTIC
# ============================================

from app.views.alerta_view import (
    AlertaAlunoResponse,
    AlertaTurmaResponse
)

# ============================================
# CONTROLLERS DE ALERTAS
# ============================================

from app.controllers.alerta_controller import (
    gerar_alerta_aluno_controller,
    gerar_alertas_turma_controller
)


# ============================================
# CONFIGURAÇÃO DO ROTEADOR
# ============================================

router = APIRouter(
    prefix="/api/alertas",
    tags=["Alertas de Risco"]
)


# ============================================
# GET - ALERTA INDIVIDUAL DO ALUNO
# ============================================

@router.get(
    "/alunos/{aluno_id}",
    response_model=AlertaAlunoResponse,
    status_code=status.HTTP_200_OK,
    summary="Consultar alerta de um aluno",
    description=(
        "Gera uma classificação operacional "
        "com base nos registros de frequência. "
        "Não representa previsão estatística "
        "de abandono escolar."
    )
)
def consultar_alerta_aluno_route(
    aluno_id: int = Path(
        gt=0,
        description="Identificador do aluno"
    ),

    data_inicio: date | None = Query(
        default=None,
        description="Data inicial no formato AAAA-MM-DD"
    ),

    data_fim: date | None = Query(
        default=None,
        description="Data final no formato AAAA-MM-DD"
    ),

    db: Session = Depends(get_db),

    usuario: Usuario = Depends(
        obter_usuario_atual
    )
):

    return gerar_alerta_aluno_controller(
        aluno_id=aluno_id,
        db=db,
        usuario=usuario,
        data_inicio=data_inicio,
        data_fim=data_fim
    )


# ============================================
# GET - RESUMO DOS ALERTAS DA TURMA
# ============================================

@router.get(
    "/turmas/{turma_id}",
    response_model=AlertaTurmaResponse,
    status_code=status.HTTP_200_OK,
    summary="Consultar resumo de alertas da turma",
    description=(
        "Retorna a distribuição dos níveis "
        "de alerta entre os alunos ativos "
        "de uma turma autorizada."
    )
)
def consultar_alertas_turma_route(
    turma_id: int = Path(
        gt=0,
        description="Identificador da turma"
    ),

    data_inicio: date | None = Query(
        default=None,
        description="Data inicial no formato AAAA-MM-DD"
    ),

    data_fim: date | None = Query(
        default=None,
        description="Data final no formato AAAA-MM-DD"
    ),

    db: Session = Depends(get_db),

    usuario: Usuario = Depends(
        obter_usuario_atual
    )
):

    return gerar_alertas_turma_controller(
        turma_id=turma_id,
        db=db,
        usuario=usuario,
        data_inicio=data_inicio,
        data_fim=data_fim
    )
