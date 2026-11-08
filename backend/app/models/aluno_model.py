
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    func
)

from sqlalchemy.orm import relationship

from app.database.connection import Base


class Aluno(Base):

    __tablename__ = "alunos"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    codigo_aluno = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )

    nome = Column(
        String(150),
        nullable=False
    )

    ativo = Column(
        Boolean,
        nullable=False,
        default=True
    )

    criado_em = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    turma_id = Column(
        Integer,
        ForeignKey("turmas.id"),
        nullable=False,
        index=True
    )

    # Relacionamento com Turma
    turma = relationship(
        "Turma",
        back_populates="alunos"
    )

    # Relacionamento com Frequencia
    frequencias = relationship(
        "Frequencia",
        back_populates="aluno"
    )

    # Relacionamento com Intervencao
    intervencoes = relationship(
        "Intervencao",
        back_populates="aluno"
    )
