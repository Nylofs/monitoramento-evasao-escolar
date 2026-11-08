
from fastapi import (
    APIRouter,
    Depends,
    Path,
    Query,
    status
)

from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.usuario_model import Usuario

from app.routes.escola_routes import (
    obter_usuario_atual
)

from app.views.frequencia_view import (
    FrequenciaCreate,
    FrequenciaUpdate,
    FrequenciaResponse
)

from app.controllers.frequencia_controller import (
    registrar_frequencia_controller,
    listar_frequencias_controller,
    buscar_frequencia_controller,
    atualizar_frequencia_controller
)


# ============================================
# CONFIGURAÇÃO DO ROTEADOR
# ============================================

router = APIRouter(
    prefix="/api/frequencias",
    tags=["Frequências"]
)


# ============================================
# CREATE - REGISTRAR FREQUÊNCIA
# ============================================

@router.post(
    "",
    response_model=FrequenciaResponse,
    status_code=status.HTTP_201_CREATED
)
def registrar_frequencia_route(
    dados: FrequenciaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return registrar_frequencia_controller(
        dados=dados,
        db=db,
        usuario=usuario
    )


# ============================================
# READ - LISTAR FREQUÊNCIAS
# ============================================

@router.get(
    "",
    response_model=list[FrequenciaResponse]
)
def listar_frequencias_route(
    aluno_id: int | None = Query(
        default=None,
        gt=0,
        description="Filtrar por ID do aluno"
    ),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return listar_frequencias_controller(
        db=db,
        usuario=usuario,
        aluno_id=aluno_id
    )


# ============================================
# READ - CONSULTAR POR ID
# ============================================

@router.get(
    "/{frequencia_id}",
    response_model=FrequenciaResponse
)
def buscar_frequencia_route(
    frequencia_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return buscar_frequencia_controller(
        frequencia_id=frequencia_id,
        db=db,
        usuario=usuario
    )


# ============================================
# UPDATE - CORRIGIR FREQUÊNCIA
# ============================================

@router.put(
    "/{frequencia_id}",
    response_model=FrequenciaResponse
)
def atualizar_frequencia_route(
    dados: FrequenciaUpdate,
    frequencia_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return atualizar_frequencia_controller(
        frequencia_id=frequencia_id,
        dados=dados,
        db=db,
        usuario=usuario
    )
