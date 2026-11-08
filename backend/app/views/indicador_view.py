
from datetime import date

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    model_validator
)


# ============================================
# PERÍODO UTILIZADO NOS INDICADORES
# ============================================

class PeriodoIndicador(BaseModel):

    data_inicio: date | None = None

    data_fim: date | None = None

    @model_validator(mode="after")
    def validar_periodo(self):

        if (
            self.data_inicio is not None
            and self.data_fim is not None
            and self.data_inicio > self.data_fim
        ):
            raise ValueError(
                "A data inicial não pode ser "
                "posterior à data final."
            )

        return self


# ============================================
# CONTAGEM DOS REGISTROS DE FREQUÊNCIA
# ============================================

class ResumoFrequencia(BaseModel):

    total_registros: int = Field(ge=0)

    total_presencas: int = Field(ge=0)

    total_ausencias: int = Field(ge=0)

    total_justificadas: int = Field(ge=0)

    @model_validator(mode="after")
    def validar_total_registros(self):

        soma = (
            self.total_presencas
            + self.total_ausencias
            + self.total_justificadas
        )

        if soma != self.total_registros:
            raise ValueError(
                "O total de registros deve ser "
                "igual à soma das situações."
            )

        return self


# ============================================
# PERCENTUAIS DE FREQUÊNCIA
# ============================================

class PercentuaisFrequencia(BaseModel):

    percentual_presenca: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    percentual_ausencia: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    percentual_justificada: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    percentual_ausencia_total: float | None = Field(
        default=None,
        ge=0,
        le=100
    )


# ============================================
# RESPONSE - INDICADORES DE UM ALUNO
# ============================================

class IndicadorAlunoResponse(BaseModel):

    aluno_id: int = Field(gt=0)

    codigo_aluno: str

    nome_aluno: str

    turma_id: int = Field(gt=0)

    nome_turma: str

    escola_id: int = Field(gt=0)

    nome_escola: str

    periodo: PeriodoIndicador

    resumo: ResumoFrequencia

    percentuais: PercentuaisFrequencia

    possui_registros: bool

    model_config = ConfigDict(
        from_attributes=True
    )

    @model_validator(mode="after")
    def validar_disponibilidade(self):

        if self.possui_registros != (
            self.resumo.total_registros > 0
        ):
            raise ValueError(
                "O campo possui_registros não "
                "corresponde ao total informado."
            )

        return self


# ============================================
# RESPONSE - RESUMO DE UMA TURMA
# ============================================

class IndicadorTurmaResponse(BaseModel):

    turma_id: int = Field(gt=0)

    nome_turma: str

    escola_id: int = Field(gt=0)

    periodo: PeriodoIndicador

    total_alunos: int = Field(ge=0)

    alunos_com_registros: int = Field(ge=0)

    alunos_sem_registros: int = Field(ge=0)

    media_percentual_presenca: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    @model_validator(mode="after")
    def validar_total_alunos(self):

        soma = (
            self.alunos_com_registros
            + self.alunos_sem_registros
        )

        if soma != self.total_alunos:
            raise ValueError(
                "A soma dos alunos com e sem "
                "registros deve corresponder "
                "ao total de alunos."
            )

        return self
