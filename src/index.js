// UC AI Studio - Reference Photo + Creative Prompts
// 📸 عکس بده → 🧠 AI پرامپت بسازه → 🎨 عکس جدید بسازه

const WEBHOOK_PATH = '/webhook';

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
        `AI: ${env.AI ? '✅' : '❌'} | ` +
        `KV: ${env.PHOTO_DB ? '✅' : '❌'}\n\n` +
        `/test-image | /generate`
      );
    }

    if (url.pathname === '/test-image') {
      try {
        if (!env.AI) return new Response('❌ AI not connected');
        const res = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
          prompt: 'portrait of a young woman, golden hour lighting, photorealistic, 3:4',
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

// ─── Webhook Handler ───
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

  // دستورات
  if (text && text.startsWith('/')) {
    const cmd = text.split('@')[0].split(' ')[0].toLowerCase();

    if (cmd === '/start') {
      await send(chatId, `🎨 سلام!

من ربات UC AI Studio هستم.

📌 نحوه استفاده:
۱. یه عکس بفرستید (عکس خودتون یا هرکی)
۲. بگید /generate
۳. AI یه پرامپت خلاقانه می‌سازه
۴. بر اساس عکس شما یه عکس جدید می‌سازه!

📝 هر بار سبک متفاوت:
Y2K, سینمایی, انیمه, رنسانسی, استودیویی و...

💡 فقط عکس رو نگه می‌دارم، هر وقت /generate بزنید عکس جدید می‌سازم!`, env);
      return;
    }

    if (cmd === '/help') {
      await send(chatId, `📖 راهنما:

🔹 عکس بفرستید → ذخیره می‌شه
🔹 /generate → عکس جدید بساز
🔹 /status → وضعیت عکس مرجع
🔹 /clear → حذف عکس مرجع`, env);
      return;
    }

    if (cmd === '/status') {
      const hasPhoto = env.PHOTO_DB ? await env.PHOTO_DB.get('reference_photo') : null;
      if (hasPhoto) {
        await send(chatId, `✅ عکس مرجع ذخیره شده!\n\n/start → عکس جدید\n/generate → ساخت عکس`, env);
      } else {
        await send(chatId, `❌ هنوز عکسی ذخیره نشده!\n\nیه عکس بفرستید.`, env);
      }
      return;
    }

    if (cmd === '/clear') {
      if (env.PHOTO_DB) await env.PHOTO_DB.delete('reference_photo');
      await send(chatId, `✅ عکس مرجع حذف شد.`, env);
      return;
    }
  }

  // عکس → ذخیره
  if (msg.photo) {
    const photo = msg.photo[msg.photo.length - 1];
    if (env.PHOTO_DB) {
      await env.PHOTO_DB.put('reference_photo', photo.file_id);
    }
    await send(chatId, `✅ عکس ذخیره شد!\n\nحالا /generate بزنید تا AI یه عکس جدید با سبک متفاوت بسازه!`, env);
    return;
  }

  // متن معمولی
  if (text) {
    await send(chatId, `💡 برای شروع یه عکس بفرستید!\n\nبعد /generate بزنید.`, env);
  }
}

// ─── ساخت عکس ───
async function runGeneration(env) {
  try {
    if (!env.AI) return new Response('❌ AI not connected');
    if (!env.PHOTO_DB) return new Response('❌ KV not connected');

    // ۱. عکس مرجع
    const fileId = await env.PHOTO_DB.get('reference_photo');
    if (!fileId) {
      await sendTelegram('⚠️ اول یه عکس بفرستید تا ذخیره بشه!\n\nبعد /generate بزنید.', env);
      return new Response('No reference photo');
    }

    // ۲. دانلود عکس
    const photoBuffer = await downloadPhoto(fileId, env);
    if (!photoBuffer) {
      await sendTelegram('❌ خطا در دانلود عکس مرجع', env);
      return new Response('Download error');
    }

    // ۳. پرامپت خلاقانه
    let prompt = null;
    try { prompt = await generateCreativePrompt(env); } catch (e) {}
    if (!prompt) {
      await sendTelegram('❌ خطا در ساخت پرامپت', env);
      return new Response('Prompt error');
    }

    // ۴. عکس جدید (img2img)
    const photoBase64 = bytesToBase64(photoBuffer);
    let newImgBlob = null;

    try {
      const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
        prompt: prompt,
        image: photoBase64,
        width: 768, height: 1024,
        num_steps: 4,
        strength: 0.65,
        seed: Math.floor(Math.random() * 999999)
      });
      if (r && r.image) {
        newImgBlob = new Blob([base64ToBytes(r.image)], { type: 'image/webp' });
      }
    } catch (e) {
      console.error('Image gen error:', e);
    }

    // ۵. ارسال
    if (newImgBlob) {
      const fd = new FormData();
      fd.append('chat_id', env.CHAT_ID);
      fd.append('photo', newImgBlob, 'ai.webp');
      fd.append('caption', `🎨 پرامپت جدید\n\n📝 ${prompt}`);
      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
    } else {
      await sendTelegram(`📝 **پرامپت:**\n${prompt}\n\n❌ عکس ساخته نشد`, env);
    }

    return new Response('Done! Prompt: ' + prompt);
  } catch (e) {
    return new Response('Error: ' + e.message);
  }
}

// ─── LLM پرامپت خلاقانه ───
async function generateCreativePrompt(env) {
  const res = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
    messages: [
      { role: 'system', content: `You create image generation prompts for a reference photo of a person.

RULES:
1. ALWAYS start with: "Use the uploaded photo as the ONLY identity reference. Keep the exact facial features. Photorealistic, high-fidelity face retention. Maintain original face identity."
2. Then describe a creative NEW scene for that SAME person
3. Vary EACH TIME: different outfit, different setting, different lighting, different mood, different era
4. Include: pose, expression, clothing, hair style, background, colors, lighting, camera angle
5. End with aspect ratio 3:4 or 9:16
6. NEVER repeat the same concept

STYLE IDEAS (rotate through these):
- Y2K birthday flash photography, disposable camera aesthetic
- Cinematic moonlight ocean portrait
- Vintage 1970s film in wildflower meadow, golden hour
- Cyberpunk neon Tokyo rooftop at night
- Renaissance oil painting, classical portrait
- Studio portrait with dramatic blue lighting
- Underwater fashion editorial, flowing dress
- Night romantic street photography, city lights
- Dark gothic cathedral, dramatic shadows
- Japanese anime style, golden hour street
- Dreamy ethereal, floating among clouds
- Art deco luxury 1920s glamour
- Minimalist Scandinavian, natural light by window
- Birthday celebration with balloons and cake
- Cinematic close-up, rain drops on face
- Vintage film, coffee shop candid moment` },
      { role: 'user', content: 'Create ONE new unique prompt for the reference photo. Be creative and different each time! 60-100 words. Write ONLY the prompt text.' }
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

// ─── دانلود عکس از تلگرام ───
async function downloadPhoto(fileId, env) {
  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok) return null;

    const fileUrl = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${fileData.result.file_path}`;
    const res = await fetch(fileUrl);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch (e) {
    return null;
  }
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

function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function send(chatId, text, env) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, disable_web_page_preview: true })
  });
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
