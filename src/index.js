// UC AI Studio - Cloudflare Worker
// 🧠 LLM + 🎨 Image Gen + 📱 Telegram

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return new Response(
        `🎨 UC AI Studio\n\n` +
        `Bot: ${env.BOT_TOKEN ? '✅' : '❌'} | ` +
        `Chat: ${env.CHAT_ID ? '✅' : '❌'} | ` +
        `AI: ${env.AI ? '✅' : '❌'}\n\n` +
        `/test-prompt | /test-image | /generate`
      );
    }

    if (url.pathname === '/test-prompt') {
      try {
        if (!env.AI) return new Response('❌ AI not connected');
        const res = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
          messages: [{ role: 'user', content: 'Say hello in 3 words' }],
          max_tokens: 20
        });
        return new Response(JSON.stringify(res, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response('Error: ' + e.message);
      }
    }

    if (url.pathname === '/test-image') {
      try {
        if (!env.AI) return new Response('❌ AI not connected');
        const res = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
          prompt: 'a beautiful sunset over ocean, golden light, photorealistic',
          width: 512,
          height: 512,
          num_steps: 4,
          seed: 42
        });
        if (res && res.image) {
          // Cloudflare Workers: base64 -> Uint8Array -> Blob
          const binary = atob(res.image);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return new Response(bytes, {
            headers: { 'Content-Type': 'image/webp' }
          });
        }
        return new Response('No image: ' + JSON.stringify(res));
      } catch (e) {
        return new Response('Error: ' + e.message);
      }
    }

    if (url.pathname === '/generate') {
      try {
        // ۱. پرامپت
        const prompt = await generatePrompt(env);
        if (!prompt) {
          await sendTelegram('❌ خطا در ساخت پرامپت', env);
          return new Response('Prompt error');
        }

        // ۲. عکس
        let imgBlob = null;
        if (env.AI) {
          try {
            const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
              prompt: prompt.imagePrompt,
              width: 768,
              height: 1024,
              num_steps: 4,
              seed: Math.floor(Math.random() * 999999)
            });
            if (r && r.image) {
              const binary = atob(r.image);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              imgBlob = new Blob([bytes], { type: 'image/webp' });
            }
          } catch (e) {
            console.error('Image error:', e);
          }
        }

        // ۳. ارسال
        if (imgBlob) {
          const fd = new FormData();
          fd.append('chat_id', env.CHAT_ID);
          fd.append('photo', imgBlob, 'ai.webp');
          fd.append('caption', prompt.caption);
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, {
            method: 'POST', body: fd
          });
        } else {
          await sendTelegram(
            `🎨 **${prompt.style}**\n\n📝 ${prompt.imagePrompt}\n\n💬 ${prompt.caption}`,
            env
          );
        }
        return new Response('Done!');
      } catch (e) {
        return new Response('Error: ' + e.message);
      }
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(event, env) {
    try {
      const prompt = await generatePrompt(env);
      if (!prompt) return;

      let imgBlob = null;
      if (env.AI) {
        try {
          const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
            prompt: prompt.imagePrompt,
            width: 768, height: 1024,
            num_steps: 4,
            seed: Math.floor(Math.random() * 999999)
          });
          if (r && r.image) {
            const binary = atob(r.image);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            imgBlob = new Blob([bytes], { type: 'image/webp' });
          }
        } catch (e) {}
      }

      if (imgBlob) {
        const fd = new FormData();
        fd.append('chat_id', env.CHAT_ID);
        fd.append('photo', imgBlob, 'ai.webp');
        fd.append('caption', prompt.caption);
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
      } else {
        await sendTelegram(`🎨 **${prompt.style}**\n\n📝 ${prompt.imagePrompt}\n\n💬 ${prompt.caption}`, env);
      }
    } catch (e) {
      console.error('Cron error:', e);
    }
  }
};

// ─── ساخت پرامپت ───
async function generatePrompt(env) {
  if (!env.AI) {
    const presets = [
      {"imagePrompt":"Ultra-realistic vintage 1970s film photo of young woman in white linen dress in wildflower meadow, golden hour, 35mm Kodachrome, warm tones, 3:4","caption":"🌸 عکس رتروی ۷۰ میلادی","style":"Vintage Film"},
      {"imagePrompt":"Cyberpunk neon Tokyo night, rain-soaked street, pink blue neon reflections, figure in raincoat, anamorphic lens, 9:16","caption":"🌃 نئون و باران توکیو","style":"Cyberpunk"},
      {"imagePrompt":"Dreamy Renaissance painting, goddess in dawn clouds, silver hair with stars, golden light, 4:5","caption":"✨ الهه رنسانسی","style":"Renaissance"}
    ];
    return presets[Math.floor(Math.random() * presets.length)];
  }

  try {
    const res = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [
        { role: 'system', content: 'Generate image prompts. Output JSON: {"imagePrompt":"detailed prompt","caption":"Persian with emojis","style":"style"}' },
        { role: 'user', content: 'One new unique creative image prompt. Vertical 3:4. JSON only.' }
      ],
      temperature: 0.95,
      max_tokens: 512
    });
    if (res && res.response) {
      const match = res.response.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    }
  } catch (e) {
    console.error('Prompt error:', e);
  }
  return null;
}

// ─── ارسال متن ───
async function sendTelegram(text, env) {
  try {
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text: text, parse_mode: 'Markdown', disable_web_page_preview: true })
    });
  } catch (e) {}
}
