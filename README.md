# HomeFlix

Servidor de midia pessoal estilo Netflix, feito com Node.js.

## Funcionalidades

### Biblioteca
- Exploracao em grade com agrupamento automatico por serie/temporada
- Navegacao Serie > Temporada > Episodio
- Busca por titulo, serie, temporada e pasta
- Thumbnails geradas automaticamente com iniciais coloridas
- Suporte a mp4, mkv, webm, avi, mov
- Ordenacao numerica (EP01, EP02, ..., EP10)

### Player
- Player full-width estilo Netflix
- Barra de navegacao entre episodios da mesma temporada
- Botao "Proximo Episodio" nos ultimos 30 segundos do video

### Perfis
- Tela de selecao de perfil ao iniciar
- Criar multiplos perfis com nome e cor
- Cada perfil mantem seu historico e categorias independentemente
- Trocar de perfil a qualquer momento

### Assistidos
- Marcacao automatica ao terminar o video
- Indicador visual nos cards (check verde, "Assistido", "Parcial")
- Progresso salvo a cada 5 segundos durante a reproducao
- Barra lateral verde no episodio assistido

### Categorias
- Criar categorias personalizadas (Acao, Comedia, etc.)
- Atribuir categorias a cada serie/filme
- Filtrar biblioteca por categoria na tela principal
- Categorias sao por perfil (cada usuario tem as suas)

## Requisitos

- [Node.js](https://nodejs.org/) 18+
- npm

## Instalacao

```bash
git clone <repo-url> HomeFlix
cd HomeFlix
npm install
```

## Uso

### Desenvolvimento

```bash
npm run dev
```

Abra http://localhost:3000

### Build para producao

```bash
npm run build
```

Gera os arquivos minificados na pasta `dist/`.

### Producao

```bash
npm start
```

## Estrutura

```
HomeFlix/
  server.js           # Backend Express (API + streaming)
  build.js            # Script de build (minificacao)
  config.json         # Configuracao de pasta (gerenciado pelo app)
  data/
    users.json        # Perfis de usuario
    watch.json        # Historico de assistidos (por usuario)
    categories.json   # Categorias atribuidas (por usuario)
  public/
    index.html        # Pagina principal
    css/style.css     # Estilos
    js/app.js         # Frontend SPA
  dist/               # Gerado por npm run build
  package.json
```

## API

### Config
| Rota           | Metodo | Descricao                  |
|----------------|--------|----------------------------|
| `/api/config`  | GET    | Retorna configuracao atual |
| `/api/config`  | PUT    | Atualiza pasta de midia    |

### Videos
| Rota                 | Metodo | Descricao                         |
|----------------------|--------|-----------------------------------|
| `/api/movies`        | GET    | Lista todos os videos             |
| `/api/stream/:id`    | GET    | Stream do video com range support |
| `/api/thumbnail/:id` | GET    | Thumbnail SVG do video            |

### Usuarios
| Rota               | Metodo | Descricao             |
|--------------------|--------|-----------------------|
| `/api/users`       | GET    | Lista usuarios        |
| `/api/users`       | POST   | Cria usuario          |
| `/api/users/:id`   | DELETE | Remove usuario+dados  |

### Assistidos
| Rota                          | Metodo | Descricao                    |
|-------------------------------|--------|------------------------------|
| `/api/watch/:userId`          | GET    | Retorna watch do usuario     |
| `/api/watch/:userId`          | POST   | Salva progresso/assistido    |
| `/api/watch/:userId/batch`    | POST   | Salva multiplos de uma vez   |

### Categorias
| Rota                            | Metodo | Descricao                    |
|---------------------------------|--------|------------------------------|
| `/api/categories/:userId`       | GET    | Categorias do usuario        |
| `/api/categories/:userId`       | PUT    | Atribui categorias a um show |

## Licenca

Uso pessoal.
