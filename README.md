# Vitrine Digital V2 — Samsung + TCL / Multiplataforma

Baseada diretamente na Vitrine Digital V1.

## Objetivo
Player web de sinalização digital preparado para TVs Samsung/Tizen e TVs TCL/Android/Google TV, além de navegador comum e TV Box/mini PC.

A Samsung oferece engine web HTML5/Chromium nas gerações atuais e suporte a vídeo HTML5, Fetch, WebSocket e armazenamento offline; por isso a V2 mantém o player em HTML/CSS/JS e evita dependências de navegador modernas desnecessárias. [Samsung Developer](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html)

## Estrutura
- `admin/` — painel de gerenciamento
- `player/` — player da TV
- `js/player.js` — lógica multiplataforma
- `css/player.css` — tela cheia, 16:9 e modo retrato
- `supabase/` — banco e políticas

## Teste rápido
1. Publique no GitHub Pages.
2. Abra no navegador da TV:
   `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/player/?code=TV-0001`
3. Para teste local sem Supabase, o player entra em modo demonstração.
4. Com Supabase configurado, ele identifica a TV pelo código e busca a playlist.

## Samsung
O player usa HTML5 `<video>`, `autoplay`, `muted` e `playsinline`, recursos documentados pela Samsung para Smart TVs. Para modelos muito antigos, a compatibilidade depende da geração do Tizen/Web engine.

Para uso profissional em Samsung Signage, a V2 pode evoluir depois para um app Tizen nativo, aproveitando APIs de controle do dispositivo. Isso é uma etapa separada da versão web.

## TCL
A V2 foi desenhada para funcionar no navegador de TVs TCL/Google TV/Android TV. Quando o modelo não tiver navegador adequado ou tiver limitações de autoplay, recomenda-se TV Box/mini PC com Chrome/Chromium.

## Segurança
A V1/V2 ainda usa a política anônima de heartbeat para facilitar o primeiro teste. Antes de vender o serviço para vários clientes, substituir por autenticação de dispositivo/token e RLS restritivo.


## V2 — orientação vertical/horizontal

Cada tela pode usar uma orientação própria:
- `landscape` = horizontal 16:9
- `portrait` = vertical 9:16

No painel, ao cadastrar uma tela, escolha **Horizontal (16:9)** ou **Vertical (9:16)**.

Para um teste rápido sem banco:
- Horizontal: `player/?code=TV-0001&orientation=landscape`
- Vertical: `player/?code=TV-0001&orientation=portrait`

Com Supabase, a orientação da tabela `screens.orientation` é aplicada automaticamente pelo player.


## V2.2 — rota vertical direta
Para testar o modo vertical sem depender do parâmetro da URL, use:
`/player/portrait/?code=TV-0001`
A rota normal `/player/?code=TV-0001` continua sendo a versão horizontal.
