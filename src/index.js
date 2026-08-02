// UC AI Studio - Cloudflare Worker
// 🧠 خودکار پرامپت خلاقانه می‌سازه + عکس تولید می‌کنه + توی تلگرام می‌فرسته

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/generate') return runGeneration(env);
    if (url.pathname === '/test') return testPrompt(env);
    if (url.pathname === '/health') return new Response('UC AI Studio 🎨', { status: 200 });
    return new Response('UC AI Studio - Waiting for cron', { status: 200 });
  },

  async scheduled(event, env) {
    await runGeneration(env);
  }
};

// ─── تولید خودکار ───
async function runGeneration(env) {
  try {
    // ۱. ساخت پرامپت خلاقانه
    const promptData = await generateCreativePrompt(env);
    if (!promptData) {
      return sendTelegram('❌ خطا در ساخت پرامپت', env);
    }

    // ۲. ساخت عکس با پرامپت
    const imageResult = await generateImage(promptData.imagePrompt, env);

    // ۳. ارسال به تلگرام
    if (imageResult) {
      await sendImageToTelegram(promptData.caption, imageResult, env);
    } else {
      await sendTelegram(
        `🎨 **پرامپت روز**\n\n` +
        `📝 **پرامپت:**\n${promptData.imagePrompt}\n\n` +
        `💬 **توضیح:**\n${promptData.caption}\n\n` +
        `🏷️ **سبک:** ${promptData.style}`,
        env
      );
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    console.error('Generation error:', e);
    return new Response('Error: ' + e.message, { status: 500 });
  }
}

// ─── ساخت پرامپت خلاقانه با LLM ───
async function generateCreativePrompt(env) {
  const systemPrompt = `You are an elite creative director and AI image prompt engineer. Your job is to generate UNIQUE, breathtaking image prompts for AI image generation.

RULES:
1. NEVER repeat the same concept twice. Track variety in subjects, moods, settings, lighting, and eras.
2. Each prompt must be different from the last ones.
3. Mix styles creatively - don't just stick to one category.
4. Make prompts detailed enough for photorealistic generation.
5. Include camera angle, lighting, mood, color palette, and atmosphere.
6. Always include aspect ratio at the end.

STYLE CATEGORIES TO DRAW FROM (mix and match!):
1. Y2K disposable film flash photography
2. Cinematic ocean/night portraits  
3. Japanese anime (Makoto Shinkai / Studio Ghibli)
4. Cozy family snapshots (early 2000s)
5. Night candid romantic photography
6. Birthday celebration flash photography
7. Studio portraits with dramatic colored lighting
8. Fantasy/cinematic underwater scenes
9. Vintage 70s/80s film photography
10. Editorial high fashion
11. Street photography (Tokyo, NYC, Paris)
12. Dark moody aesthetic
13. Dreamy ethereal soft focus
14. Cyberpunk neon city
15. Renaissance painting style
16. Documentary/national geographic
17. Surrealist art (Dali-like)
18. Minimalist Scandinavian
19. Psychedelic/abstract
20. Stop-motion animation style

MOODS: romantic, mysterious, nostalgic, energetic, melancholic, joyful, serene, dramatic, whimsical, melancholic, ethereal
SETTINGS: ocean, rooftop, forest, cafe, street, studio, bedroom, rain, snow, sunset, night, dawn
SUBJECTS: young woman, young man, elderly person, child, group, silhouette, hands only, back view
COLOR PALETTES: warm golden, cool blue, pastel pink, monochrome, neon, earthy tones, jewel tones

OUTPUT FORMAT (respond ONLY with valid JSON):
{
  "imagePrompt": "detailed prompt for image generation...",
  "caption": "short catchy description in Persian for Telegram post (2-3 lines with emojis)",
  "style": "style category name",
  "mood": "mood name"
}`;

  const userPrompt = `Generate a completely new, unique image prompt. 

Previous prompts to AVOID repeating:
- Y2K birthday flash photography
- Japanese anime golden hour street scene
- Cinematic ocean night portrait
- Studio portrait with blue lighting

Choose a DIFFERENT style, subject, setting, mood, and color palette from what's listed above. Be creative and surprise me!

Output ONLY valid JSON.`;

  const res = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.95,
    max_tokens: 1024,
    response_format: { type: 'json_object' }
  });

  if (res && res.response) {
    try {
      return JSON.parse(res.response);
    } catch (e) {
      // Try to extract JSON from response
      const match = res.response.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    }
  }

  return null;
}

// ─── ساخت عکس با FLUX (Cloudflare Workers AI) ───
async function generateImage(prompt, env) {
  try {
    const result = await env.AI.run(
      '@cf/black-forest-labs/FLUX-1-schnell',
      {
        prompt: prompt,
        width: 768,
        height: 1024, // 3:4 vertical
        num_steps: 4,
        guidance: 0,
        seed: Math.floor(Math.random() * 1000000)
      }
    );

    // Cloudflare returns base64 image
    if (result && result.image) {
      return Buffer.from(result.image, 'base64');
    }

    return null;
  } catch (e) {
    console.error('Image generation error:', e);
    return null;
  }
}

// ─── ارسال عکس به تلگرام ───
async function sendImageToTelegram(caption, imageBuffer, env) {
  try {
    const formData = new FormData();
    formData.append('chat_id', env.CHAT_ID || env.TELEGRAM_CHANNEL);
    formData.append('photo', new Blob([imageBuffer], { type: 'image/webp' }), 'ai_studio.webp');
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
  } catch (e) {
    console.error('Send image error:', e);
    // Fallback: send as text
    await sendTelegram(caption, env);
  }
}

// ─── ارسال متن به تلگرام ───
async function sendTelegram(text, env) {
  try {
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.CHAT_ID || env.TELEGRAM_CHANNEL,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
  } catch (e) {
    console.error('Send message error:', e);
  }
}

// ─── تست پرامپت (بدون ساخت عکس) ───
async function testPrompt(env) {
  const promptData = await generateCreativePrompt(env);
  if (!promptData) {
    return new Response('Error generating prompt', { status: 500 });
  }
  return new Response(JSON.stringify(promptData, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
