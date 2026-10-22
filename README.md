# Sistema de Aplicação de Injetáveis

Interface web para cadastro de pacientes, busca rápida e controle de aplicações no mês.

## Como usar

Abra o `index.html` em um navegador moderno.

## Atualizações do aplicativo

Depois de concluir uma atualização do aplicativo, execute `npm run build:installers` para gerar os instaladores de Windows (`.exe`) e macOS (`.dmg`) sem confirmação. Os arquivos ficam em `instaladores/windows/` e `instaladores/Macos/`. Cada geração substitui a versão anterior somente depois que a nova é criada com sucesso, mantendo apenas a mais recente por sistema. Para gerar somente um sistema, use `npm run build:win` ou `npm run build:mac`. A geração cria os instaladores locais, mas não atualiza aplicativos que já estão instalados.

Por não haver autorização confirmada para redistribuir bulas e os textos derivados, esses dados não são incluídos nos novos instaladores. A consulta de medicamentos precisa de uma fonte de dados licenciada antes de voltar a ser incluída nas novas instalações.

## Orçamento WPP e API Trier

No aplicativo instalado, acesse **Farmácia → Orçamento WPP**. Na primeira utilização, escolha **Configurar Trier**, informe o token de integração emitido pela Trier e salve. O endereço padrão é `https://api-sgf-gateway.triersistemas.com.br/sgfpod1`. O token é criptografado pelo armazenamento seguro do sistema operacional e nunca é incluído no projeto, no instalador ou enviado à interface web.

Depois da configuração, o app carrega os produtos ativos de forma paginada, guarda o catálogo em arquivo local na pasta de dados do usuário e atualiza estoque e produtos novos a cada cinco minutos. Se a Trier ficar indisponível, os produtos salvos continuam disponíveis. No Orçamento WPP, o EAN/código lido pelo scanner seleciona o produto; uma busca parcial por nome ou princípio ativo abre uma tabela de produtos no formato de consulta do PDV, com apresentação, laboratório, estoque, rentabilidade e preço de venda. Ao selecionar uma linha, são exibidos também preço de custo, código e EAN. A busca por princípio ativo depende de esse dado estar disponível no cadastro retornado pela Trier. O preço final usa o preço com desconto quando a Trier o informa e, caso contrário, usa o preço de venda normal.

No Orçamento WPP do aplicativo desktop, **Enviar orçamento ao PDV** cria o pedido pela [API PDV da Trier](https://api-sgf-doc.triersistemas.com.br/api/lts/pdv/openapi.json) e mostra o número retornado. O pagamento não é concluído pelo aplicativo: a equipe confirma a venda no PDV. Para associar o cliente, informe nome e CPF válido; se ambos forem deixados vazios, o pedido é enviado sem cliente associado. A integração usa o endereço e token Trier já configurados.

No Windows, o aplicativo instalado inicia um serviço local protegido em segundo plano e o configura para iniciar com o sistema. Assim, depois de configurar a Trier uma vez pelo app, também é possível abrir `index.html` no navegador mesmo com a janela do aplicativo fechada. O serviço local fornece somente o catálogo; o token permanece criptografado e não é enviado à página.

## Recursos

- Dashboard com total de aplicações no mês atual
- Listagem de pacientes cadastrados
- Busca por nome, CPF, e-mail ou celular
- Cadastro de novo paciente com os campos da imagem
- Gestão de CashBack por cliente, com créditos separados, filtros de vencimento e mensagem pronta para WhatsApp
- Registro de aplicações com persistência em `localStorage`

## Persistência

Os dados ficam salvos no navegador usando `localStorage`.
