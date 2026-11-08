
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    func
)

from sqlalchemy.orm import relationship

from app.database.connection import Base


class Escola(Base):

    __tablename__ = "escolas"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    nome = Column(
        String(150),
        nullable=False
    )

    codigo_inep = Column(
        String(8),
        unique=True,
        nullable=True
    )

    endereco = Column(
        String(255),
        nullable=True
    )

    bairro = Column(
        String(100),
        nullable=True
    )

    cidade = Column(
        String(100),
        nullable=False,
        default="Recife"
    )

    uf = Column(
        String(2),
        nullable=False,
        default="PE"
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

    # Uma escola possui várias turmas
    turmas = relationship(
        "Turma",
        back_populates="escola"
    )

    # Uma escola possui vários usuários
    usuarios = relationship(
        "Usuario",
        back_populates="escola"
    )
