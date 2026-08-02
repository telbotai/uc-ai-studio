// UC AI Studio - Cloudflare Worker
// 🧠 خودکار پرامپت + 🎨 عکس با AI

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/test') return testPrompt(env);
    if (url.pathname === '/generate') return runGeneration(env);
    if (url.pathname === '/health') return new Response('UC AI Studio 🎨', { status: 200 });

    // صفحه اصلی - نمایش وضعیت
    const checks = [];
    checks.push(`🤖 Bot Token: ${env.BOT_TOKEN ? '✅' : '❌'}`);
    checks.push(`💬 Chat ID: ${env.CHAT_ID ? '✅' : '❌'}`);
    checks.push(`🧠 AI: ${env.AI ? '✅' : '❌'}`);
    return new Response(`🎨 UC AI Studio\n\n${checks.join('\n')}\n\n/test | /generate`, { status: 200 });
  },

  async scheduled(event, env) {
    await runGeneration(env);
  }
};

// ─── تولید خودکار ───
async function runGeneration(env) {
  try {
    const promptData = await generateCreativePrompt(env);
    if (!promptData) return sendTelegram('❌ خطا در ساخت پرامپت', env);

    let imageBuffer = null;
    if (env.AI) {
      imageBuffer = await generateImage(promptData.imagePrompt, env);
    }

    if (imageBuffer) {
      await sendImageToTelegram(promptData.caption, imageBuffer, env);
    } else {
      await sendTelegram(
        `🎨 **پرامپت جدید**\n\n` +
        `📝 **پرامپت:**\n${promptData.imagePrompt}\n\n` +
        `💬 **توضیح:**\n${promptData.caption}\n\n` +
        `🏷️ **سبک:** ${promptData.style}`,
        env
      );
    }
    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}

// ─── ساخت پرامپت با LLM ───
async function generateCreativePrompt(env) {
  const systemPrompt = `You are an elite creative director. Generate UNIQUE image prompts for AI generation.

RULES:
1. NEVER repeat concepts
2. Mix styles creatively
3. Include camera, lighting, mood, colors
4. Output ONLY valid JSON

STYLES: Y2K film, cinematic night, anime (Ghibli/Shinkai), family snapshot, romantic candid, birthday flash, studio dramatic lighting, fantasy underwater, vintage 70s/80s, editorial fashion, street (Tokyo/NYC), dark moody, dreamy ethereal, cyberpunk neon, renaissance painting, documentary, surrealist, minimalist, psychedelic, stop-motion

MOODS: romantic, mysterious, nostalgic, energetic, melancholic, joyful, serene, dramatic, whimsical, ethereal, cozy, edgy
SETTINGS: ocean, rooftop, forest, cafe, street, studio, bedroom, rain, snow, sunset, night, dawn, mountains
COLORS: warm golden, cool blue, pastel pink, monochrome, neon, earthy, jewel tones

JSON format:
{"imagePrompt":"detailed prompt...","caption":"short Persian description with emojis","style":"style","mood":"mood"}`;

  const userPrompt = `Generate ONE new unique image prompt. Different style, subject, setting, mood each time. Be creative! Output ONLY JSON.`;

  if (!env.AI) {
    const presets = [
      {"imagePrompt":"Ultra-realistic vintage 1970s film photograph of a young woman with flowing auburn hair sitting in a sun-drenched meadow of wildflowers, wearing a white linen dress, golden hour backlighting, warm earthy tones, 35mm Kodachrome, soft bokeh, nostalgic mood, 3:4","caption":"🌸 پرامپت روز\n\nعکس رتروی ۷۰ میلادی در دشت گل‌ها","style":"Vintage Film","mood":"Nostalgic"},
      {"imagePrompt":"Cyberpunk neon Tokyo street at night, rain-soaked pavement reflecting pink and blue neon signs in Japanese, mysterious figure in transparent raincoat with glowing umbrella, steam rising, anamorphic lens, blade runner aesthetic, 9:16","caption":"🌃 نئون و باران\n\nخیابان نئونی توکیو","style":"Cyberpunk","mood":"Mysterious"},
      {"imagePrompt":"Dreamy Renaissance oil painting of celestial goddess floating among dawn clouds, translucent silk robes, silver hair adorned with stars, golden light rays, deep blue and gold palette, Caravaggio lighting, 4:5","caption":"✨ نقاشی رنسانسی\n\nالهه آسمانی در میان ابرها","style":"Renaissance","mood":"Ethereal"}
    ];
    return presets[Math.floor(Math.random() * presets.length)];
  }

  try {
    const res = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.95,
      max_tokens: 1024
    });

    if (res && res.response) {
      try {
        return JSON.parse(res.response);
      } catch (e) {
        const match = res.response.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      }
    }
  } catch (e) {
    console.error('LLM error:', e);
  }
  return null;
}

// ─── ساخت عکس با FLUX ───
async function generateImage(prompt, env) {
  if (!env.AI) return null;
  try {
    const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt: prompt,
      width: 768,
      height: 1024,
      num_steps: 4,
      guidance: 0,
      seed: Math.floor(Math.random() * 1000000)
    });
    if (result && result.image) {
      return Buffer.from(result.image, 'base64');
    }
  } catch (e) {
    console.error('Image error:', e);
  }
  return null;
}

// ─── تست ───
async function testPrompt(env) {
  try {
    const promptData = await generateCreativePrompt(env);
    if (!promptData) return new Response('Error: null', { status: 500 });
    return new Response(JSON.stringify(promptData, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}

// ─── ارسال عکس ───
async function sendImageToTelegram(caption, imageBuffer, env) {
  try {
    const formData = new FormData();
    formData.append('chat_id', env.CHAT_ID);
    formData.append('photo', new Blob([imageBuffer], { type: 'image/webp' }), 'ai.webp');
    formData.append('caption', caption);
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData });
  } catch (e) {
    await sendTelegram(caption, env);
  }
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
