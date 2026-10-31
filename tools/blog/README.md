# Blog FBE

O blog é HTML estático, pronto para o GitHub Pages existente. Não usa serviços externos, banco de dados nem JavaScript para exibir artigos ou categorias. Os arquivos gerados ficam versionados em `faculdade/blog/`; não é necessário configurar um build no Pages.

## Estrutura

- `content/articles.json`: fonte editorial dos artigos, em ordem de destaque quando as datas forem iguais.
- `templates/page.html`: documento, SEO e assets compartilhados.
- `templates/article.html`: modelo reutilizável com capa, autoria, data, sumário, corpo, cursos e leituras relacionadas.
- `templates/header.html` e `footer.html`: identidade visual extraída da home atual, com links absolutos para a navegação entre seções.
- `../../faculdade/assets/blog/`: estilos e interação do menu de cursos do blog.
- `build.py`: renderiza a home, as quatro categorias e cada artigo; atualiza somente as entradas do blog no sitemap existente.
- `verify.py`: confere geração, URLs, âncoras, imagens, metadados, dados estruturados, menus e sitemap.

## Adicionar um artigo

1. Duplique um objeto em `content/articles.json`.
2. Defina `slug` único com letras minúsculas sem acentos, números e hífens. A URL será `/faculdade/blog/slug/`.
3. Escolha `category`: `graduacao`, `pos-graduacao`, `vida-academica` ou `carreira`.
4. Preencha título, descrição, data real de publicação (`AAAA-MM-DD`), imagem existente e descrição da imagem. Para uma atualização editorial, acrescente `updated` com a data real da alteração.
5. Escreva as seções com `id` único, título e `html`. Este HTML é conteúdo editorial confiável do repositório: use apenas marcação semântica, sem scripts. Os IDs `conteudo`, `neste-artigo`, `formacao-relacionada` e `continue-lendo` são reservados pelo modelo.
6. Em `courses`, use as chaves do mapa `COURSES` em `build.py`. Para vincular outro curso existente, adicione seu caminho e nome nesse mapa. Prefira links contextuais também dentro do texto.
7. Na raiz do repositório, execute:

```sh
python3 tools/blog/build.py
python3 tools/blog/verify.py
```

8. Revise conteúdo, imagens, dados institucionais e datas antes de publicar. Versione os arquivos-fonte e todos os HTMLs/sitemap gerados na mesma branch.

As categorias usam páginas próprias em `/faculdade/blog/categoria/nome/`, com canonical e listagem renderizada. O primeiro artigo é o destaque da home; as datas são ordenadas da mais recente à mais antiga. Alterar um slug já publicado exige um plano explícito de redirecionamento e a revisão dos links; o gerador recusa deixar páginas antigas sem tratamento.

## Verificação e revisão

```sh
# Comparação adicional com a base desta implementação:
python3 tools/blog/verify.py --base 44e0993ca868b8a47715620476630caef1ae18ce
```

Esse modo confirma que as páginas anteriores só receberam a troca do item desativado por um link e que os assets existentes (incluindo os scripts dos formulários) estão idênticos à base. Use esse modo apenas quando esse for o escopo desejado para a comparação.

Na prévia, confira em desktop e celular: menu principal, abertura/fechamento do menu de cursos, seleção de categorias, artigo, sumário, leituras relacionadas e links de graduação/pós. O CTA “Receber informações” encaminha ao formulário já existente; o blog não duplica a integração de envio.

O workflow `Blog FBE` verifica os arquivos gerados e os links nos pull requests. Não realiza deploy. As quatro publicações iniciais são propostas editoriais para revisão institucional no PR; confirme o conteúdo e ajuste suas datas se a publicação ocorrer depois de 31/10/2026. Não há promessas de empregabilidade, preços ou condições de matrícula adicionadas pelo blog.

## SEO

Cada página possui título e descrição próprios, canonical no domínio atual, Open Graph e Twitter Card. Artigos usam `BlogPosting`, com datas e autoria visíveis; listagens usam `Blog`, `CollectionPage` e `ItemList`. Todas têm `BreadcrumbList` e a identidade `CollegeOrUniversity` já usada no site. São nove novas URLs no sitemap referenciado pelo `robots.txt`, que permanece inalterado. A validação local verifica a estrutura e a consistência; não equivale à aprovação de resultados enriquecidos ou à indexação pelo Google.
