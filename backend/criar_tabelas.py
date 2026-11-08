
from app.database.connection import Base, engine

# Importando todos os Models
from app.models.escola_model import Escola
from app.models.turma_model import Turma
from app.models.aluno_model import Aluno
from app.models.frequencia_model import Frequencia
from app.models.intervencao_model import Intervencao
from app.models.usuario_model import Usuario


def criar_tabelas():
    print("Iniciando criação das tabelas...")

    Base.metadata.create_all(bind=engine)

    print("Tabelas verificadas/criadas com sucesso!")


if __name__ == "__main__":
    criar_tabelas()
