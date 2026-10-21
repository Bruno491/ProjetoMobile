# Backend

API REST em Python/FastAPI para a lista de compras. A conexão foi configurada
para o SQL Server LocalDB `(localdb)\MSSQLLocalDB`, usando a autenticação do
Windows da conta que inicia a API. Não há senha do SQL Server no código.
Senhas dos usuários são armazenadas como hashes PBKDF2 com salt aleatório.

## Preparação

Requisitos: Python, SQL Server LocalDB e Microsoft ODBC Driver 18 for SQL Server.

No PowerShell, a partir da pasta `backend`:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
sqlcmd -S "(localdb)\MSSQLLocalDB" -E -i .\database\setup.sql
```

Revise `backend/.env` e troque `SECRET_KEY` por um valor aleatório privado
antes de iniciar a API. Mantenha o arquivo `.env` apenas local; ele é
ignorado pelo Git. Gere um valor, por exemplo, com
`python -c "import secrets; print(secrets.token_urlsafe(48))"`.

O script cria o banco `ProjetoMobile` e a tabela `dbo.ShoppingItems` se ainda
não existirem. Se a instância ou o banco tiverem outros nomes, ajuste `.env`;
nesse caso, edite também o nome do banco no script antes de executá-lo.

## Executar

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

A documentação interativa fica em `http://localhost:8000/docs`. Para testar
em um celular, o telefone e o computador devem estar na mesma rede Wi-Fi e o
frontend deve usar `http://<IPv4-do-computador>:8000`. O LocalDB permanece no
computador; somente a API é acessada pelo telefone. Não exponha esta API de
desenvolvimento à internet.

No terminal do repositório, configure o endereço que o app usará:

```powershell
Copy-Item .\frontend\.env.example .\frontend\.env
```

Edite `frontend/.env` e troque o IP de exemplo pelo IPv4 do computador
(consulte `ipconfig`), depois inicie o Expo a partir de `frontend` com
`npm start`. O arquivo `.env` é local e ignorado pelo Git.

## Endpoints

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | `/api/health` | Verifica se a API está ativa |
| POST | `/api/auth/register-family` | Cria a família e a conta do responsável |
| POST | `/api/auth/login` | Autentica com e-mail e senha |
| POST | `/api/auth/join-family` | Cria conta de membro usando convite de uso único |
| GET | `/api/auth/me` | Retorna o perfil autenticado |
| GET | `/api/family/members` | Lista os membros da família autenticada |
| POST | `/api/family/invitations` | Responsável gera convite válido por 24 horas |
| GET | `/api/items` | Lista produtos da família; retorna `[]` sem registros |
| POST | `/api/items` | Responsável cria produto com `{ "name": "Arroz" }` |
| PATCH | `/api/items/{id}` | Responsável atualiza com `{ "completed": true }` |
| DELETE | `/api/items/{id}` | Responsável remove produto |

O responsável pode editar a lista. Familiares convidados têm contas próprias,
mas podem apenas consultar a lista compartilhada. A API separa os produtos
por família e aplica a permissão mesmo que uma requisição seja feita fora do
aplicativo.

Falhas de conexão ao banco retornam HTTP 503; sessão inválida ou expirada,
HTTP 401; ação não permitida para membro, HTTP 403; e erros inesperados,
HTTP 500 com registro no log. O token expira em 60 minutos. Esta API de
desenvolvimento usa HTTP: não a exponha à internet nem a use com dados
pessoais reais sem HTTPS, limites de tentativas e preparação adequada para
produção.

## Testes

```powershell
pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
```
