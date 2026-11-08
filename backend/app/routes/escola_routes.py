
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Path,
    status
)

from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.usuario_model import Usuario

from app.routes.auth_routes import obter_usuario_id

from app.services.auth_service import (
    buscar_usuario_por_id
)

from app.controllers.escola_controller import (
    criar_escola_controller,
    listar_escolas_controller,
    buscar_escola_controller,
    atualizar_escola_controller,
    desativar_escola_controller
)

from app.views.escola_view import (
    EscolaCreate,
    EscolaUpdate,
    EscolaResponse
)


# Configuração das rotas de Escolas

router = APIRouter(
    prefix="/api/escolas",
    tags=["Escolas"]
)


# Dependência para obter o usuário autenticado

def obter_usuario_atual(
    usuario_id: int = Depends(obter_usuario_id),
    db: Session = Depends(get_db)
) -> Usuario:

    usuario = buscar_usuario_por_id(
        db=db,
        usuario_id=usuario_id
    )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não autenticado ou inativo",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    return usuario


# CREATE - Cadastrar Escola

@router.post(
    "",
    response_model=EscolaResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_escola_route(
    dados: EscolaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return criar_escola_controller(
        dados=dados,
        db=db,
        usuario=usuario
    )


# READ - Listar Escolas

@router.get(
    "",
    response_model=list[EscolaResponse]
)
def listar_escolas_route(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return listar_escolas_controller(
        db=db,
        usuario=usuario
    )


# READ - Buscar Escola por ID

@router.get(
    "/{escola_id}",
    response_model=EscolaResponse
)
def buscar_escola_route(
    escola_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return buscar_escola_controller(
        escola_id=escola_id,
        db=db,
        usuario=usuario
    )


# UPDATE - Atualizar Escola

@router.put(
    "/{escola_id}",
    response_model=EscolaResponse
)
def atualizar_escola_route(
    dados: EscolaUpdate,
    escola_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return atualizar_escola_controller(
        escola_id=escola_id,
        dados=dados,
        db=db,
        usuario=usuario
    )


# DELETE - Desativar Escola

@router.delete(
    "/{escola_id}",
    response_model=EscolaResponse
)
def desativar_escola_route(
    escola_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):

    return desativar_escola_controller(
        escola_id=escola_id,
        db=db,
        usuario=usuario
    )
