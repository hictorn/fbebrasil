# Colégio FBE

O Colégio é publicado como HTML estático no GitHub Pages existente. Cada página
tem sua pasta e `index.html`, conteúdo visível sem JavaScript, links navegáveis,
título, descrição, URL canônica e dados estruturados próprios.

## Editar e publicar

- `pages.json`: caminhos públicos, metadados e seletores antigos de URL.
- `content/*.html`: conteúdo de cada página, incluindo os formulários originais.
- `templates/site.html` e `templates/mural.html`: cabeçalhos e rodapés existentes.
- `templates/*.css`: estilos originais, incluindo todas as regras responsivas.
- `templates/site.js`: galerias, laboratórios, formulários, menus e notícias.
- `templates/legacy.js`: compatibilidade com os links antigos.

Depois de editar as fontes, execute da raiz do repositório:

```sh
python3 tools/colegio/build.py
python3 tools/colegio/verify.py
python3 tools/blog/verify.py
python3 tools/verify_navigation.py
```

Python 3.12 e Node.js 22 são suficientes, sem instalação de pacotes. Comite as
fontes e os arquivos gerados. A publicação continua pelo `main`, na hospedagem
atual; não há servidor novo nem configuração adicional de domínio.

## Estrutura de URLs

Os principais caminhos ficam em `/colegio/admissao/`,
`/colegio/ensino-fundamental-ii/`, `/colegio/ensino-medio/`,
`/colegio/proposta-pedagogica/`, `/colegio/estrutura/`,
`/colegio/dependencia/`, `/colegio/sae-digital/`, `/colegio/laboratorios/`,
`/colegio/localizacao/`, `/colegio/atividades-esportivas/`,
`/colegio/preparacao-enem/` e `/colegio/galeria/`.

O Mural fica em `/colegio/mural/`, com uma pasta para cada publicação. As fotos
existentes permanecem nos mesmos endereços, incluindo as fotos do Sarau.

O gerador cria `/colegio/sitemap.xml`, anunciado também no `robots.txt`.
As quatro notícias da home mantêm a sincronização com os primeiros cards do
Mural, lendo agora os links HTML das publicações.

## Compatibilidade e integrações

Links como `/colegio/?pagina=admissao` e
`/colegio/mural/?post=sarau-2026-samba` encaminham para os novos caminhos.
A rotina remove apenas o seletor antigo; UTMs, `fbclid`, `gclid` e âncoras
continuam no endereço. Aberturas explícitas de `index.html` também são
normalizadas. Seletores desconhecidos não geram redirecionamento.

No GitHub Pages, a compatibilidade dos parâmetros é feita no navegador por
`location.replace`, e não por um HTTP 301. Os novos caminhos respondem com
HTML próprio, sem depender desse encaminhamento ou de JavaScript. Um 301
HTTP para os parâmetros exigiria uma regra na camada de hospedagem/proxy.

O Google Analytics e o EmailJS conservam suas configurações existentes.
Não altere os nomes dos campos ou identificadores de serviço/template ao
editar o visual dos formulários. A verificação nunca envia pré-inscrições.

Para conferir a preservação dos formulários, estilos e integração contra
uma revisão anterior à migração:

```sh
python3 tools/colegio/verify.py --base ad7a156e05112fd517d846b2fdf01b098cbb4e69
```
