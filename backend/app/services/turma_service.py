
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

# Importamos todos os Models relacionados
from app.models.escola_model import Escola
from app.models.turma_model import Turma
from app.models.aluno_model import Aluno
from app.models.frequencia_model import Frequencia
from app.models.intervencao_model import Intervencao
from app.models.usuario_model import Usuario

# Schemas Pydantic
from app.views.turma_view import (
    TurmaCreate,
    TurmaUpdate
)


# ============================================
# EXCEÇÕES DO SERVICE
# ============================================

class TurmaNaoEncontradaError(Exception):
    pass


class EscolaInvalidaError(Exception):
    pass


class TurmaPermissaoError(Exception):
    pass


class TurmaConflitoError(Exception):
    pass


# ============================================
# FUNÇÕES AUXILIARES
# ============================================

def validar_usuario_ativo(usuario: Usuario):
    """
    Verifica se o usuário está ativo.
    """

    if not usuario.ativo:
        raise TurmaPermissaoError(
            "Usuário sem acesso ao sistema."
        )


def exigir_administrador(usuario: Usuario):
    """
    Permite operações administrativas
    somente ao perfil ADMINISTRADOR.
    """

    validar_usuario_ativo(usuario)

    if usuario.perfil != "ADMINISTRADOR":
        raise TurmaPermissaoError(
            "Operação permitida apenas ao administrador."
        )


def validar_escola_ativa(
    db: Session,
    escola_id: int
) -> Escola:
    """
    Verifica se a escola existe e está ativa.
    """

    escola = db.get(
        Escola,
        escola_id
    )

    if escola is None:
        raise EscolaInvalidaError(
            "A escola informada não existe."
        )

    if not escola.ativo:
        raise EscolaInvalidaError(
            "Não é permitido operar em uma escola inativa."
        )

    return escola


def validar_acesso_escola(
    db: Session,
    usuario: Usuario,
    escola_id: int
):
    """
    Verifica se o usuário pode acessar
    os registros da escola.
    """

    validar_usuario_ativo(usuario)

    if usuario.perfil == "ADMINISTRADOR":
        return

    if usuario.escola_id != escola_id:
        raise TurmaPermissaoError(
            "Você não possui acesso a essa escola."
        )

    validar_escola_ativa(
        db=db,
        escola_id=escola_id
    )


# ============================================
# CREATE - CADASTRAR TURMA
# ============================================

def cadastrar_turma(
    db: Session,
    dados: TurmaCreate,
    usuario: Usuario
) -> Turma:

    exigir_administrador(usuario)

    # Confirma que a escola existe e está ativa
    validar_escola_ativa(
        db=db,
        escola_id=dados.escola_id
    )

    # Consulta se a turma já existe
    turma_existente = db.execute(
        select(Turma).where(
            Turma.escola_id == dados.escola_id,
            Turma.nome == dados.nome,
            Turma.ano_letivo == dados.ano_letivo
        )
    ).scalar_one_or_none()

    if turma_existente is not None:
        raise TurmaConflitoError(
            "Já existe uma turma com esse nome "
            "na mesma escola e no mesmo ano letivo."
        )

    # Cria o objeto Turma
    nova_turma = Turma(
        **dados.model_dump()
    )

    try:
        db.add(nova_turma)
        db.commit()
        db.refresh(nova_turma)

    except IntegrityError as erro:
        db.rollback()

        raise TurmaConflitoError(
            "Não foi possível cadastrar a turma. "
            "Verifique os dados e possíveis duplicidades."
        ) from erro

    return nova_turma


# ============================================
# READ - LISTAR TURMAS
# ============================================

def listar_turmas(
    db: Session,
    usuario: Usuario
) -> list[Turma]:

    validar_usuario_ativo(usuario)

    consulta = select(Turma)

    # Usuários comuns acessam apenas
    # as turmas da própria escola ativa
    if usuario.perfil != "ADMINISTRADOR":

        validar_escola_ativa(
            db=db,
            escola_id=usuario.escola_id
        )

        consulta = consulta.where(
            Turma.escola_id == usuario.escola_id
        )

    # Ordenação por ano, série e nome
    consulta = consulta.order_by(
        Turma.ano_letivo.desc(),
        Turma.serie,
        Turma.nome
    )

    resultado = db.execute(consulta)

    return list(resultado.scalars().all())


# ============================================
# READ - BUSCAR TURMA POR ID
# ============================================

def buscar_turma(
    db: Session,
    turma_id: int,
    usuario: Usuario
) -> Turma:

    validar_usuario_ativo(usuario)

    turma = db.get(
        Turma,
        turma_id
    )

    if turma is None:
        raise TurmaNaoEncontradaError(
            "Turma não encontrada."
        )

    # Confere o acesso à escola da turma
    validar_acesso_escola(
        db=db,
        usuario=usuario,
        escola_id=turma.escola_id
    )

    return turma


# ============================================
# UPDATE - ATUALIZAR TURMA
# ============================================

def atualizar_turma(
    db: Session,
    turma_id: int,
    dados: TurmaUpdate,
    usuario: Usuario
) -> Turma:

    exigir_administrador(usuario)

    turma = buscar_turma(
        db=db,
        turma_id=turma_id,
        usuario=usuario
    )

    # Impede alterações em turmas inativas
    if not turma.ativo:
        raise TurmaConflitoError(
            "Não é permitido atualizar uma turma inativa."
        )

    # Não permitimos transferir a turma
    # para outra escola neste CRUD
    if dados.escola_id != turma.escola_id:
        raise TurmaConflitoError(
            "Não é permitido alterar a escola "
            "de uma turma existente."
        )

    # A escola atual deve permanecer ativa
    validar_escola_ativa(
        db=db,
        escola_id=turma.escola_id
    )

    # Verifica duplicidade de nome e ano
    turma_duplicada = db.execute(
        select(Turma).where(
            Turma.escola_id == turma.escola_id,
            Turma.nome == dados.nome,
            Turma.ano_letivo == dados.ano_letivo,
            Turma.id != turma_id
        )
    ).scalar_one_or_none()

    if turma_duplicada is not None:
        raise TurmaConflitoError(
            "Já existe outra turma com esse nome "
            "na mesma escola e no mesmo ano letivo."
        )

    # Atualiza somente os campos permitidos
    turma.nome = dados.nome
    turma.serie = dados.serie
    turma.turno = dados.turno
    turma.ano_letivo = dados.ano_letivo

    try:
        db.commit()
        db.refresh(turma)

    except IntegrityError as erro:
        db.rollback()

        raise TurmaConflitoError(
            "Não foi possível atualizar a turma. "
            "Verifique possíveis duplicidades."
        ) from erro

    return turma


# ============================================
# DELETE - DESATIVAR TURMA
# ============================================

def desativar_turma(
    db: Session,
    turma_id: int,
    usuario: Usuario
) -> Turma:

    exigir_administrador(usuario)

    turma = buscar_turma(
        db=db,
        turma_id=turma_id,
        usuario=usuario
    )

    # A escola precisa estar ativa
    validar_escola_ativa(
        db=db,
        escola_id=turma.escola_id
    )

    # Se já estiver inativa, não altera
    if not turma.ativo:
        return turma

    # Exclusão lógica
    turma.ativo = False

    db.commit()
    db.refresh(turma)

    return turma
