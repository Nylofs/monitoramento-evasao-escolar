
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.escola_model import Escola
from app.models.usuario_model import Usuario

from app.views.escola_view import (
    EscolaCreate,
    EscolaUpdate
)


# Exceções utilizadas pelo Service

class EscolaNaoEncontradaError(Exception):
    pass


class EscolaPermissaoError(Exception):
    pass


class EscolaConflitoError(Exception):
    pass


# Funções auxiliares de autorização

def validar_usuario_ativo(usuario: Usuario):
    if not usuario.ativo:
        raise EscolaPermissaoError(
            "Usuário sem acesso ao sistema."
        )


def exigir_administrador(usuario: Usuario):
    validar_usuario_ativo(usuario)

    if usuario.perfil != "ADMINISTRADOR":
        raise EscolaPermissaoError(
            "Operação permitida apenas ao administrador."
        )


# CREATE - Cadastrar uma escola

def cadastrar_escola(
    db: Session,
    dados: EscolaCreate,
    usuario: Usuario
) -> Escola:

    exigir_administrador(usuario)

    nova_escola = Escola(
        **dados.model_dump()
    )

    try:
        db.add(nova_escola)
        db.commit()
        db.refresh(nova_escola)

    except IntegrityError as erro:
        db.rollback()

        raise EscolaConflitoError(
            "Não foi possível cadastrar a escola. "
            "Verifique se o código INEP já existe."
        ) from erro

    return nova_escola


# READ - Listar escolas

def listar_escolas(
    db: Session,
    usuario: Usuario
) -> list[Escola]:

    validar_usuario_ativo(usuario)

    consulta = select(Escola)

    if usuario.perfil != "ADMINISTRADOR":
        consulta = consulta.where(
            Escola.id == usuario.escola_id
        )

    consulta = consulta.order_by(Escola.nome)

    resultado = db.execute(consulta)

    return list(resultado.scalars().all())


# READ - Buscar escola por ID

def buscar_escola(
    db: Session,
    escola_id: int,
    usuario: Usuario
) -> Escola:

    validar_usuario_ativo(usuario)

    if (
        usuario.perfil != "ADMINISTRADOR"
        and usuario.escola_id != escola_id
    ):
        raise EscolaPermissaoError(
            "Você não possui acesso a essa escola."
        )

    escola = db.get(
        Escola,
        escola_id
    )

    if escola is None:
        raise EscolaNaoEncontradaError(
            "Escola não encontrada."
        )

    return escola


# UPDATE - Atualizar uma escola

def atualizar_escola(
    db: Session,
    escola_id: int,
    dados: EscolaUpdate,
    usuario: Usuario
) -> Escola:

    exigir_administrador(usuario)

    escola = buscar_escola(
        db,
        escola_id,
        usuario
    )

    valores = dados.model_dump()

    for campo, valor in valores.items():
        setattr(escola, campo, valor)

    try:
        db.commit()
        db.refresh(escola)

    except IntegrityError as erro:
        db.rollback()

        raise EscolaConflitoError(
            "Não foi possível atualizar a escola. "
            "Verifique se o código INEP já existe."
        ) from erro

    return escola


# DELETE - Exclusão lógica

def desativar_escola(
    db: Session,
    escola_id: int,
    usuario: Usuario
) -> Escola:

    exigir_administrador(usuario)

    escola = buscar_escola(
        db,
        escola_id,
        usuario
    )

    if not escola.ativo:
        return escola

    escola.ativo = False

    db.commit()
    db.refresh(escola)

    return escola
