#!/usr/bin/env node
/**
 * A IMAGEM DE COMPARTILHAMENTO — `public/og.png`, 1200×630.
 *
 * Por que existe: até 01/09/2026 o site não declarava `og:image` nenhuma.
 * Todo link da Aliviar colado no WhatsApp, num e-mail ou numa rede saía como
 * um retângulo cinza com o título em texto — e o WhatsApp é justamente por
 * onde o Supervisor passou a atender (ADR-111). O primeiro contato visual de
 * quem recebe o convite era um vazio.
 *
 * Por que um PNG estático, e não `ImageResponse` do Next: o robô do WhatsApp
 * busca a imagem uma vez, com pressa, e desiste rápido. Arquivo pronto no
 * `public/` é servido pelo CDN sem nenhuma execução no meio. Gerar em tempo
 * de requisição troca um arquivo de 100kB por uma aposta.
 *
 * A cena é a mesma da home — foto da recepção, cartão de vidro à esquerda,
 * a frase que a página já diz. Quem clica no link encontra o que viu.
 *
 * Escreve só se o conteúdo mudou, como os geradores de PDF desta casa, para
 * o `git status` não sujar a cada execução.
 *
 *   node scripts/gerar-og-image.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const RAIZ = resolve(import.meta.dirname, "..");
const SAIDA = resolve(RAIZ, "public/og.jpg");

const LARGURA = 1200;
const ALTURA = 630;

// JPEG, não PNG: a mesma cena saía com 810kB em PNG, e o robô que monta a
// prévia do WhatsApp desiste de imagem grande. Foto comprime bem — o texto
// é grande o bastante para não sofrer com o artefato.
const QUALIDADE = 82;

// Embutidas como data: URI — o Chromium desta execução não tem servidor
// nenhum de onde buscar `/landing/...`, e file:// com caminho absoluto
// quebraria em outra máquina.
const embutir = (caminho, tipo) =>
  `data:${tipo};base64,${readFileSync(resolve(RAIZ, caminho)).toString("base64")}`;

const cena = embutir("public/landing/v2/recepcao-desktop.jpg", "image/jpeg");

const PAGINA = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;500&display=block" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${LARGURA}px; height: ${ALTURA}px; overflow: hidden;
         font-family: Inter, system-ui, sans-serif; background: #faf8f4; }
  .cena { position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: 62% center; }
  /* Véu quente à esquerda: garante o contraste do texto sobre a foto sem
     apagar a cena do lado direito. */
  .veu { position: absolute; inset: 0;
         background: linear-gradient(100deg,
           rgba(250,248,244,0.985) 0%, rgba(250,248,244,0.975) 44%,
           rgba(250,248,244,0.72) 56%, rgba(250,248,244,0) 72%); }
  .cartao { position: absolute; left: 76px; top: 50%; transform: translateY(-50%);
            width: 560px; }
  /* Sem logotipo aqui: a própria cena já traz a marca na parede do fundo, e
     duas Aliviar na mesma imagem competem entre si. Fica a sobrancelha. */
  .sobrancelha { font-size: 17px; letter-spacing: 0.3em; text-transform: uppercase;
                 color: #123b67; font-weight: 500; margin-bottom: 30px; }
  h1 { font-family: Fraunces, Georgia, serif; font-weight: 400; font-size: 53px;
       line-height: 1.1; color: #232b31; letter-spacing: -0.015em; }
  h1 .segunda { display: block; margin-top: 12px; color: #123b67; }
  p { margin-top: 28px; font-size: 23px; line-height: 1.5; color: #4a5158; }
  .fio { margin-top: 30px; width: 88px; height: 3px; background: #123b67; opacity: 0.85; }
</style></head>
<body>
  <img class="cena" src="${cena}" alt="">
  <div class="veu"></div>
  <div class="cartao">
    <div class="sobrancelha">Aliviar · Curadoria Médica</div>
    <h1>Uma decisão de saúde<br>importante.
      <span class="segunda">Você não precisa<br>tomá-la sozinho.</span></h1>
    <p>A gente escuta, compara os profissionais<br>e explica três caminhos. Quem escolhe é você.</p>
    <div class="fio"></div>
  </div>
</body></html>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({
  viewport: { width: LARGURA, height: ALTURA },
  deviceScaleFactor: 1,
});
await pagina.setContent(PAGINA, { waitUntil: "networkidle" });
await pagina.evaluate(() => document.fonts.ready);
await pagina.waitForTimeout(400);
const imagem = await pagina.screenshot({ type: "jpeg", quality: QUALIDADE });
await navegador.close();

const anterior = existsSync(SAIDA) ? readFileSync(SAIDA) : null;
if (anterior && anterior.equals(imagem)) {
  console.log(`  = public/og.jpg — sem mudança (${imagem.length} bytes)`);
} else {
  writeFileSync(SAIDA, imagem);
  console.log(`  ✓ public/og.jpg — ${LARGURA}×${ALTURA}, ${Math.round(imagem.length / 1024)} kB`);
}
