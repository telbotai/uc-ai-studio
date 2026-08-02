// UC AI Studio - Final Version
// 🧠 LLM پرامپت → 🎨 FLUX عکس → 📱 تلگرام

const WEBHOOK_PATH = '/webhook';

const MESSAGE_TEMPLATE = `🎨 پرامپت جدید

#پرامپت
📌 این پرامپت برای ویرایش عکسه؛ عکس خودت را با پرامپت زیر به هوش مصنوعی بده تا با عکس خودت یه نمونه شبیه تصویر بالا بسازه

از هوش مصنوعی Gemini و یا ChatGPT و یا Qwen و یا این سایت میتونی استفاده کنی

> __PROMPT_PLACEHOLDER__

Channel: @Uciranir
#برنامه #آموزش #هوش_مصنوعی #اینترنت
#app #ai #Tutorial #Prompt #net`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === WEBHOOK_PATH && request.method === 'POST') {
      return handleWebhook(request, env);
    }
    if (url.pathname === '/setup') return setupWebhook(env);

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
          prompt: 'portrait of a young man, golden hour lighting, photorealistic',
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
      return runGeneration(env);
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
    if (update.message) await handleMessage(update.message, env);
    return new Response('OK');
  } catch (e) {
    return new Response('Error', { status: 500 });
  }
}

// ─── مدیریت پیام‌ها ───
async function handleMessage(msg, env) {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text && text.startsWith('/')) {
    const cmd = text.split('@')[0].split(' ')[0].toLowerCase();

    if (cmd === '/start' || cmd === '/help') {
      await send(chatId, `🎨 سلام!

من UC AI Studio هستم.

📌 /generate → پرامپت + عکس جدید
📌 /test-image → تست عکس

💡 هر بار سبک متفاوت:
Y2K, سینمایی, انیمه, رنسانسی...`, env);
      return;
    }

    if (cmd === '/generate') {
      // مستقیماً عکس بسازه - بدون عکس مرجع
      await runGeneration(env);
      return;
    }
  }

  // هر متنی بفرسته → راهنمایی
  if (text) {
    await send(chatId, `💡 /generate بزنید تا پرامپت و عکس جدید بسازم!`, env);
  }
}

// ─── ساخت پرامپت + عکس ───
async function runGeneration(env) {
  try {
    if (!env.AI) return new Response('❌ AI not connected');

    // ۱. LLM پرامپت بسازه
    let prompt = null;
    try { prompt = await generatePrompt(env); } catch (e) { console.error('LLM error:', e); }
    if (!prompt) {
      await sendTelegram('❌ خطا در ساخت پرامپت', env);
      return new Response('Prompt error');
    }

    // ۲. FLUX عکس بسازه
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

    // ۳. ارسال با فرمت صحیح
    const caption = MESSAGE_TEMPLATE.replace('__PROMPT_PLACEHOLDER__', prompt);

    if (imgBlob) {
      const fd = new FormData();
      fd.append('chat_id', env.CHAT_ID);
      fd.append('photo', imgBlob, 'ai.webp');
      fd.append('caption', caption);
      fd.append('parse_mode', 'Markdown');
      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
    } else {
      await sendTelegram(caption, env);
    }

    return new Response('Done!\n\nPrompt: ' + prompt);
  } catch (e) {
    return new Response('Error: ' + e.message);
  }
}

// ─── LLM پرامپت ───
async function generatePrompt(env) {
  const res = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
    messages: [
      { role: 'system', content: `You create image generation prompts. Each prompt MUST start with:

"Use the uploaded photo as the ONLY identity reference. Keep the exact facial features. Photorealistic, high-fidelity face retention. Maintain original face identity."

Then describe a creative, unique scene. Be poetic and detailed.

RULES:
1. ALWAYS start with the face preservation text above
2. Then describe: the scene, setting, lighting, mood, clothing, pose, expression, colors
3. End with: "Aspect ratio 3:4" or "Aspect ratio 9:16"
4. NEVER repeat the same concept
5. IMPORTANT: Alternate between male and female subjects. About 50% women, 50% men, 10% couples
6. Subjects: young adults (20-35), light-medium skin tones (Caucasian, East Asian, Middle Eastern, Latina)
7. NEVER: Indian, black/African, elderly, or child subjects

STYLE IDEAS (rotate):
- Y2K birthday flash photography, disposable camera
- Cinematic moonlight ocean portrait
- Vintage 1970s film, wildflower meadow, golden hour
- Cyberpunk neon Tokyo rooftop
- Renaissance oil painting
- Studio portrait, dramatic blue lighting
- Underwater fashion editorial
- Night romantic street photography
- Dark gothic cathedral
- Japanese anime golden hour
- Dreamy ethereal, floating in clouds
- Art deco 1920s luxury
- Minimalist Scandinavian, natural light
- Birthday celebration with balloons
- Cinematic rain close-up
- Vintage coffee shop candid` },
      { role: 'user', content: 'Create ONE new unique prompt. Alternate between male and female subjects! Be creative and poetic! 60-100 words. Write ONLY the prompt text.' }
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

// ─── Webhook ───
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
      body: JSON.stringify({ chat_id: chatId, text: text, disable_web_page_preview: true })
    });
  } catch (e) {}
}

async function sendTelegram(text, env) {
  await send(env.CHAT_ID, text, env);
}
