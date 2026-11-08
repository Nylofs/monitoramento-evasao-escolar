
from app.config.security import (
    gerar_hash_senha,
    verificar_senha
)


def testar_seguranca():
    # Senha fictícia utilizada somente no teste
    senha_teste = "SenhaFicticia2026!"

    # Gera um hash protegido
    hash_gerado = gerar_hash_senha(senha_teste)

    # Verifica a senha correta
    resultado_correto = verificar_senha(
        senha_teste,
        hash_gerado
    )

    # Verifica uma senha incorreta
    resultado_incorreto = verificar_senha(
        "SenhaIncorreta",
        hash_gerado
    )

    print("Senha correta:", resultado_correto)
    print("Senha incorreta:", resultado_incorreto)

    assert resultado_correto is True
    assert resultado_incorreto is False

    print("Testes de senha concluídos!")


if __name__ == "__main__":
    testar_seguranca()
