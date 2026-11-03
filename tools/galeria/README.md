# Galeria FBE Técnico

Galeria em HTML estático, publicada no GitHub Pages já utilizado pelo site. As fotos e os links funcionam sem JavaScript; o script acrescenta ampliação, setas, teclado e deslize no celular.

`albums.json` define os álbuns e a ordem de exibição. Cada álbum tem três imagens independentes: `home_cover` para o card da home, `listing_cover` para o card da página de galerias e `hero` para a imagem maior do post. O primeiro álbum usa respectivamente os arquivos originais `01tecnico.jpeg`, `02tecnico.jpeg` e `03tecnico.jpeg`. As 12 fotos enviadas fazem parte do álbum; `019tecnico.jpeg` foi normalizada para `foto-09.jpeg` na sequência.

Para incluir outro álbum:

1. Crie `tecnico/galeria/slug-do-album/fotos/` e coloque as imagens nessa pasta.
2. Acrescente um objeto em `albums.json`, com slug único, título, categoria, descrição, os três usos de capa e a lista de fotos com arquivo, dimensões e texto alternativo.
3. Na raiz do repositório, execute `python3 tools/galeria/build.py`.
4. Confira a home, a listagem, o post e a ampliação em desktop e celular. Versione fonte, fotos e HTMLs gerados juntos.

O gerador altera apenas a seção delimitada por `FBE_TECNICO_GALERIA_START` / `FBE_TECNICO_GALERIA_END` na home, as páginas de galeria e o sitemap do Técnico. Cabeçalho e rodapé das novas páginas usam as cópias em `templates/`; o CSS base foi extraído da identidade atual do Técnico. Formulários e integrações existentes não são recriados no álbum. Datas, nomes de pessoas e turmas só devem ser incluídos quando confirmados.
