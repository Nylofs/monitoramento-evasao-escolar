
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import engine


def verificar_banco():
    try:
        with engine.connect() as conexao:
            resultado = conexao.execute(
                text("SELECT DATABASE()")
            )

            nome_banco = resultado.scalar()

            return {
                "status": "conectado",
                "banco": nome_banco
            }

    except SQLAlchemyError:
        return {
            "status": "erro",
            "banco": None
        }
