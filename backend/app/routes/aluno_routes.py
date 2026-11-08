
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

from app.views.aluno_view import (
    AlunoCreate,
    AlunoUpdate,
    AlunoResponse
)

from app.controllers.aluno_controller import (
    criar_aluno_controller,
    listar_alunos_controller,
    buscar_aluno_controller,
    atualizar_aluno_controller,
    desativar_aluno_controller
)


# ============================================
# CONFIGURAÇÃO DO ROTEADOR
# ============================================

router = APIRouter(
    prefix="/api/alunos",
    tags=["Alunos"]
)


# ============================================
# CREATE - CADASTRAR ALUNO
# ============================================

@router.post(
    "",
    response_model=AlunoResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_aluno_route(
    dados: AlunoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return criar_aluno_controller(
        dados=dados,
        db=db,
        usuario=usuario
    )


# ============================================
# READ - LISTAR ALUNOS
# ============================================

@router.get(
    "",
    response_model=list[AlunoResponse]
)
def listar_alunos_route(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return listar_alunos_controller(
        db=db,
        usuario=usuario
    )


# ============================================
# READ - BUSCAR ALUNO POR ID
# ============================================

@router.get(
    "/{aluno_id}",
    response_model=AlunoResponse
)
def buscar_aluno_route(
    aluno_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return buscar_aluno_controller(
        aluno_id=aluno_id,
        db=db,
        usuario=usuario
    )


# ============================================
# UPDATE - ATUALIZAR ALUNO
# ============================================

@router.put(
    "/{aluno_id}",
    response_model=AlunoResponse
)
def atualizar_aluno_route(
    dados: AlunoUpdate,
    aluno_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return atualizar_aluno_controller(
        aluno_id=aluno_id,
        dados=dados,
        db=db,
        usuario=usuario
    )


# ============================================
# DELETE - DESATIVAR ALUNO
# ============================================

@router.delete(
    "/{aluno_id}",
    response_model=AlunoResponse
)
def desativar_aluno_route(
    aluno_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return desativar_aluno_controller(
        aluno_id=aluno_id,
        db=db,
        usuario=usuario
    )
