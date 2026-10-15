# Sistema de Aplicação de Injetáveis

Interface web para cadastro de pacientes, busca rápida e controle de aplicações no mês.

## Como usar

Abra o `index.html` em um navegador moderno.

## Atualizações do aplicativo

As atualizações são instaladas manualmente pelo instalador do Windows. Não há verificação ou instalação automática dentro do aplicativo, nem publicação automática de versões ao enviar alterações ao GitHub. Para gerar o instalador localmente, execute `npm run build:win` e distribua o arquivo criado em `dist/`.

Por não haver autorização confirmada para redistribuir bulas e os textos derivados, esses dados não são incluídos no repositório público nem nos novos instaladores. A consulta de medicamentos precisa de uma fonte de dados licenciada antes de voltar a ser incluída nas novas instalações.

## Orçamento WPP e API Trier

No aplicativo instalado, acesse **Farmácia → Orçamento WPP**. A integração inicia junto com o aplicativo e atualiza automaticamente os produtos a cada cinco minutos, sem botões de configuração ou atualização na tela operacional. O token provisionado fica criptografado pelo armazenamento seguro do sistema operacional e não é exposto à interface.

O aplicativo instalado mantém o token protegido pelo armazenamento seguro do sistema operacional e atualiza o catálogo automaticamente a cada cinco minutos. A sincronização consulta produtos ativos de forma paginada e carrega código, EAN, estoque, preço de venda, custo e custo médio. Em uma instalação administrada, também é possível provisionar a integração por variáveis de ambiente:

- `TRIER_API_BASE_URL`: endereço base do SGF.
- `TRIER_API_TOKEN`: token Bearer fornecido pela Trier.

Para gerar um instalador privado já provisionado, execute `npm run build:win:private` e envie pela entrada padrão um JSON com `token` e `baseUrl`. A credencial não deve ser colocada no código-fonte. Na primeira abertura, o aplicativo copia o token provisionado para o armazenamento seguro e criptografado do Windows.

## Recursos

- Dashboard com total de aplicações no mês atual
- Listagem de pacientes cadastrados
- Busca por nome, CPF, e-mail ou celular
- Cadastro de novo paciente com os campos da imagem
- Registro de aplicações com persistência em `localStorage`

## Persistência

Os dados ficam salvos no navegador usando `localStorage`.
