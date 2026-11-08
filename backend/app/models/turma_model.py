
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    UniqueConstraint
)

from sqlalchemy.orm import relationship

from app.database.connection import Base


class Turma(Base):

    __tablename__ = "turmas"

    __table_args__ = (
        UniqueConstraint(
            "escola_id",
            "nome",
            "ano_letivo",
            name="uq_turma_escola_nome_ano"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    nome = Column(
        String(20),
        nullable=False
    )

    serie = Column(
        String(20),
        nullable=False
    )

    turno = Column(
        String(20),
        nullable=False
    )

    ano_letivo = Column(
        Integer,
        nullable=False
    )

    ativo = Column(
        Boolean,
        nullable=False,
        default=True
    )

    escola_id = Column(
        Integer,
        ForeignKey("escolas.id"),
        nullable=False,
        index=True
    )

    escola = relationship(
        "Escola",
        back_populates="turmas"
    )

    alunos = relationship(
        "Aluno",
        back_populates="turma"
    )
