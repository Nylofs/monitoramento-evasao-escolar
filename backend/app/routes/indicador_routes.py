
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    Path,
    Query
)

from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.usuario_model import Usuario

from app.routes.escola_routes import (
    obter_usuario_atual
)

from app.views.indicador_view import (
    IndicadorAlunoResponse,
    IndicadorTurmaResponse
)

from app.controllers.indicador_controller import (
    obter_indicador_aluno_controller,
    obter_indicador_turma_controller
)


# ============================================
# CONFIGURAÇÃO DO ROTEADOR
# ============================================

router = APIRouter(
    prefix="/api/indicadores",
    tags=["Indicadores de Frequência"]
)


# ============================================
# GET - INDICADOR INDIVIDUAL DO ALUNO
# ============================================

@router.get(
    "/alunos/{aluno_id}",
    response_model=IndicadorAlunoResponse,
    summary="Consultar indicadores de um aluno"
)
def consultar_indicador_aluno_route(
    aluno_id: int = Path(
        gt=0,
        description="ID do aluno"
    ),

    data_inicio: date | None = Query(
        default=None,
        description="Data inicial (AAAA-MM-DD)"
    ),

    data_fim: date | None = Query(
        default=None,
        description="Data final (AAAA-MM-DD)"
    ),

    db: Session = Depends(get_db),

    usuario: Usuario = Depends(
        obter_usuario_atual
    )
):

    return obter_indicador_aluno_controller(
        aluno_id=aluno_id,
        db=db,
        usuario=usuario,
        data_inicio=data_inicio,
        data_fim=data_fim
    )


# ============================================
# GET - INDICADOR GERAL DA TURMA
# ============================================

@router.get(
    "/turmas/{turma_id}",
    response_model=IndicadorTurmaResponse,
    summary="Consultar indicadores de uma turma"
)
def consultar_indicador_turma_route(
    turma_id: int = Path(
        gt=0,
        description="ID da turma"
    ),

    data_inicio: date | None = Query(
        default=None,
        description="Data inicial (AAAA-MM-DD)"
    ),

    data_fim: date | None = Query(
        default=None,
        description="Data final (AAAA-MM-DD)"
    ),

    db: Session = Depends(get_db),

    usuario: Usuario = Depends(
        obter_usuario_atual
    )
):

    return obter_indicador_turma_controller(
        turma_id=turma_id,
        db=db,
        usuario=usuario,
        data_inicio=data_inicio,
        data_fim=data_fim
    )
