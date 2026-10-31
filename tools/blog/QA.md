# Validação - Blog FBE

Base inspecionada: `44e0993ca868b8a47715620476630caef1ae18ce` (`main`).
Data: 31/10/2026. As alterações são destinadas à branch de revisão, sem merge ou publicação.

## Verificações automatizadas locais

Comandos executados com sucesso:

```sh
python3 tools/blog/build.py --check
python3 tools/blog/verify.py --base 44e0993ca868b8a47715620476630caef1ae18ce
node --check faculdade/assets/blog/blog.js
git diff --check
```

- Nove páginas geradas: home, quatro categorias e quatro artigos.
- 569 referências locais verificadas, incluindo links, âncoras e assets.
- Canonical, títulos únicos, descrições, Open Graph, Twitter Card, idioma, um H1 por página, IDs únicos e JSON-LD consistentes.
- Nove novas entradas no sitemap, sem duplicatas e sem remoção de URLs anteriores. `robots.txt` preservado.
- Link do blog presente nos 29 menus (20 anteriores e nove novos).
- Comparação exata das 20 páginas anteriores: somente a troca de `<span class="nav-disabled">Blog FBE</span>` por `<a href="/faculdade/blog/">Blog FBE</a>`.
- Formulários, dados, scripts e todos os assets anteriores preservados byte a byte.

## Navegador

Prévia estática local, usando o mesmo HTML e os mesmos caminhos absolutos que serão servidos no GitHub Pages.

- Inspeção visual do blog e artigo no desktop.
- Home, categoria de pós e artigo de pós renderizados em quadros responsivos de 320, 390, 768 e 1024 px. Nenhum elemento principal medido ultrapassou a largura do quadro; não houve rolagem horizontal. A largura útil é menor que a do quadro por causa da barra de rolagem do navegador.
- Imagens do blog carregadas no quadro móvel de 390 px.
- Categoria de pós → artigo de pós.
- Sumário → seção correta, com título abaixo do cabeçalho fixo após a rolagem.
- Menu móvel do blog: abrir, expandir Cursos e fechar por Escape.
- Menu móvel da home da Faculdade → Blog FBE.
- Menu móvel da pós-graduação → Blog FBE.
- Blog → artigo → “Receber informações” → formulário original visível na home.

Não foram enviados leads de teste. A proteção dos formulários foi verificada por comparação exata dos arquivos e pela navegação até o formulário. A validação de dados estruturados é local; não foi submetida ao teste externo de resultados enriquecidos nem ao Search Console.

## Revisão antes do merge

Revisar os quatro textos iniciais como conteúdo institucional, confirmar autoria “Equipe FBE” e ajustar datas à publicação efetiva. O workflow adicionado ao PR valida os arquivos; não publica o site. O deploy continua dependente do fluxo existente e de um merge posterior na `main`.
