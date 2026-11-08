
CREATE USER IF NOT EXISTS 'evasao_app'@'localhost'
IDENTIFIED BY 'senha_adm';

GRANT SELECT, INSERT, UPDATE, DELETE,
CREATE, ALTER, INDEX, REFERENCES
ON monitoramento_evasao.*
TO 'evasao_app'@'localhost';

SHOW GRANTS FOR 'evasao_app'@'localhost';
