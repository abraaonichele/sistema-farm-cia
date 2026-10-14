# Ativação das ofertas online com Supabase Free

O restante do aplicativo continua usando o Firebase/Firestore existente. O Supabase atende **somente** autenticação dos publicadores, metadados e imagens das ofertas. Não é necessário ativar Firebase Auth, Firebase Storage ou plano Blaze.

## 1. Criar e preparar o projeto gratuito

1. Crie um projeto no Supabase no plano Free.
2. Abra **SQL Editor**, cole todo o conteúdo de `supabase/migrations/202610120001_online_offers.sql` e execute. Se a migração de ofertas já foi aplicada antes, execute novamente a versão atualizada para adicionar os identificadores curtos às publicações existentes e atualizar o cache do schema da API.
3. Em **Authentication > Providers > Email**, mantenha login por e-mail/senha e desative **Allow new users to sign up**. O aplicativo não chama `signUp`, mas desativar essa opção bloqueia cadastros por fora da interface.
4. Em **Authentication > Users**, use **Add user** para criar o primeiro publicador ou **Send invitation** para convidá-lo. Use senha nova e exclusiva: não copie as senhas legadas gravadas no Firestore.

### Recuperação de senha

Em **Authentication > URL Configuration**, use como **Site URL** a página publicada de recuperação:

```text
https://farmaciaofertas.web.app/redefinir-senha
```

Adicione também os redirects permitidos abaixo:

```text
https://farmaciaofertas.web.app/redefinir-senha
https://sistema-injetaveis.web.app/redefinir-senha
http://localhost:3000/**
```

O endereço local é somente para suporte antes do deploy. Inicie a página local antes de abrir o link recebido por e-mail:

```sh
npm run supabase:password-reset
```

A página lê a sessão de recuperação apenas do fragmento da URL, pede que o próprio usuário escolha e confirme a nova senha, chama `updateUser({ password })` e valida a credencial com um novo login. Tokens e senhas não são registrados nem enviados ao servidor local. A alteração afeta somente o Supabase, nunca a senha do Gmail.

A migração cria a tabela `offers`, índices, grants restritos, RLS e o bucket privado `offer-images`. Público anônimo lê somente ofertas ativas/não expiradas e somente as imagens referenciadas por essas ofertas. Cada publicador só lê e altera seus próprios registros e caminhos. Cada publicação tem um identificador público curto, além do identificador interno; links novos usam o nome da oferta e esse token curto, enquanto links antigos continuam funcionando. Ao executar a migração em um banco já usado, os links curtos são preenchidos para as ofertas existentes.

## 2. Inserir somente as chaves públicas

Abra `public-offers/supabase-config.js` e substitua os dois marcadores:

```js
window.SUPABASE_CONFIG = Object.freeze({
  url: "https://SEU-PROJETO.supabase.co",
  anonKey: "SUA_ANON_OU_PUBLISHABLE_KEY_PUBLICA",
});
```

Copie esses valores em **Project Settings > API**. Nunca coloque `service_role`, secret key, senha do banco ou token administrativo no aplicativo. A anon/publishable key é pública e a segurança depende das políticas RLS incluídas na migração.

Esse único arquivo é carregado pelo painel administrativo e pela página pública.

## 3. Validar antes de publicar

1. Inicie o aplicativo, abra **Ofertas online** e conecte o usuário criado no Supabase.
2. Selecione várias imagens ou adicione outras depois; a ordem exibida na prévia é a ordem do link público. Publique uma oferta de teste, abra o link curto com o nome da oferta em `farmaciaofertas.web.app` e confirme a sequência das imagens.
3. Para atualizar uma oferta sem trocar o link, use **Editar oferta** no cartão publicado. Altere título, validade ou folhas e salve; o endereço novo usa somente o identificador curto, que não muda quando o título ou as imagens mudam. Os links antigos que também incluem o título continuam funcionando.
4. Desative a oferta e confirme que o link e os downloads deixam de funcionar.
5. Exclua a oferta e confirme no painel Supabase que o registro e os objetos foram removidos.

O Firebase Hosting publica a página em `farmaciaofertas.web.app` e mantém `sistema-injetaveis.web.app` ativo para links antigos:

```sh
firebase deploy --only hosting --project sistema-injetaveis
```

O deploy usa apenas `public-offers/`. Novos links gerados pelo aplicativo usam `farmaciaofertas.web.app`; links antigos continuam funcionando pelo domínio legado. Atualize o aplicativo instalado para que o gerador passe a usar o novo endereço. Não publique regras de Firestore nem Storage para esta funcionalidade.

## Limites e operação

- O cliente aceita até 12 imagens. JPG/PNG/WEBP de até 15 MB são redimensionados para no máximo 1920 px e convertidos para WEBP de até 4 MB; GIFs preservam animação e são limitados a 3 MB.
- O bucket também rejeita arquivos acima de 4 MB ou com tipo fora de JPG, PNG, WEBP e GIF.
- O plano Free inclui atualmente 1 GB de Storage e 10 GB de banda total/cached; acompanhe o consumo no painel. Projetos gratuitos podem ser pausados por inatividade e precisam ser restaurados pelo responsável.
- A sessão do publicador é persistida pelo SDK Supabase no armazenamento local do aplicativo e pode ser encerrada em **Desconectar publicador**.
- Os IDs públicos têm 192 bits gerados por `crypto.getRandomValues`; não são sequenciais.
