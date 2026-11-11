
from datetime import date

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

# ============================================
# IMPORTAÇÃO DOS MODELS
# ============================================

from app.models.escola_model import Escola
from app.models.turma_model import Turma
from app.models.aluno_model import Aluno
from app.models.frequencia_model import Frequencia
from app.models.intervencao_model import Intervencao
from app.models.usuario_model import Usuario

# ============================================
# IMPORTAÇÃO DOS SCHEMAS PYDANTIC
# ============================================

from app.views.intervencao_view import (
    IntervencaoCreate,
    IntervencaoUpdate
)


# ============================================
# EXCEÇÕES PERSONALIZADAS
# ============================================

class IntervencaoNaoEncontradaError(Exception):
    pass


class AlunoInvalidoIntervencaoError(Exception):
    pass


class IntervencaoPermissaoError(Exception):
    pass


class IntervencaoConflitoError(Exception):
    pass


class IntervencaoDataInvalidaError(Exception):
    pass


# ============================================
# AUTORIZAÇÃO DO USUÁRIO
# ============================================

def validar_usuario_ativo(usuario: Usuario):
    """
    Confirma que a conta está ativa
    e possui um perfil permitido.
    """

    if not usuario.ativo:
        raise IntervencaoPermissaoError(
            "Usuário sem acesso ao sistema."
        )

    perfis_validos = (
        "ADMINISTRADOR",
        "GESTOR",
        "COORDENADOR"
    )

    if usuario.perfil not in perfis_validos:
        raise IntervencaoPermissaoError(
            "Perfil de usuário não autorizado."
        )


def exigir_administrador(usuario: Usuario):
    """
    Permite operações de escrita somente
    ao administrador.
    """

    validar_usuario_ativo(usuario)

    if usuario.perfil != "ADMINISTRADOR":
        raise IntervencaoPermissaoError(
            "Operação permitida apenas ao administrador."
        )


# ============================================
# VALIDAÇÃO DO ALUNO, TURMA E ESCOLA
# ============================================

def validar_aluno_para_intervencao(
    db: Session,
    aluno_id: int
) -> Aluno:
    """
    Valida o aluno e os vínculos necessários
    para criar ou atualizar uma intervenção.
    """

    aluno = db.get(
        Aluno,
        aluno_id
    )

    if aluno is None:
        raise AlunoInvalidoIntervencaoError(
            "O aluno informado não existe."
        )

    if not aluno.ativo:
        raise AlunoInvalidoIntervencaoError(
            "O aluno está inativo."
        )

    turma = db.get(
        Turma,
        aluno.turma_id
    )

    if turma is None or not turma.ativo:
        raise AlunoInvalidoIntervencaoError(
            "A turma do aluno não existe "
            "ou está inativa."
        )

    escola = db.get(
        Escola,
        turma.escola_id
    )

    if escola is None or not escola.ativo:
        raise AlunoInvalidoIntervencaoError(
            "A escola do aluno não existe "
            "ou está inativa."
        )

    return aluno


# ============================================
# VALIDAÇÃO DAS DATAS
# ============================================

def validar_datas_intervencao(
    data_intervencao: date,
    proximo_contato: date | None
):
    """
    Impede intervenção em data futura
    e próximo contato anterior à intervenção.
    """

    if data_intervencao > date.today():
        raise IntervencaoDataInvalidaError(
            "A data da intervenção não pode ser futura."
        )

    if (
        proximo_contato is not None
        and proximo_contato < data_intervencao
    ):
        raise IntervencaoDataInvalidaError(
            "O próximo contato não pode ser "
            "anterior à data da intervenção."
        )


# ============================================
# VALIDAÇÃO DO FLUXO DE STATUS
# ============================================

def validar_transicao_status(
    status_atual: str,
    novo_status: str
):
    """
    Verifica se a mudança de status
    é permitida pelas regras do sistema.
    """

    transicoes_permitidas = {
        "ABERTO": {
            "ABERTO",
            "EM_ANDAMENTO",
            "CONCLUIDO"
        },
        "EM_ANDAMENTO": {
            "EM_ANDAMENTO",
            "CONCLUIDO"
        },
        "CONCLUIDO": set()
    }

    permitidos = transicoes_permitidas.get(
        status_atual,
        set()
    )

    if novo_status not in permitidos:
        raise IntervencaoConflitoError(
            "Transição de status não permitida. "
            "Intervenções concluídas não podem "
            "ser alteradas nesta operação."
        )


# ============================================
# CONSULTA COM AUTORIZAÇÃO POR ESCOLA
# ============================================

