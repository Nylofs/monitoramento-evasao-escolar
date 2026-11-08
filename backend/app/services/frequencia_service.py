
from datetime import date

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
from app.views.frequencia_view import (
    FrequenciaCreate,
    FrequenciaUpdate
)


# ============================================
# EXCEÇÕES DO SERVICE
# ============================================

class FrequenciaNaoEncontradaError(Exception):
    pass


class AlunoInvalidoFrequenciaError(Exception):
    pass


class FrequenciaPermissaoError(Exception):
    pass


class FrequenciaConflitoError(Exception):
    pass


class FrequenciaDataInvalidaError(Exception):
    pass


# ============================================
# FUNÇÕES AUXILIARES DE AUTORIZAÇÃO
# ============================================

def validar_usuario_ativo(usuario: Usuario):
    """
    Verifica se a conta do usuário está ativa
    e se possui um perfil reconhecido.
    """

    if not usuario.ativo:
        raise FrequenciaPermissaoError(
            "Usuário sem acesso ao sistema."
        )

    perfis_permitidos = (
        "ADMINISTRADOR",
        "GESTOR",
        "COORDENADOR"
    )

    if usuario.perfil not in perfis_permitidos:
        raise FrequenciaPermissaoError(
            "Perfil de usuário não autorizado."
        )


def exigir_administrador(usuario: Usuario):
    """
    Restringe lançamentos e correções
    ao administrador.
    """

    validar_usuario_ativo(usuario)

    if usuario.perfil != "ADMINISTRADOR":
        raise FrequenciaPermissaoError(
            "Operação permitida apenas ao administrador."
        )


# ============================================
# VALIDAÇÃO DO ALUNO PARA LANÇAMENTO
# ============================================

def validar_aluno_para_registro(
    db: Session,
    aluno_id: int
) -> Aluno:
    """
    Verifica se o aluno existe e está ativo,
    se sua turma está ativa e se sua escola
    também está ativa.
    """

    aluno = db.get(
        Aluno,
        aluno_id
    )

    if aluno is None:
        raise AlunoInvalidoFrequenciaError(
            "O aluno informado não existe."
        )

    if not aluno.ativo:
        raise AlunoInvalidoFrequenciaError(
            "Não é permitido registrar frequência "
            "para um aluno inativo."
        )

    turma = db.get(
        Turma,
        aluno.turma_id
    )

    if turma is None or not turma.ativo:
        raise AlunoInvalidoFrequenciaError(
            "A turma do aluno não existe "
            "ou está inativa."
        )

    escola = db.get(
        Escola,
        turma.escola_id
    )

    if escola is None or not escola.ativo:
        raise AlunoInvalidoFrequenciaError(
            "A escola do aluno não existe "
            "ou está inativa."
        )

    return aluno


# ============================================
# VALIDAÇÃO DA DATA
# ============================================

def validar_data_frequencia(data_frequencia: date):
    """
    Impede o lançamento de frequências
    para datas futuras.
    """

    if data_frequencia > date.today():
        raise FrequenciaDataInvalidaError(
            "Não é permitido registrar "
            "frequência em data futura."
        )


# ============================================
# CONSULTA COM AUTORIZAÇÃO
# ============================================

def consulta_frequencias_autorizadas(
    usuario: Usuario
):
    """
    Monta uma consulta SQLAlchemy com as
    restrições de acesso por escola.

    A consulta ainda não é executada aqui.
    """

    validar_usuario_ativo(usuario)

    consulta = (
        select(Frequencia)
        .join(
            Aluno,
            Frequencia.aluno_id == Aluno.id
        )
        .join(
            Turma,
            Aluno.turma_id == Turma.id
        )
        .join(
            Escola,
            Turma.escola_id == Escola.id
        )
    )

    if usuario.perfil != "ADMINISTRADOR":
        consulta = consulta.where(
            Escola.id == usuario.escola_id,
            Escola.ativo.is_(True)
        )

    return consulta


# ============================================
# CREATE - REGISTRAR FREQUÊNCIA
# ============================================

