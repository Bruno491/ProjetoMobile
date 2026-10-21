# Documentação do Projeto — Checkpoint 2

## 1. Identificação

- **Projeto:** Lista de Compras da Família
- **Nome técnico:** ProjetoMobile
- **Tipo:** aplicativo mobile desenvolvido com React Native, TypeScript e Expo
- **Backend:** API REST desenvolvida em Python com FastAPI
- **Banco de dados:** Microsoft SQL Server LocalDB
- **Repositório:** [Bruno491/ProjetoMobile](https://github.com/Bruno491/ProjetoMobile)

## 2. Objetivo e visão geral

O Checkpoint 2 transformou a lista de compras inicialmente local em um
aplicativo conectado a uma API REST e a um banco SQL Server. A aplicação
também passou a oferecer contas individuais organizadas por família: o
responsável cria a família e administra a lista; os familiares entram por
convite e podem consultar a lista compartilhada.

O aplicativo não acessa o banco diretamente. O frontend envia requisições
HTTP com dados JSON ao backend. A API autentica o usuário, verifica sua
família e suas permissões, consulta ou altera os dados no SQL Server e
devolve uma resposta JSON ao app.

```text
Expo / React Native
    │ HTTP + JSON; token de acesso nas rotas autenticadas
    ▼
FastAPI (backend)
    │ pyodbc + ODBC Driver 18 + autenticação integrada do Windows
    ▼
SQL Server LocalDB — banco ProjetoMobile
```

## 3. Evolução desde o Checkpoint 1

### O que existia no Checkpoint 1

A versão anterior apresentava a lista de compras com dados mantidos no
próprio aplicativo. Era possível adicionar produtos, marcar produtos como
comprados e removê-los. A interface já utilizava componentes React Native,
TypeScript, estado React, `FlatList`, `StyleSheet` e Flexbox.

### O que foi implementado e alterado

- Organização do código em `frontend/` e `backend/`.
- Substituição da entrada de tela única pela navegação baseada em Expo Router.
- Criação da API REST com FastAPI e integração com SQL Server LocalDB.
- Autenticação com e-mail e senha e sessão com token Bearer.
- Criação de conta responsável vinculada a uma nova família.
- Convites de uso único, válidos por 24 horas, para familiares criarem suas
  próprias contas.
- Separação de permissões: responsável administra a lista; membro consulta a
  lista compartilhada.
- Armazenamento de usuários, famílias, convites e produtos no SQL Server.
- Carregamento e atualização dos dados pela API, com `async`/`await`,
  `useEffect` e estado React.
- Tratamento de carregamento, lista vazia, falha de comunicação e erros do
  servidor.
- Separação de telas, componentes visuais, contexto de autenticação, hook da
  lista e serviços HTTP.

Os produtos não são mais mantidos como dados fixos locais. Inclusões,
alterações e remoções só atualizam a lista exibida após confirmação da API.
Os dados são separados por família no backend.

## 4. Aplicativo: telas, fluxo e dados

### Telas e navegação

O app usa Expo Router, com as telas em `frontend/src/app/`:

| Rota/tela | Função |
| --- | --- |
| `/` | Verifica a sessão e redireciona para `/login` ou `/home`. |
| `/login` | Permite entrar, criar a conta da família ou aceitar um convite. |
| `/home` | Exibe a lista compartilhada e, para o responsável, os controles de edição. |
| `/family` | Exibe membros, permite gerar convite ao responsável e oferece saída da conta. |

Fluxo normal: ao abrir o app, a sessão salva é verificada; sem sessão válida,
o usuário vai para o login. O responsável pode criar uma família preenchendo
nome da família, nome, e-mail e senha. Um familiar escolhe “Tenho convite”,
informa o código recebido, seu nome, e-mail e senha. Após autenticar, ambos
chegam à lista da família. Na tela inicial, o botão “Família” abre a área de
membros; “Voltar à lista” retorna à lista. A saída encerra a sessão e volta ao
login.

### Como os dados são compartilhados entre telas

O `AuthContext` mantém o perfil autenticado disponível nas telas e persiste a
sessão no armazenamento seguro do dispositivo (`expo-secure-store`). Ao
restaurar uma sessão, o app consulta `GET /api/auth/me`; se o token tiver
expirado ou for inválido, o usuário precisa entrar novamente. O token é
enviado no cabeçalho de autorização das requisições autenticadas.

As telas não passam produtos por parâmetros de navegação. A lista é carregada
pela tela `/home` através do hook `useShoppingList`, que guarda produtos,
carregamento e erros em estado React. A tela `/family` consulta os membros
diretamente à API. O nome e o papel do usuário vêm do perfil de autenticação.
Componentes visuais recebem dados e ações por propriedades (props).

### Perfis e regras da família

- **Responsável (`owner`):** cria a família, consulta a lista, adiciona,
  conclui/desmarca e remove produtos; também pode gerar convites e consultar
  os membros.
- **Membro (`member`):** tem conta própria, pode consultar a lista e os
  membros, mas não pode editar produtos nem gerar convites.
- **Convite:** gerado pelo responsável, válido por 24 horas e aceito uma única
  vez. O código é armazenado no banco apenas em forma de hash; ao ser usado,
  passa a constar como utilizado.

As permissões são aplicadas pela API, não apenas pela interface. Assim, uma
requisição de alteração feita por um membro também é recusada pelo backend.

## 5. Integração com a Web API e SQL Server

### Endereços e configuração

O frontend usa `EXPO_PUBLIC_API_URL` como endereço base da API. Copie
`frontend/.env.example` para `frontend/.env` e configure, por exemplo:

```env
EXPO_PUBLIC_API_URL=http://<IPv4-do-computador>:8000
```

Em celular físico, o computador e o telefone precisam estar na mesma rede
local; use o IPv4 do computador, permita a conexão no firewall se necessário
e inicie o Expo com modo LAN. `localhost` no telefone aponta para o próprio
telefone, não para o computador. A API usa a porta 8000 por padrão.

O backend lê `backend/.env`, baseado em `backend/.env.example`. A configuração
SQL Server para este ambiente é:

```env
DB_SERVER=(localdb)\MSSQLLocalDB
DB_NAME=ProjetoMobile
ODBC_DRIVER=ODBC Driver 18 for SQL Server
```

A API conecta usando `Trusted_Connection=yes`: utiliza a conta Windows que
executa o backend, sem credenciais do banco no frontend. Essa configuração é
adequada ao desenvolvimento local no Windows; para outro computador, é
necessário configurar uma instância SQL Server alcançável por ele.

### Recursos e entidades

O script `backend/database/setup.sql` cria o banco `ProjetoMobile` e as
tabelas:

| Tabela | Conteúdo |
| --- | --- |
| `dbo.Families` | Nome e data de criação da família. |
| `dbo.Users` | Usuário, e-mail exclusivo, hash da senha, papel e família. |
| `dbo.FamilyInvitations` | Hash do código, família, expiração e data de uso. |
| `dbo.ShoppingItems` | Produto, estado de conclusão e família proprietária. |

Os dados pessoais e produtos são relacionados por `family_id`. Senhas não
são armazenadas em texto puro: o backend usa PBKDF2 com salt aleatório. A
autenticação da API usa token assinado com validade padrão de 60 minutos,
configurável no backend.

### Endpoints

Rotas de autenticação que criam sessão respondem com o perfil do usuário e
token de acesso. As demais rotas protegidas exigem esse token no cabeçalho
Bearer.

| Método | Endpoint | Acesso e finalidade |
| --- | --- | --- |
| GET | `/api/health` | Verifica se a API está ativa. |
| POST | `/api/auth/register-family` | Público; cria família e usuário responsável. |
| POST | `/api/auth/login` | Público; autentica e inicia sessão. |
| POST | `/api/auth/join-family` | Público; valida convite e cria usuário membro. |
| GET | `/api/auth/me` | Autenticado; retorna o perfil da sessão. |
| GET | `/api/family/members` | Autenticado; lista membros da família do usuário. |
| POST | `/api/family/invitations` | Somente responsável; gera convite de uso único. |
| GET | `/api/items` | Autenticado; lista produtos da própria família. |
| POST | `/api/items` | Somente responsável; cria produto com `{"name":"Arroz"}`. |
| PATCH | `/api/items/{id}` | Somente responsável; altera com `{"completed":true}`. |
| DELETE | `/api/items/{id}` | Somente responsável; remove produto. |

Exemplo de resposta de `GET /api/items`:

```json
[
  {
    "id": 1,
    "name": "Arroz",
    "completed": false
  }
]
```

Se não houver produtos para a família, o endpoint retorna `[]` com HTTP 200.
Os dados de entrada e saída são JSON; o backend valida os campos e o
frontend verifica o formato recebido antes de usá-lo.

### Responsabilidades no código

- `frontend/src/app/`: rotas e telas do app.
- `frontend/src/contexts/AuthContext.tsx`: sessão, perfil e operações de login.
- `frontend/src/hooks/useShoppingList.ts`: estado da lista, carregamento e ações.
- `frontend/src/services/`: comunicação HTTP, autenticação e validação das respostas.
- `frontend/src/components/`: componentes visuais reutilizáveis.
- `backend/app/main.py`: rotas, autenticação exigida, permissões e respostas.
- `backend/app/auth.py`: hash/verificação de senha e validação de sessão.
- `backend/app/auth_repository.py`: persistência de famílias, usuários, convites e membros.
- `backend/app/repository.py`: persistência dos produtos por família.
- `backend/app/schemas.py`: validação dos dados de entrada e saída.
- `backend/app/database.py` e `backend/app/config.py`: conexão e configuração.
- `backend/database/setup.sql`: criação do esquema no SQL Server.

## 6. Estado e tratamento de situações

O hook `useShoppingList` inicia o carregamento ao montar a tela, usando
`useEffect` e funções assíncronas. Durante a consulta, a tela mostra um
indicador de progresso. Quando recebe a resposta, armazena os produtos e
atualiza a renderização. Cada ação de edição espera a confirmação do backend
antes de atualizar o estado local.

| Situação | Comportamento |
| --- | --- |
| API e banco disponíveis com produtos | O JSON é validado, armazenado no estado React e exibido na lista. |
| API e banco disponíveis sem produtos | A API retorna `[]`; a tela informa que a lista está vazia. |
| Aguardando resposta da lista | Exibe indicador e “Carregando produtos...”. |
| Falha de comunicação | Exibe mensagem de conexão e permite “Tentar novamente”. |
| Erro enviado pelo servidor | O frontend apresenta o campo `detail` da resposta, quando disponível. |
| Entrada inválida | A API retorna HTTP 422 com detalhe de validação; o formulário mostra o erro. |
| Credenciais ou sessão inválidas/expiradas | A API retorna HTTP 401; é necessário autenticar-se novamente. |
| Membro tenta editar ou convidar | A API retorna HTTP 403 e não efetua a operação. |
| Registro não encontrado | A API retorna HTTP 404. |
| SQL Server indisponível | A API retorna HTTP 503 e mensagem informativa. |
| Erro inesperado no backend | A API registra o erro no log e retorna HTTP 500 com mensagem genérica. |
| Erro ao adicionar, concluir ou remover | A lista não simula sucesso; mantém os dados confirmados e mostra o erro da ação. |

## 7. Como executar e testar no celular

### Preparar o banco e iniciar o backend

No Windows, instale Python, SQL Server LocalDB e Microsoft ODBC Driver 18 for
SQL Server. Na pasta `backend`, siga o [README do backend](../backend/README.md)
para criar o ambiente virtual, configurar `backend/.env` e executar
`backend/database/setup.sql`. Depois inicie a API:

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

A documentação interativa da API fica em `http://localhost:8000/docs`.

### Iniciar o frontend

Na pasta `frontend`, configure `frontend/.env` com o IPv4 do computador e
inicie o Expo em modo LAN:

```powershell
npm start -- --host lan
```

Escaneie o QR code com o Expo Go. O celular e o computador precisam estar na
mesma rede; libere no firewall do Windows o acesso às portas do Metro/Expo e
da API se o sistema solicitar. Se a porta padrão do Expo estiver ocupada,
selecione a alternativa sugerida pelo Expo. A URL da API no `.env` deve
continuar apontando para o IPv4 do computador na porta 8000.

### Teste funcional sugerido

1. Crie uma família e entre como responsável.
2. Confirme que a lista vazia é apresentada.
3. Adicione um produto, marque-o como comprado e remova-o; confirme que as
   alterações persistem ao atualizar ou reabrir a lista.
4. Abra a área “Família”, gere um convite e utilize-o para cadastrar um membro.
5. Entre como membro; confirme que ele vê a lista compartilhada, mas não
   recebe controles de edição nem de convite.
6. Teste credenciais incorretas ou uma falha de rede e confira as mensagens
   apresentadas.

## 8. Testes e validação

Comandos usados para validação:

```powershell
# Na pasta backend
python -m unittest discover -s tests -v

# Na pasta frontend
npx expo lint
npx tsc --noEmit
```

Resultados da validação mais recente:

- **Backend:** 9 testes automatizados passaram, cobrindo autenticação,
  autorização, lista vazia/com registros, erros do servidor e validação.
- **Frontend:** lint e TypeScript concluíram sem erros.
- **Execução:** a API respondeu ao health check e o bundle Android foi
  compilado pelo Metro.
- **Dispositivo físico:** o usuário confirmou que abriu e testou o aplicativo
  no celular via Expo Go.

## 9. Entregáveis

1. Código-fonte do frontend React Native/Expo: pasta `frontend/`.
2. Código-fonte da Web API: pasta `backend/`.
3. Script de criação do banco: `backend/database/setup.sql`.
4. Documentação do Checkpoint 2: este arquivo Markdown e a versão Word
   `docs/DOCUMENTACAO-PROJETO-CHECKPOINT-02.docx`.
5. Termo de Uso de Inteligência Artificial Generativa: seção abaixo.
6. Repositório: [github.com/Bruno491/ProjetoMobile](https://github.com/Bruno491/ProjetoMobile).

## 10. Termo de Uso de Inteligência Artificial Generativa

Durante a evolução do projeto, foi utilizada Inteligência Artificial
Generativa como apoio à organização da estrutura `frontend/` e `backend/`, à
implementação da comunicação entre o app, a API e o SQL Server, à elaboração
de testes e à preparação/revisão desta documentação.

O uso da ferramenta não substitui o entendimento, a revisão e a validação do
estudante. O código e os resultados devem ser conferidos pelo estudante, que
permanece responsável pelas decisões técnicas, pela execução da aplicação e
pela apresentação do trabalho. Este texto deve ser revisado pelo estudante
para refletir fielmente o uso realizado e as regras da instituição antes da
entrega.

## 11. Limitações e observações

- O SQL Server LocalDB e a autenticação integrada do Windows são usados no
  ambiente local de desenvolvimento; para disponibilizar o serviço em outra
  máquina, é necessário configurar o SQL Server e as permissões dessa máquina.
- A API de desenvolvimento utiliza HTTP e não deve ser exposta diretamente à
  internet nem usada com dados reais sem medidas adicionais, como HTTPS e
  controles de segurança para produção.
- A documentação não inclui capturas de tela; elas podem ser adicionadas
  depois de capturar as telas no dispositivo.
