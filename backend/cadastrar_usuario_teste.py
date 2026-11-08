
from getpass import getpass

from sqlalchemy import select

from app.database.connection import SessionLocal

from app.models.escola_model import Escola
from app.models.turma_model import Turma
from app.models.aluno_model import Aluno
from app.models.frequencia_model import Frequencia
from app.models.intervencao_model import Intervencao
from app.models.usuario_model import Usuario

from app.config.security import gerar_hash_senha


def cadastrar_usuario_teste():
    db = SessionLocal()

    try:
        # Localiza a escola fictícia
        escola = db.execute(
            select(Escola).where(
                Escola.nome == "Escola Municipal Exemplo"
            )
        ).scalars().first()

        if escola is None:
            print("Escola de teste não encontrada.")
            return

        # Verifica se a matrícula já existe
        usuario_existente = db.execute(
            select(Usuario).where(
                Usuario.matricula == "coord.demo"
            )
        ).scalars().first()

        if usuario_existente is not None:
            print("Usuário demonstrativo já cadastrado.")
            return

        # Solicita a senha sem exibi-la
        senha = getpass(
            "Digite a senha fictícia de teste: "
        )

        if len(senha) < 12:
            print("Utilize pelo menos 12 caracteres.")
            return

        # Gera o hash da senha
        senha_protegida = gerar_hash_senha(senha)

        # Cria o objeto Usuario
        novo_usuario = Usuario(
            nome="Mariana Alves",
            matricula="coord.demo",
            email="mariana@example.com",
            senha_hash=senha_protegida,
            perfil="COORDENADOR",
            ativo=True,
            escola_id=escola.id
        )

        # Adiciona e confirma a gravação
        db.add(novo_usuario)
        db.commit()

        print("Usuário cadastrado com sucesso!")
        print("Matrícula: coord.demo")
        print("Perfil: COORDENADOR")

    except Exception as erro:
        db.rollback()
        print("Erro ao cadastrar usuário.")
        print(type(erro).__name__)

    finally:
        db.close()


if __name__ == "__main__":
    cadastrar_usuario_teste()

