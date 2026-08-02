// UC AI Studio - Final
// 🧠 LLM → 🎨 FLUX → 📱 Telegram

const WEBHOOK_PATH = '/webhook';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === WEBHOOK_PATH && request.method === 'POST') {
      return handleWebhook(request, env);
    }
    if (url.pathname === '/setup') return setupWebhook(env);
    if (url.pathname === '/generate') return runGeneration(env);

    if (url.pathname === '/') {
      let s = '🎨 UC AI Studio\n\n';
      s += `Bot: ${env.BOT_TOKEN ? '✅' : '❌'}\n`;
      s += `Chat: ${env.CHAT_ID ? '✅ (' + env.CHAT_ID + ')' : '❌'}\n`;
      s += `AI: ${env.AI ? '✅' : '❌'}\n\n`;
      s += '/generate | /setup';
      return new Response(s);
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(event, env) {
    await runGeneration(env);
  }
};

// ─── Webhook ───
async function handleWebhook(request, env) {
  try {
    const update = await request.json();
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text;

      if (text === '/start' || text === '/help') {
        await send(chatId, '🎨 /generate بزنید تا پرامپت و عکس جدید بسازم!', env);
      }

      if (text === '/generate') {
        await runGenerationForChat(chatId, env);
      }
    }
    return new Response('OK');
  } catch (e) {
    return new Response('Error', { status: 500 });
  }
}

// ─── ساخت برای چت خاص ───
async function runGenerationForChat(chatId, env) {
  try {
    if (!env.AI) return send(chatId, '❌ AI not connected', env);

    const prompt = await generatePrompt(env);
    if (!prompt) return send(chatId, '❌ خطا در ساخت پرامپت', env);

    let imgBlob = null;
    try {
      const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
        prompt: prompt,
        width: 768, height: 1024,
        num_steps: 4,
        seed: Math.floor(Math.random() * 999999)
      });
      if (r && r.image) imgBlob = new Blob([base64ToBytes(r.image)], { type: 'image/webp' });
    } catch (e) {}

    const caption = `🎨 پرامپت جدید

#پرامپت
📌 این پرامپت برای ویرایش عکسه؛ عکس خودت را با پرامپت زیر به هوش مصنوعی بده تا با عکس خودت یه نمونه شبیه تصویر بالا بسازه

از هوش مصنوعی Gemini و یا ChatGPT و یا Qwen و یا این سایت میتونی استفاده کنی

> ${prompt}

Channel: @Uciranir
#برنامه #آموزش #هوش_مصنوعی #اینترنت
#app #ai #Tutorial #Prompt #net`;

    if (imgBlob) {
      const fd = new FormData();
      fd.append('chat_id', chatId);
      fd.append('photo', imgBlob, 'ai.webp');
      fd.append('caption', caption);
      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
    } else {
      await send(chatId, caption, env);
    }
  } catch (e) {
    await send(chatId, '❌ خطا: ' + e.message, env);
  }
}

// ─── ساخت برای URL ───
async function runGeneration(env) {
  try {
    if (!env.AI) return new Response('❌ AI not connected');
    if (!env.CHAT_ID) return new Response('❌ CHAT_ID not set');
    if (!env.BOT_TOKEN) return new Response('❌ BOT_TOKEN not set');

    const prompt = await generatePrompt(env);
    if (!prompt) return new Response('❌ Prompt error');

    let imgBlob = null;
    try {
      const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
        prompt: prompt,
        width: 768, height: 1024,
        num_steps: 4,
        seed: Math.floor(Math.random() * 999999)
      });
      if (r && r.image) imgBlob = new Blob([base64ToBytes(r.image)], { type: 'image/webp' });
    } catch (e) {}

    const caption = `🎨 پرامپت جدید

#پرامپت
📌 این پرامپت برای ویرایش عکسه؛ عکس خودت را با پرامپت زیر به هوش مصنوعی بده تا با عکس خودت یه نمونه شبیه تصویر بالا بسازه

از هوش مصنوعی Gemini و یا ChatGPT و یا Qwen و یا این سایت میتونی استفاده کنی

> ${prompt}

Channel: @Uciranir
#برنامه #آموزش #هوش_مصنوعی #اینترنت
#app #ai #Tutorial #Prompt #net`;

    // ارسال به تلگرام
    let sent = false;
    if (imgBlob) {
      const fd = new FormData();
      fd.append('chat_id', env.CHAT_ID);
      fd.append('photo', imgBlob, 'ai.webp');
      fd.append('caption', caption);
      const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
      const data = await res.json();
      sent = data.ok;
      if (!sent) return new Response('Telegram error: ' + JSON.stringify(data));
    }

    if (!sent) {
      await send(env.CHAT_ID, caption, env);
    }

    return new Response('Done!\n\nPrompt: ' + prompt);
  } catch (e) {
    return new Response('Error: ' + e.message);
  }
}

// ─── LLM ───
async function generatePrompt(env) {
  const res = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
    messages: [
      { role: 'system', content: `You create image generation prompts. Each prompt MUST start with:

"Use the uploaded photo as the ONLY identity reference. Keep the exact facial features. Photorealistic, high-fidelity face retention. Maintain original face identity."

Then describe a creative scene. Be poetic.

RULES:
1. Start with face preservation text
2. Describe: scene, lighting, mood, clothing, pose, colors
3. End with "Aspect ratio 3:4" or "Aspect ratio 9:16"
4. Alternate 50% women, 50% men, 10% couples
5. Young adults (20-35), light-medium skin
6. NEVER: Indian, black, elderly, child
7. NEVER repeat same concept

Rotate styles: Y2K, cinematic, vintage, cyberpunk, renaissance, studio, underwater, gothic, anime, ethereal, art deco, minimalist, birthday, rain, coffee shop` },
      { role: 'user', content: 'ONE new prompt. Alternate male/female! Creative and poetic! 60-100 words. ONLY the prompt.' }
    ],
    temperature: 0.95,
    max_tokens: 250
  });

  if (res && res.response) {
    const text = res.response.trim();
    if (text.length > 50) return text;
  }
  return null;
}

// ─── Webhook Setup ───
async function setupWebhook(env) {
  const workerUrl = env.WORKER_URL || `https://uc-ai-studio.hadis-vpm-f17.workers.dev`;
  const webhookUrl = `${workerUrl}${WEBHOOK_PATH}`;
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook?url=${webhookUrl}&allowed_updates=["message"]`);
  const data = await res.json();
  return new Response(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/json' } });
}

// ─── Helpers ───
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function send(chatId, text, env) {
  try {
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
  } catch (e) {}
}
