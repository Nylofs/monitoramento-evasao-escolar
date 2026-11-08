
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    ForeignKey,
    CheckConstraint,
    func
)

from sqlalchemy.orm import relationship

from app.database.connection import Base


class Intervencao(Base):

    __tablename__ = "intervencoes"

    __table_args__ = (
        CheckConstraint(
            "etapa IN ("
            "'CONVERSA_ALUNO', "
            "'CONTATO_FAMILIA', "
            "'ENCAMINHAMENTO_INSTITUCIONAL'"
            ")",
            name="ck_intervencao_etapa"
        ),

        CheckConstraint(
            "status IN ("
            "'ABERTO', "
            "'EM_ANDAMENTO', "
            "'CONCLUIDO'"
            ")",
            name="ck_intervencao_status"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    etapa = Column(
        String(40),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="ABERTO"
    )

    data_intervencao = Column(
        Date,
        nullable=False
    )

    descricao = Column(
        Text,
        nullable=False
    )

    resultado = Column(
        Text,
        nullable=True
    )

    responsavel = Column(
        String(150),
        nullable=False
    )

    proximo_contato = Column(
        Date,
        nullable=True
    )

    criado_em = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    aluno_id = Column(
        Integer,
        ForeignKey("alunos.id"),
        nullable=False,
        index=True
    )

    aluno = relationship(
        "Aluno",
        back_populates="intervencoes"
    )
