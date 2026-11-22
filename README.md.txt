# Saruê Livros — Lista de Tarefas e Avaliação de Obras

Site simples e responsivo para organização de tarefas da equipe e registro de obras para avaliação editorial, construído com **HTML, CSS e JavaScript** puro.

## Funcionalidades

- **Quadro de tarefas em 4 colunas (estilo bloquinho de notas):**
  - Colunas organizadas por pessoa, com caixinhas individuais de status: **Para fazer** (vermelho), **Em andamento** (amarelo) e **Concluída** (verde).
  - Tarefas marcadas como **Concluída** recebem efeito riscado para facilitar a visualização do andamento.
  - Adição de novas tarefas em cada coluna e filtros rápidos por status (*Todas*, *Para fazer*, *Em andamento* e *Concluídas*).
  - Espaço discreto e editável no cabeçalho para o slogan da editora.
- **Obras a serem avaliadas:**
  - Seção dedicada com botão **+ Adicionar obra** para criar novos blocos de avaliação.
  - Campos para **Título da obra**, **Curador**, **Link** (com botão **Abrir obra**), **Sinopse** e **Comentários e opinião da equipe**.
- **Layout responsivo:** Adaptado para celulares, tablets e computadores.

## Estrutura de pastas

```text
sarue-livros/
├── index.html
├── css/
│   └── estilo.css
├── js/
│   └── script.js
└── README.md