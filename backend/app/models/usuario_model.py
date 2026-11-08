
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    CheckConstraint,
    func
)

from sqlalchemy.orm import relationship

from app.database.connection import Base


class Usuario(Base):

    __tablename__ = "usuarios"

    __table_args__ = (
        CheckConstraint(
            "perfil IN ("
            "'ADMINISTRADOR', "
            "'GESTOR', "
            "'COORDENADOR'"
            ")",
            name="ck_usuario_perfil"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    nome = Column(
        String(150),
        nullable=False
    )

    matricula = Column(
        String(30),
        unique=True,
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False
    )

    senha_hash = Column(
        String(255),
        nullable=False
    )

    perfil = Column(
        String(20),
        nullable=False,
        default="COORDENADOR"
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

    escola_id = Column(
        Integer,
        ForeignKey("escolas.id"),
        nullable=False,
        index=True
    )

    escola = relationship(
        "Escola",
        back_populates="usuarios"
    )
