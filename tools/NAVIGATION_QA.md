# Ingresso e abertura do formulário - 31/10/2026

Base: `9fd89fb67bf82254f824eee333069bd850ba2c39`.

## Alterações

- Os CTAs e links de contato dos oito cursos de graduação mantêm `?interesse=...` e deixam de usar `#topo`.
- O JavaScript compartilhado da home normaliza o fragmento legado `#topo` sem perder a query. A normalização cobre carregamento e mudança de fragmento. A abertura sem âncora também reafirma rolagem zero no evento `pageshow`.
- O script alterado tem um novo nome com hash; o arquivo antigo permanece disponível para páginas em cache.
- `/faculdade/ingresso/` reúne as seis modalidades já apresentadas na home, os documentos do processo seletivo, o caminho de atendimento e informações de acesso à pós. A home passa a ter uma chamada para a página independente.
- Os 60 links “Ingresso” de cabeçalhos e rodapés da Faculdade, graduação, pós, blog e nova página usam a URL sem fragmento. O antigo `/faculdade/#ingresso` encaminha à página nova.
- Canonical, Open Graph, dados estruturados e sitemap incluem a página independente.

## Verificações locais

```sh
python3 tools/blog/verify.py
python3 tools/verify_navigation.py --base 9fd89fb67bf82254f824eee333069bd850ba2c39
node --check faculdade/assets/js/home.db81fed56198.js
git diff --cached --check
```

O verificador de navegação confirma os destinos e o contexto dos CTAs nos oito cursos, os 60 links de Ingresso, os assets/SEO/sitemap da página nova e a preservação exata dos formulários anteriores e scripts da integração de envio.

## Navegador

- Os botões de cabeçalho e lateral de cada uma das oito graduações abriram a home com `scrollY = 0` e formação “Graduação”. O contexto de Engenharia de Computação foi confirmado pelo texto visível do formulário.
- No desktop, o início do cartão ficou em aproximadamente 197 px, abaixo do cabeçalho em aproximadamente 141 px.
- Uma navegação antiga para `?interesse=eng-computacao#topo` abriu no topo, removeu o fragmento e preservou “Curso escolhido: Engenharia de Computação”.
- O endereço antigo `#ingresso` encaminhou à página independente.
- O menu da home e o menu móvel da pós abriram a página independente.
- A página nova não apresentou transbordamento horizontal nas larguras de quadro 320, 390, 768 e 1024 px.
- Em quadro móvel de 390 px, o CTA lateral de Engenharia de Computação abriu a home com rolagem zero e curso preservado. O formulário aparece após o texto de abertura no layout móvel, sem ser coberto pelo cabeçalho.

Nenhum lead foi enviado durante os testes.
