# Sistema de Aplicação de Injetáveis

Interface web para cadastro de pacientes, busca rápida e controle de aplicações no mês.

## Como usar

Abra o `index.html` em um navegador moderno.

## Atualizações do aplicativo Windows

O aplicativo instalado para Windows pode verificar atualizações em **Minha conta → Verificar atualização**. Ao enviar uma alteração para a branch `main` do GitHub, o workflow `.github/workflows/release-windows.yml` cria automaticamente um instalador e uma versão em Releases; não é necessário anexar arquivos manualmente.

As versões automáticas usam a versão base do `package.json` mais o número da execução do workflow. O repositório e as Releases são públicos para permitir que o aplicativo consulte e baixe atualizações sem credenciais embutidas no programa.

Na configuração do repositório, habilite **Settings → Actions → General → Workflow permissions → Read and write permissions** para que o workflow possa criar Releases.

Por não haver autorização confirmada para redistribuir bulas e os textos derivados, esses dados não são incluídos no repositório público nem nos novos instaladores. A consulta de medicamentos precisa de uma fonte de dados licenciada antes de voltar a ser incluída nas novas instalações.

## Recursos

- Dashboard com total de aplicações no mês atual
- Listagem de pacientes cadastrados
- Busca por nome, CPF, e-mail ou celular
- Cadastro de novo paciente com os campos da imagem
- Registro de aplicações com persistência em `localStorage`

## Persistência

Os dados ficam salvos no navegador usando `localStorage`.
