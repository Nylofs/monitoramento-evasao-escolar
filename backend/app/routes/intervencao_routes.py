
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

from app.views.intervencao_view import (
    IntervencaoCreate,
    IntervencaoUpdate,
    IntervencaoResponse
)

from app.controllers.intervencao_controller import (
    criar_intervencao_controller,
    listar_intervencoes_controller,
    buscar_intervencao_controller,
    atualizar_intervencao_controller,
    excluir_intervencao_controller
)


# ============================================
# CONFIGURAÇÃO DO ROTEADOR
# ============================================

router = APIRouter(
    prefix="/api/intervencoes",
    tags=["Intervenções"]
)


# ============================================
# CREATE - CADASTRAR INTERVENÇÃO
# ============================================

@router.post(
    "",
    response_model=IntervencaoResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_intervencao_route(
    dados: IntervencaoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return criar_intervencao_controller(
        dados=dados,
        db=db,
        usuario=usuario
    )


# ============================================
# READ - LISTAR INTERVENÇÕES
# ============================================

@router.get(
    "",
    response_model=list[IntervencaoResponse]
)
def listar_intervencoes_route(
    aluno_id: int | None = Query(
        default=None,
        gt=0,
        description="Filtrar pelo ID do aluno"
    ),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return listar_intervencoes_controller(
        db=db,
        usuario=usuario,
        aluno_id=aluno_id
    )


# ============================================
# READ - CONSULTAR INTERVENÇÃO POR ID
# ============================================

@router.get(
    "/{intervencao_id}",
    response_model=IntervencaoResponse
)
def buscar_intervencao_route(
    intervencao_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return buscar_intervencao_controller(
        intervencao_id=intervencao_id,
        db=db,
        usuario=usuario
    )


# ============================================
# UPDATE - ATUALIZAR INTERVENÇÃO
# ============================================

@router.put(
    "/{intervencao_id}",
    response_model=IntervencaoResponse
)
def atualizar_intervencao_route(
    dados: IntervencaoUpdate,
    intervencao_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return atualizar_intervencao_controller(
        intervencao_id=intervencao_id,
        dados=dados,
        db=db,
        usuario=usuario
    )


# ============================================
# DELETE - EXCLUIR INTERVENÇÃO
# ============================================

@router.delete(
    "/{intervencao_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def excluir_intervencao_route(
    intervencao_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    excluir_intervencao_controller(
        intervencao_id=intervencao_id,
        db=db,
        usuario=usuario
    )
    return None
