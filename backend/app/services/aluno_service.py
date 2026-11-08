
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

# Importamos os Models e seus relacionamentos
from app.models.escola_model import Escola
from app.models.turma_model import Turma
from app.models.aluno_model import Aluno
from app.models.frequencia_model import Frequencia
from app.models.intervencao_model import Intervencao
from app.models.usuario_model import Usuario

# Schemas Pydantic
from app.views.aluno_view import (
    AlunoCreate,
    AlunoUpdate
)


# ============================================
# EXCEÇÕES DO SERVICE
# ============================================

class AlunoNaoEncontradoError(Exception):
    pass


class TurmaInvalidaError(Exception):
    pass


class AlunoPermissaoError(Exception):
    pass


class AlunoConflitoError(Exception):
    pass


# ============================================
# FUNÇÕES AUXILIARES
# ============================================

def validar_usuario_ativo(usuario: Usuario):
    """
    Verifica se a conta está ativa.
    """

    if not usuario.ativo:
        raise AlunoPermissaoError(
            "Usuário sem acesso ao sistema."
        )


def exigir_administrador(usuario: Usuario):
    """
    Exige o perfil ADMINISTRADOR.
    """

    validar_usuario_ativo(usuario)

    if usuario.perfil != "ADMINISTRADOR":
        raise AlunoPermissaoError(
            "Operação permitida apenas ao administrador."
        )


def validar_turma_ativa(
    db: Session,
    turma_id: int
) -> Turma:
    """
    Verifica se a turma existe, está ativa
    e pertence a uma escola ativa.
    """

    turma = db.get(
        Turma,
        turma_id
    )

    if turma is None:
        raise TurmaInvalidaError(
            "A turma informada não existe."
        )

    if not turma.ativo:
        raise TurmaInvalidaError(
            "Não é permitido operar em uma turma inativa."
        )

    escola = db.get(
        Escola,
        turma.escola_id
    )

    if escola is None or not escola.ativo:
        raise TurmaInvalidaError(
            "A escola da turma não está ativa ou não existe."
        )

    return turma


def consulta_alunos_autorizados(
    usuario: Usuario
):
    """
    Monta uma consulta limitada às escolas
    que o usuário pode acessar.

    Não executa a consulta.
    """

    validar_usuario_ativo(usuario)

    consulta = (
        select(Aluno)
        .join(Turma, Aluno.turma_id == Turma.id)
        .join(Escola, Turma.escola_id == Escola.id)
    )

    if usuario.perfil != "ADMINISTRADOR":

        consulta = consulta.where(
            Escola.id == usuario.escola_id,
            Escola.ativo.is_(True)
        )

    return consulta


# ============================================
# CREATE - CADASTRAR ALUNO
# ============================================

def cadastrar_aluno(
    db: Session,
    dados: AlunoCreate,
    usuario: Usuario
) -> Aluno:

    exigir_administrador(usuario)

    # Verifica a turma e a escola
    validar_turma_ativa(
        db=db,
        turma_id=dados.turma_id
    )

    # Verifica se o código já está cadastrado
    aluno_existente = db.execute(
        select(Aluno).where(
            Aluno.codigo_aluno == dados.codigo_aluno
        )
    ).scalar_one_or_none()

    if aluno_existente is not None:
        raise AlunoConflitoError(
            "Já existe um aluno cadastrado com esse código."
        )

    # Cria o novo aluno
    novo_aluno = Aluno(
        codigo_aluno=dados.codigo_aluno,
        nome=dados.nome,
        turma_id=dados.turma_id
    )

    try:
        db.add(novo_aluno)
        db.commit()
        db.refresh(novo_aluno)

    except IntegrityError as erro:
        db.rollback()

        raise AlunoConflitoError(
            "Não foi possível cadastrar o aluno. "
            "Verifique se o código já está em uso."
        ) from erro

    return novo_aluno


# ============================================
# READ - LISTAR ALUNOS
# ============================================

def listar_alunos(
    db: Session,
    usuario: Usuario
) -> list[Aluno]:

    consulta = consulta_alunos_autorizados(
        usuario
    )

    consulta = consulta.order_by(
        Aluno.nome,
        Aluno.id
    )

    resultado = db.execute(
        consulta
    )

    return list(
        resultado.scalars().all()
    )


# ============================================
# READ - BUSCAR ALUNO POR ID
# ============================================

def buscar_aluno(
    db: Session,
    aluno_id: int,
    usuario: Usuario
) -> Aluno:

    consulta = consulta_alunos_autorizados(
        usuario
    ).where(
        Aluno.id == aluno_id
    )

    aluno = db.execute(
        consulta
    ).scalar_one_or_none()

    if aluno is None:
        raise AlunoNaoEncontradoError(
            "Aluno não encontrado."
        )

    return aluno


# ============================================
# UPDATE - ATUALIZAR ALUNO
# ============================================

def atualizar_aluno(
    db: Session,
    aluno_id: int,
    dados: AlunoUpdate,
    usuario: Usuario
) -> Aluno:

    exigir_administrador(usuario)

    aluno = buscar_aluno(
        db=db,
        aluno_id=aluno_id,
        usuario=usuario
    )

    if not aluno.ativo:
        raise AlunoConflitoError(
            "Não é permitido atualizar um aluno inativo."
        )

    # Impede transferência direta entre turmas
    if dados.turma_id != aluno.turma_id:
        raise AlunoConflitoError(
            "Não é permitido alterar a turma "
            "do aluno por esta operação."
        )

    # A turma e a escola devem estar ativas
    validar_turma_ativa(
        db=db,
        turma_id=aluno.turma_id
    )

    # Verifica duplicidade, ignorando o próprio aluno
    aluno_duplicado = db.execute(
        select(Aluno).where(
            Aluno.codigo_aluno == dados.codigo_aluno,
            Aluno.id != aluno_id
        )
    ).scalar_one_or_none()

    if aluno_duplicado is not None:
        raise AlunoConflitoError(
            "Esse código já pertence a outro aluno."
        )

    # Atualiza somente os campos permitidos
    aluno.codigo_aluno = dados.codigo_aluno
    aluno.nome = dados.nome

    try:
        db.commit()
        db.refresh(aluno)

    except IntegrityError as erro:
        db.rollback()

        raise AlunoConflitoError(
            "Não foi possível atualizar o aluno. "
            "Verifique se o código está em uso."
        ) from erro

    return aluno


# ============================================
# DELETE - DESATIVAR ALUNO
# ============================================

def desativar_aluno(
    db: Session,
    aluno_id: int,
    usuario: Usuario
) -> Aluno:

    exigir_administrador(usuario)

    aluno = buscar_aluno(
        db=db,
        aluno_id=aluno_id,
        usuario=usuario
    )

    # Se já estiver inativo, não altera novamente
    if not aluno.ativo:
        return aluno

    # A turma e a escola devem estar ativas
    validar_turma_ativa(
        db=db,
        turma_id=aluno.turma_id
    )

    # Exclusão lógica
    aluno.ativo = False

    db.commit()
    db.refresh(aluno)

    return aluno
