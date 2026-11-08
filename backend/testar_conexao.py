
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import engine


def testar_conexao():
    try:
        with engine.connect() as conexao:
            resultado = conexao.execute(
                text("SELECT DATABASE()")
            )

            nome_banco = resultado.scalar()

            print("Conexão realizada com sucesso!")
            print(f"Banco conectado: {nome_banco}")

    except SQLAlchemyError as erro:
        print("Erro ao conectar com o MySQL.")
        print(f"Detalhes: {erro}")


if __name__ == "__main__":
    testar_conexao()