def registrar_frequencia(
    db: Session,
    dados: FrequenciaCreate,
    usuario: Usuario
) -> Frequencia:

    exigir_administrador(usuario)

    # Verifica a existência e a situação
    # do aluno, da turma e da escola.
    validar_aluno_para_registro(
        db=db,
        aluno_id=dados.aluno_id
    )

    # Impede datas futuras.
    validar_data_frequencia(
        dados.data
    )

    # Procura registro do mesmo aluno
    # para a mesma data.
    frequencia_existente = db.execute(
        select(Frequencia).where(
            Frequencia.aluno_id == dados.aluno_id,
            Frequencia.data == dados.data
        )
    ).scalar_one_or_none()

    if frequencia_existente is not None:
        raise FrequenciaConflitoError(
            "Já existe uma frequência registrada "
            "para esse aluno nessa data."
        )

    # Cria o novo lançamento.
    nova_frequencia = Frequencia(
        aluno_id=dados.aluno_id,
        data=dados.data,
        situacao=dados.situacao,
        observacao=dados.observacao
    )

    try:
        db.add(nova_frequencia)
        db.commit()
        db.refresh(nova_frequencia)

    except IntegrityError as erro:
        db.rollback()

        raise FrequenciaConflitoError(
            "Não foi possível registrar a frequência. "
            "Verifique se já existe lançamento "
            "para esse aluno nessa data."
        ) from erro

    return nova_frequencia


# ============================================
# READ - LISTAR FREQUÊNCIAS
# ============================================

def listar_frequencias(
    db: Session,
    usuario: Usuario,
    aluno_id: int | None = None
) -> list[Frequencia]:

    consulta = consulta_frequencias_autorizadas(
        usuario
    )

    # Filtro opcional por aluno.
    if aluno_id is not None:
        consulta = consulta.where(
            Frequencia.aluno_id == aluno_id
        )

    # Registros mais recentes primeiro.
    consulta = consulta.order_by(
        Frequencia.data.desc(),
        Frequencia.id.desc()
    )

    resultado = db.execute(
        consulta
    )

    return list(
        resultado.scalars().all()
    )


# ============================================
# READ - CONSULTAR FREQUÊNCIA POR ID
# ============================================

def buscar_frequencia(
    db: Session,
    frequencia_id: int,
    usuario: Usuario
) -> Frequencia:

    consulta = consulta_frequencias_autorizadas(
        usuario
    ).where(
        Frequencia.id == frequencia_id
    )

    frequencia = db.execute(
        consulta
    ).scalar_one_or_none()

    if frequencia is None:
        raise FrequenciaNaoEncontradaError(
            "Frequência não encontrada."
        )

    return frequencia


# ============================================
# UPDATE - CORRIGIR FREQUÊNCIA
# ============================================

def atualizar_frequencia(
    db: Session,
    frequencia_id: int,
    dados: FrequenciaUpdate,
    usuario: Usuario
) -> Frequencia:

    exigir_administrador(usuario)

    # Procura o lançamento existente.
    frequencia = buscar_frequencia(
        db=db,
        frequencia_id=frequencia_id,
        usuario=usuario
    )

    # Impede trocar o aluno do registro.
    if dados.aluno_id != frequencia.aluno_id:
        raise FrequenciaConflitoError(
            "Não é permitido alterar o aluno "
            "de um registro de frequência."
        )

    # Impede trocar a data do registro.
    if dados.data != frequencia.data:
        raise FrequenciaConflitoError(
            "Não é permitido alterar a data "
            "de um registro de frequência."
        )

    # Verifica a situação atual do aluno,
    # da turma e da escola.
    validar_aluno_para_registro(
        db=db,
        aluno_id=frequencia.aluno_id
    )

    validar_data_frequencia(
        frequencia.data
    )

    # Atualiza apenas os campos permitidos.
    frequencia.situacao = dados.situacao
    frequencia.observacao = dados.observacao

    try:
        db.commit()
        db.refresh(frequencia)

    except IntegrityError as erro:
        db.rollback()

        raise FrequenciaConflitoError(
            "Não foi possível atualizar a frequência."
        ) from erro

    return frequencia
