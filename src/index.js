// UC AI Studio - AI 自動 CREATIVE Prompts
// هر بار خودش یه پرامپت جدید و خاص می‌سازه

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return new Response(
        `🎨 UC AI Studio\n\n` +
        `Bot: ${env.BOT_TOKEN ? '✅' : '❌'} | ` +
        `Chat: ${env.CHAT_ID ? '✅' : '❌'} | ` +
        `AI: ${env.AI ? '✅' : '❌'}\n\n` +
        `/test-image | /generate`
      );
    }

    if (url.pathname === '/test-image') {
      try {
        if (!env.AI) return new Response('❌ AI not connected');
        const res = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
          prompt: 'portrait of a young woman, golden hour lighting, photorealistic',
          width: 512, height: 512, num_steps: 4, seed: 42
        });
        if (res && res.image) {
          return new Response(base64ToBytes(res.image), { headers: { 'Content-Type': 'image/webp' } });
        }
        return new Response('No image');
      } catch (e) {
        return new Response('Error: ' + e.message);
      }
    }

    if (url.pathname === '/generate') {
      try {
        if (!env.AI) return new Response('❌ AI not connected');

        // ۱. LLM پرامپت بسازه
        let prompt = null;
        try {
          prompt = await generatePrompt(env);
        } catch (e) {
          console.error('LLM error:', e);
        }

        if (!prompt) {
          return new Response('Could not generate prompt');
        }

        // ۲. عکس بسازه
        let imgBlob = null;
        try {
          const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
            prompt: prompt,
            width: 768, height: 1024,
            num_steps: 4,
            seed: Math.floor(Math.random() * 999999)
          });
          if (r && r.image) {
            imgBlob = new Blob([base64ToBytes(r.image)], { type: 'image/webp' });
          }
        } catch (e) {
          console.error('Image error:', e);
        }

        // ۳. ارسال به تلگرام
        const caption = `🎨 پرامپت جدید\n\n📝 ${prompt}`;

        if (imgBlob) {
          const fd = new FormData();
          fd.append('chat_id', env.CHAT_ID);
          fd.append('photo', imgBlob, 'ai.webp');
          fd.append('caption', caption);
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
        } else {
          await sendTelegram(caption, env);
        }

        return new Response('Done!\n\nPrompt: ' + prompt);
      } catch (e) {
        return new Response('Error: ' + e.message);
      }
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(event, env) {
    try {
      if (!env.AI) return;

      let prompt = null;
      try { prompt = await generatePrompt(env); } catch (e) {}
      if (!prompt) return;

      let imgBlob = null;
      try {
        const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
          prompt: prompt, width: 768, height: 1024,
          num_steps: 4, seed: Math.floor(Math.random() * 999999)
        });
        if (r && r.image) imgBlob = new Blob([base64ToBytes(r.image)], { type: 'image/webp' });
      } catch (e) {}

      const caption = `🎨 پرامپت جدید\n\n📝 ${prompt}`;

      if (imgBlob) {
        const fd = new FormData();
        fd.append('chat_id', env.CHAT_ID);
        fd.append('photo', imgBlob, 'ai.webp');
        fd.append('caption', caption);
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
      } else {
        await sendTelegram(caption, env);
      }
    } catch (e) { console.error('Cron error:', e); }
  }
};

// ─── LLM خودش پرامپت می‌سازه ───
async function generatePrompt(env) {
  const res = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
    messages: [
      { role: 'system', content: 'You create prompts for AI image generation. Always feature a PERSON as the main subject. Be creative and unique each time. IMPORTANT: Subjects should be young adults (20-35 years old). Skin tones: light to medium (Caucasian, East Asian, Middle Eastern, Latina). NEVER generate: Indian, black/African, elderly, or child subjects. VARY the subject: sometimes a young woman alone, sometimes a young man alone, sometimes a couple (man and woman together). Vary: gender, pose, expression, clothing, hair, setting, lighting, mood, color palette, era, and artistic style. Never repeat the same concept.' },
      { role: 'user', content: 'Create one detailed image prompt featuring a person. Pick randomly: young woman alone, young man alone, or a couple (man+woman). Different style each time - could be portrait, fashion, editorial, lifestyle, fantasy, vintage, modern, cinematic, etc. Include: person description, pose, expression, outfit, lighting, background, mood, colors, camera angle. End with aspect ratio 3:4 or 9:16. Write ONLY the prompt text in English, 50-100 words.' }
    ],
    temperature: 0.95,
    max_tokens: 250
  });

  if (res && res.response) {
    const text = res.response.trim();
    if (text.length > 30) {
      return text;
    }
  }
  return null;
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sendTelegram(text, env) {
  try {
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text: text, disable_web_page_preview: true })
    });
  } catch (e) {}
}