def consulta_intervencoes_autorizadas(
    usuario: Usuario
):
    """
    Monta uma consulta SQLAlchemy que
    respeita a escola do usuário.

    A consulta não é executada aqui.
    """

    validar_usuario_ativo(usuario)

    consulta = (
        select(Intervencao)
        .join(
            Aluno,
            Intervencao.aluno_id == Aluno.id
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
# CREATE - CADASTRAR INTERVENÇÃO
# ============================================

def cadastrar_intervencao(
    db: Session,
    dados: IntervencaoCreate,
    usuario: Usuario
) -> Intervencao:

    exigir_administrador(usuario)

    validar_aluno_para_intervencao(
        db=db,
        aluno_id=dados.aluno_id
    )

    validar_datas_intervencao(
        data_intervencao=dados.data_intervencao,
        proximo_contato=dados.proximo_contato
    )

    # Uma intervenção concluída pode ser
    # registrada diretamente, caso a ação
    # já tenha ocorrido.
    nova_intervencao = Intervencao(
        aluno_id=dados.aluno_id,
        etapa=dados.etapa,
        status=dados.status,
        data_intervencao=dados.data_intervencao,
        descricao=dados.descricao,
        resultado=dados.resultado,
        responsavel=dados.responsavel,
        proximo_contato=dados.proximo_contato
    )

    try:
        db.add(nova_intervencao)
        db.commit()
        db.refresh(nova_intervencao)

    except IntegrityError as erro:
        db.rollback()

        raise IntervencaoConflitoError(
            "Não foi possível cadastrar a intervenção. "
            "Verifique os vínculos e as restrições "
            "dos dados informados."
        ) from erro

    return nova_intervencao


# ============================================
# READ - LISTAR INTERVENÇÕES
# ============================================

def listar_intervencoes(
    db: Session,
    usuario: Usuario,
    aluno_id: int | None = None
) -> list[Intervencao]:

    consulta = consulta_intervencoes_autorizadas(
        usuario
    )

    if aluno_id is not None:
        consulta = consulta.where(
            Intervencao.aluno_id == aluno_id
        )

    consulta = consulta.order_by(
        Intervencao.data_intervencao.desc(),
        Intervencao.id.desc()
    )

    resultado = db.execute(consulta)

    return list(
        resultado.scalars().all()
    )


# ============================================
# READ - BUSCAR INTERVENÇÃO POR ID
# ============================================

def buscar_intervencao(
    db: Session,
    intervencao_id: int,
    usuario: Usuario
) -> Intervencao:

    consulta = consulta_intervencoes_autorizadas(
        usuario
    ).where(
        Intervencao.id == intervencao_id
    )

    intervencao = db.execute(
        consulta
    ).scalar_one_or_none()

    if intervencao is None:
        raise IntervencaoNaoEncontradaError(
            "Intervenção não encontrada."
        )

    return intervencao


# ============================================
# UPDATE - ATUALIZAR INTERVENÇÃO
# ============================================

def atualizar_intervencao(
    db: Session,
    intervencao_id: int,
    dados: IntervencaoUpdate,
    usuario: Usuario
) -> Intervencao:

    exigir_administrador(usuario)

    intervencao = buscar_intervencao(
        db=db,
        intervencao_id=intervencao_id,
        usuario=usuario
    )

    # Não permite trocar o aluno.
    if dados.aluno_id != intervencao.aluno_id:
        raise IntervencaoConflitoError(
            "Não é permitido alterar o aluno "
            "vinculado à intervenção."
        )

    # Não permite trocar o tipo de ação.
    if dados.etapa != intervencao.etapa:
        raise IntervencaoConflitoError(
            "Não é permitido alterar a etapa "
            "de uma intervenção existente."
        )

    # Não permite alterar a data original.
    if (
        dados.data_intervencao
        != intervencao.data_intervencao
    ):
        raise IntervencaoConflitoError(
            "Não é permitido alterar a data "
            "original da intervenção."
        )

    # Não permite trocar o responsável original.
    if dados.responsavel != intervencao.responsavel:
        raise IntervencaoConflitoError(
            "Não é permitido alterar o responsável "
            "original por esta operação."
        )

    validar_aluno_para_intervencao(
        db=db,
        aluno_id=intervencao.aluno_id
    )

    validar_datas_intervencao(
        data_intervencao=intervencao.data_intervencao,
        proximo_contato=dados.proximo_contato
    )

    validar_transicao_status(
        status_atual=intervencao.status,
        novo_status=dados.status
    )

    # Apenas os campos abaixo podem mudar.
    intervencao.status = dados.status
    intervencao.descricao = dados.descricao
    intervencao.resultado = dados.resultado
    intervencao.proximo_contato = dados.proximo_contato

    try:
        db.commit()
        db.refresh(intervencao)

    except IntegrityError as erro:
        db.rollback()

        raise IntervencaoConflitoError(
            "Não foi possível atualizar a intervenção."
        ) from erro

    return intervencao


# ============================================
# DELETE - EXCLUIR INTERVENÇÃO
# ============================================

def excluir_intervencao(
    db: Session,
    intervencao_id: int,
    usuario: Usuario
) -> None:
    """Exclui fisicamente uma intervenção autorizada.

    Somente administradores podem excluir. Uma restrição
    de integridade no banco impede a confirmação da transação.
    Verifique cascatas ORM/FK antes de utilizar em dados reais.
    """

    exigir_administrador(usuario)

    intervencao = buscar_intervencao(
        db=db,
        intervencao_id=intervencao_id,
        usuario=usuario
    )

    try:
        db.delete(intervencao)
        db.commit()
    except IntegrityError as erro:
        db.rollback()
        raise IntervencaoConflitoError(
            "Não foi possível excluir a intervenção devido "
            "a vínculos ou restrições de integridade."
        ) from erro
