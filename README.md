# Sistema de Aplicação de Injetáveis

Interface web para cadastro de pacientes, busca rápida e controle de aplicações no mês.

## Como usar

Abra o `index.html` em um navegador moderno.

## Atualizações do aplicativo

As atualizações são instaladas manualmente pelo instalador do Windows. O aplicativo não verifica nem instala atualizações automaticamente, e alterações no GitHub não publicam instaladores. Para gerar um instalador localmente, execute `npm run build:win` e distribua o arquivo criado em `dist/`.

Por não haver autorização confirmada para redistribuir bulas e os textos derivados, esses dados não são incluídos nos novos instaladores. A consulta de medicamentos precisa de uma fonte de dados licenciada antes de voltar a ser incluída nas novas instalações.

## Orçamento WPP e API Trier

No aplicativo instalado, acesse **Farmácia → Orçamento WPP**. Na primeira utilização, escolha **Configurar Trier**, informe o token de integração emitido pela Trier e salve. O endereço padrão é `https://api-sgf-gateway.triersistemas.com.br/sgfpod1`. O token é criptografado pelo armazenamento seguro do sistema operacional e nunca é incluído no projeto, no instalador ou enviado à interface web.

Depois da configuração, o app carrega os produtos ativos de forma paginada, guarda o catálogo em arquivo local na pasta de dados do usuário e atualiza estoque e produtos novos a cada cinco minutos. Se a Trier ficar indisponível, os produtos salvos continuam disponíveis. A busca consulta código, EAN, nome, estoque, preço de venda, custo e custo médio.

## Recursos

- Dashboard com total de aplicações no mês atual
- Listagem de pacientes cadastrados
- Busca por nome, CPF, e-mail ou celular
- Cadastro de novo paciente com os campos da imagem
- Registro de aplicações com persistência em `localStorage`

## Persistência

Os dados ficam salvos no navegador usando `localStorage`.
