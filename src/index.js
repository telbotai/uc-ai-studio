// UC AI Studio - Cloudflare Worker (Fixed)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // صفحه اصلی
    if (url.pathname === '/') {
      let status = '🎨 UC AI Studio\n\n';
      status += `Bot Token: ${env.BOT_TOKEN ? '✅' : '❌'}\n`;
      status += `Chat ID: ${env.CHAT_ID ? '✅' : '❌'}\n`;
      status += `AI: ${env.AI ? '✅' : '❌'}\n\n`;
      status += '/test-prompt | /test-image | /generate';
      return new Response(status, { status: 200 });
    }

    // تست LLM
    if (url.pathname === '/test-prompt') {
      try {
        if (!env.AI) return new Response('❌ AI not connected', { status: 500 });

        const res = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
          messages: [{ role: 'user', content: 'Say hello in 3 words' }],
          max_tokens: 20
        });

        return new Response(JSON.stringify(res, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response('LLM Error: ' + e.message, { status: 500 });
      }
    }

    // تست عکس
    if (url.pathname === '/test-image') {
      try {
        if (!env.AI) return new Response('❌ AI not connected', { status: 500 });

        const res = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
          prompt: 'a beautiful sunset over ocean, golden light',
          width: 512,
          height: 512,
          num_steps: 4,
          seed: 42
        });

        if (res && res.image) {
          const img = Buffer.from(res.image, 'base64');
          return new Response(img, {
            headers: { 'Content-Type': 'image/webp' }
          });
        }
        return new Response('No image returned: ' + JSON.stringify(res), { status: 500 });
      } catch (e) {
        return new Response('Image Error: ' + e.message, { status: 500 });
      }
    }

    // جنریت کامل
    if (url.pathname === '/generate') {
      try {
        // ۱. ساخت پرامپت
        const prompt = await generatePrompt(env);
        if (!prompt) return sendTelegram('❌ خطا', env);

        // ۲. ساخت عکس
        let img = null;
        if (env.AI) {
          try {
            const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
              prompt: prompt.imagePrompt,
              width: 768,
              height: 1024,
              num_steps: 4,
              seed: Math.floor(Math.random() * 999999)
            });
            if (r && r.image) img = Buffer.from(r.image, 'base64');
          } catch (e) {}
        }

        // ۳. ارسال
        if (img) {
          const fd = new FormData();
          fd.append('chat_id', env.CHAT_ID);
          fd.append('photo', new Blob([img], { type: 'image/webp' }), 'ai.webp');
          fd.append('caption', prompt.caption);
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
        } else {
          await sendTelegram(
            `🎨 **${prompt.style}**\n\n📝 ${prompt.imagePrompt}\n\n💬 ${prompt.caption}`,
            env
          );
        }

        return new Response('Done!', { status: 200 });
      } catch (e) {
        return new Response('Error: ' + e.message, { status: 500 });
      }
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(event, env) {
    // cron trigger - generate and send
    try {
      const prompt = await generatePrompt(env);
      if (!prompt) return;

      let img = null;
      if (env.AI) {
        try {
          const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
            prompt: prompt.imagePrompt,
            width: 768,
            height: 1024,
            num_steps: 4,
            seed: Math.floor(Math.random() * 999999)
          });
          if (r && r.image) img = Buffer.from(r.image, 'base64');
        } catch (e) {}
      }

      if (img) {
        const fd = new FormData();
        fd.append('chat_id', env.CHAT_ID);
        fd.append('photo', new Blob([img], { type: 'image/webp' }), 'ai.webp');
        fd.append('caption', prompt.caption);
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
      } else {
        await sendTelegram(
          `🎨 **${prompt.style}**\n\n📝 ${prompt.imagePrompt}\n\n💬 ${prompt.caption}`,
          env
        );
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
      {"imagePrompt":"Ultra-realistic vintage 1970s film photo of young woman in white linen dress sitting in wildflower meadow, golden hour backlighting, 35mm Kodachrome, warm tones, soft bokeh, 3:4","caption":"🌸 عکس رتروی ۷۰ میلادی در دشت گل‌ها","style":"Vintage Film"},
      {"imagePrompt":"Cyberpunk neon Tokyo street night, rain-soaked pavement reflecting pink blue neon, figure in transparent raincoat, glowing umbrella, steam, anamorphic lens, 9:16","caption":"🌃 نئون و باران توکیو","style":"Cyberpunk"},
      {"imagePrompt":"Dreamy Renaissance oil painting, celestial goddess floating in dawn clouds, translucent silk, silver hair with stars, golden light, Caravaggio lighting, 4:5","caption":"✨ الهه آسمانی رنسانسی","style":"Renaissance"}
    ];
    return presets[Math.floor(Math.random() * presets.length)];
  }

  try {
    const res = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [
        { role: 'system', content: 'Generate creative image prompts. Output JSON only: {"imagePrompt":"prompt","caption":"Persian text with emojis","style":"style name"}' },
        { role: 'user', content: 'New unique image prompt. Different each time. 3:4 vertical. JSON only.' }
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
