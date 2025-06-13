
# 🌱 AgroTech API - Monitoramento de Temperatura e Umidade

Este é um projeto de API RESTful desenvolvido para coletar, armazenar e monitorar dados de sensores ambientais (temperatura e umidade) com foco em ambientes agropecuários. A API permite CRUD completo dos dados sensoriais, possui documentação via Swagger e CI/CD automatizado com Docker, GitHub Actions e análise de qualidade de código com SonarQube.

---

## 🔧 Tecnologias Utilizadas

- **Node.js** com **Express**
- **MongoDB** para persistência dos dados
- **Swagger (OpenAPI)** para documentação interativa
- **Docker** para conteinerização
- **GitHub Actions** para pipeline de CI/CD
- **SonarQube** para análise de qualidade de código

---

## 📁 Estrutura do Projeto

```
📦 backend/
 ┣ 📂models/
 ┃ ┗ 📜DadosSensor.js
 ┣ 📂routes/
 ┃ ┗ 📜dataRoutes.js
 ┣ 📜server.js
 ┣ 📜.env
 ┣ 📜swagger.yaml
 ┣ 📜Dockerfile
 ┗ 📜docker-compose.yml
```

---

## 🚀 Como Rodar o Projeto

### 🐳 Usando Docker

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/ellendias01/docker.git
   cd backend
   ```

2. **Configure seu `.env`:**
   ```env
   MONGO_URI=mongodb://<seu_host_mongo>:27017/agrotech
   ```

3. **Build e up:**
   ```bash
   docker-compose up --build
   ```

4. Acesse:
   - API: `http://localhost:3000/dados`
   - Swagger: `http://localhost:3000/api-docs`

---

## 📑 Documentação Swagger

A API está documentada utilizando Swagger UI.

Acesse em:  
📌 `http://localhost:3000/api-docs`

Exemplo de schema de dado:

```yaml
DadoSensor:
  type: object
  required:
    - temperature
    - humidity
    - datetime
    - local_name
  properties:
    _id:
      type: string
    temperature:
      type: number
      example: 25.5
    humidity:
      type: number
      example: 60
    datetime:
      type: string
      format: date-time
    local_name:
      type: string
      example: "Estábulo 1"
```

---

## 🔁 Endpoints Principais

| Método | Rota                 | Descrição                     |
|--------|----------------------|-------------------------------|
| GET    | `/dados`             | Lista todos os dados          |
| GET    | `/dados/:id`         | Busca um dado por ID          |
| POST   | `/dados`             | Cria um novo registro         |
| PUT    | `/dados/:id`         | Atualiza um dado existente    |
| DELETE | `/dados/:id`         | Remove um registro por ID     |

---

## ⚙️ CI/CD com GitHub Actions

O pipeline está configurado para:

1. Buildar a imagem Docker e enviar para o Docker Hub: [`ellen25`](https://hub.docker.com/u/ellen25)
2. Iniciar uma instância temporária do SonarQube via SSH no servidor remoto (`201.23.3.86`)
3. Executar análise de código com SonarScanner
4. Fazer o deploy da aplicação apenas se a qualidade for aprovada

Arquivo `.github/workflows/deploy.yml` controla toda a automação.

---

## 🧪 Teste

Você pode testar os endpoints utilizando:

- **Thunder Client** (VS Code)
- **Postman**
- **Curl**
- **Swagger UI** (`/api-docs`)

---

## 📌 Observações

- Certifique-se de que a porta usada (3000) esteja disponível.
- A conexão com o MongoDB deve estar funcional (local ou hospedado).
- A documentação Swagger requer que o YAML esteja corretamente indentado (atenção aos erros `YAMLSyntaxError`).

---

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se livre para abrir issues ou pull requests. 💻

---

## 👩‍💻 Desenvolvido por

**Éllen Dias Farias**  
GitHub: [@ellendias01](https://github.com/ellendias01)

---
