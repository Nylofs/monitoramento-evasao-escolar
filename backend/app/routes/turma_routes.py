
from fastapi import (
    APIRouter,
    Depends,
    Path,
    status
)

from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.usuario_model import Usuario

from app.routes.escola_routes import (
    obter_usuario_atual
)

from app.views.turma_view import (
    TurmaCreate,
    TurmaUpdate,
    TurmaResponse
)

from app.controllers.turma_controller import (
    criar_turma_controller,
    listar_turmas_controller,
    buscar_turma_controller,
    atualizar_turma_controller,
    desativar_turma_controller
)


# ============================================
# CONFIGURAÇÃO DO ROTEADOR
# ============================================

router = APIRouter(
    prefix="/api/turmas",
    tags=["Turmas"]
)


# ============================================
# CREATE - CADASTRAR TURMA
# ============================================

@router.post(
    "",
    response_model=TurmaResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_turma_route(
    dados: TurmaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return criar_turma_controller(
        dados=dados,
        db=db,
        usuario=usuario
    )


# ============================================
# READ - LISTAR TURMAS
# ============================================

@router.get(
    "",
    response_model=list[TurmaResponse]
)
def listar_turmas_route(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return listar_turmas_controller(
        db=db,
        usuario=usuario
    )


# ============================================
# READ - BUSCAR TURMA POR ID
# ============================================

@router.get(
    "/{turma_id}",
    response_model=TurmaResponse
)
def buscar_turma_route(
    turma_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return buscar_turma_controller(
        turma_id=turma_id,
        db=db,
        usuario=usuario
    )


# ============================================
# UPDATE - ATUALIZAR TURMA
# ============================================

@router.put(
    "/{turma_id}",
    response_model=TurmaResponse
)
def atualizar_turma_route(
    dados: TurmaUpdate,
    turma_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return atualizar_turma_controller(
        turma_id=turma_id,
        dados=dados,
        db=db,
        usuario=usuario
    )


# ============================================
# DELETE - DESATIVAR TURMA
# ============================================

@router.delete(
    "/{turma_id}",
    response_model=TurmaResponse
)
def desativar_turma_route(
    turma_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return desativar_turma_controller(
        turma_id=turma_id,
        db=db,
        usuario=usuario
    )
