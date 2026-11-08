
from sqlalchemy import (
    Column,
    Integer,
    Date,
    DateTime,
    String,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    func
)

from sqlalchemy.orm import relationship

from app.database.connection import Base


class Frequencia(Base):

    __tablename__ = "frequencias"

    __table_args__ = (
        UniqueConstraint(
            "aluno_id",
            "data",
            name="uq_frequencia_aluno_data"
        ),
        CheckConstraint(
            "situacao IN "
            "('PRESENTE', 'AUSENTE', 'JUSTIFICADA')",
            name="ck_frequencia_situacao"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    data = Column(
        Date,
        nullable=False
    )

    situacao = Column(
        String(20),
        nullable=False
    )

    observacao = Column(
        String(255),
        nullable=True
    )

    registrado_em = Column(
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
        back_populates="frequencias"
    )
