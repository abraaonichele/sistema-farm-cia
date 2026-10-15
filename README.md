# Sistema de Aplicação de Injetáveis

Interface web para cadastro de pacientes, busca rápida e controle de aplicações no mês.

## Como usar

Abra o `index.html` em um navegador moderno.

## Atualizações do aplicativo Windows

O aplicativo instalado para Windows pode verificar atualizações em **Minha conta → Verificar atualização**. Ao enviar uma alteração para a branch `main` do GitHub, o workflow `.github/workflows/release-windows.yml` cria automaticamente um instalador e uma versão em Releases; não é necessário anexar arquivos manualmente.

As versões automáticas usam a versão base do `package.json` mais o número da execução do workflow. O repositório e as Releases são públicos para permitir que o aplicativo consulte e baixe atualizações sem credenciais embutidas no programa.

Na configuração do repositório, habilite **Settings → Actions → General → Workflow permissions → Read and write permissions** para que o workflow possa criar Releases.

Por não haver autorização confirmada para redistribuir bulas e os textos derivados, esses dados não são incluídos no repositório público nem nos novos instaladores. A consulta de medicamentos precisa de uma fonte de dados licenciada antes de voltar a ser incluída nas novas instalações.

## Orçamento WPP e API Trier

No aplicativo instalado, acesse **Farmácia → Orçamento WPP**. A integração inicia junto com o aplicativo e atualiza automaticamente os produtos a cada cinco minutos, sem botões de configuração ou atualização na tela operacional. O token provisionado fica criptografado pelo armazenamento seguro do sistema operacional e não é exposto à interface.

Para abrir a mesma página no navegador, sem iniciar o aplicativo desktop, é necessário ter Node.js instalado e iniciar o serviço local:

1. Execute `npm run browser:local:setup` uma vez e informe a URL e o token da Trier. O token é digitado sem aparecer na tela e guardado na pasta de dados do usuário, fora do projeto e da página web.
2. Execute `npm run browser:local` e abra `http://127.0.0.1:4173` no navegador. Não abra `index.html` diretamente como `file://`: navegadores bloqueiam com segurança esse acesso entre origens.
3. Enquanto o serviço local estiver rodando, ele carrega o catálogo completo de produtos ativos, salva uma cópia local e atualiza estoque e produtos novos a cada cinco minutos, mesmo que o navegador esteja fechado. Se a Trier estiver temporariamente indisponível, conserva os últimos dados sincronizados e tenta novamente no próximo ciclo.

O serviço local escuta apenas em `127.0.0.1`; a credencial da Trier permanece no processo local e nunca é enviada ao navegador ou publicada no GitHub. Os dados do catálogo ficam na pasta de dados do usuário e são mantidos entre reinicializações.

A sincronização consulta produtos ativos de forma paginada e carrega código, EAN, estoque, preço de venda, custo e custo médio. Em uma instalação administrada, também é possível provisionar a integração por variáveis de ambiente:

- `TRIER_API_BASE_URL`: endereço base do SGF.
- `TRIER_API_TOKEN`: token Bearer fornecido pela Trier.

Para gerar um instalador privado já provisionado, execute `npm run build:win:private` e envie pela entrada padrão um JSON com `token` e `baseUrl`. A credencial não deve ser colocada no código-fonte nem publicada em uma Release pública. Na primeira abertura, o aplicativo copia o token provisionado para o armazenamento seguro e criptografado do Windows.

## Recursos

- Dashboard com total de aplicações no mês atual
- Listagem de pacientes cadastrados
- Busca por nome, CPF, e-mail ou celular
- Cadastro de novo paciente com os campos da imagem
- Registro de aplicações com persistência em `localStorage`

## Persistência

Os dados ficam salvos no navegador usando `localStorage`.
