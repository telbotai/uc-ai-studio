// UC AI Studio - Cloudflare Worker
// 🧠 خودکار پرامپت خلاقانه می‌سازه + عکس تولید می‌کنه

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/test') return testPrompt(env);
    if (url.pathname === '/generate') return runGeneration(env);
    if (url.pathname === '/health') return new Response('UC AI Studio 🎨', { status: 200 });

    // صفحه اصلی
    const checks = [];
    checks.push(`🤖 Bot Token: ${env.BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
    checks.push(`💬 Chat ID: ${env.CHAT_ID ? '✅ Set' : '❌ Missing'}`);
    checks.push(`🧠 AI Binding: ${env.AI ? '✅ Connected' : '❌ Not connected'}`);

    return new Response(
      `🎨 UC AI Studio\n\n${checks.join('\n')}\n\nEndpoints:\n/test - Test prompt generation\n/generate - Generate prompt + image`,
      { status: 200 }
    );
  },

  async scheduled(event, env) {
    await runGeneration(env);
  }
};

// ─── تولید خودکار ───
async function runGeneration(env) {
  try {
    // ۱. ساخت پرامپت
    const promptData = await generateCreativePrompt(env);
    if (!promptData) {
      return sendTelegram('❌ خطا در ساخت پرامپت', env);
    }

    // ۲. ساخت عکس (اگه AI وصل باشه)
    let imageBuffer = null;
    if (env.AI) {
      imageBuffer = await generateImage(promptData.imagePrompt, env);
    }

    // ۳. ارسال به تلگرام
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

    return new Response('Generated!', { status: 200 });
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}

// ─── ساخت پرامپت خلاقانه ───
async function generateCreativePrompt(env) {
  const systemPrompt = `You are an elite creative director and AI image prompt engineer. Generate UNIQUE, breathtaking prompts for AI image generation.

RULES:
1. NEVER repeat the same concept
2. Each prompt must be DIFFERENT
3. Mix styles creatively
4. Include camera angle, lighting, mood, color palette
5. Include aspect ratio (usually 3:4 vertical or 9:16)

STYLE CATEGORIES (pick one and mix):
1. Y2K disposable film flash photography
2. Cinematic ocean/night portraits  
3. Japanese anime (Makoto Shinkai / Ghibli)
4. Cozy family snapshots (early 2000s)
5. Night candid romantic
6. Birthday celebration flash
7. Studio portraits dramatic lighting
8. Fantasy underwater/cinematic
9. Vintage 70s/80s film
10. Editorial high fashion
11. Street photography (Tokyo/NYC/Paris)
12. Dark moody aesthetic
13. Dreamy ethereal soft focus
14. Cyberpunk neon city
15. Renaissance painting
16. Documentary/national geographic
17. Surrealist (Dali-like)
18. Minimalist Scandinavian
19. Psychedelic/abstract
20. Stop-motion animation

MOODS: romantic, mysterious, nostalgic, energetic, melancholic, joyful, serene, dramatic, whimsical, ethereal, cozy, edgy
SETTINGS: ocean, rooftop, forest, cafe, street, studio, bedroom, rain, snow, sunset, night, dawn, mountains, desert
SUBJECTS: young woman, young man, elderly person, child, couple, group, silhouette, hands, back view
COLORS: warm golden, cool blue, pastel pink, monochrome, neon, earthy tones, jewel tones, pastel rainbow

OUTPUT JSON:
{
  "imagePrompt": "detailed creative prompt...",
  "caption": "short Persian description (2-3 lines with emojis)",
  "style": "style category",
  "mood": "mood"
}`;

  const userPrompt = `Generate a completely new, unique image prompt. Choose a DIFFERENT style, subject, setting, mood, and color palette each time. Be creative and surprising! Output ONLY valid JSON.`;

  if (!env.AI) {
    // Fallback: return a preset prompt
    const presets = [
      { imagePrompt: 'Ultra-realistic vintage 1970s film photograph of a young woman with flowing auburn hair sitting in a sun-drenched meadow of wildflowers, wearing a white linen dress, golden hour backlighting, lens flare, warm earthy tones, 35mm Kodachrome film grain, soft bokeh background, nostalgic pastoral mood, photorealistic, 3:4', caption: '🌸 پرامپت روز\n\nعکس رتروی ۷۰ میلادی در دشت گل‌ها با نور طلایی غروب', style: 'Vintage Film', mood: 'Nostalgic' },
      { imagePrompt: 'Cyberpunk street photography at night in Neo-Tokyo, neon signs in Japanese reflecting on wet pavement, a mysterious figure in a transparent raincoat holding a glowing umbrella, steam rising from street vents, electric blue and magenta color palette, rain drops, cinematic 35mm anamorphic lens, blade runner aesthetic, moody atmospheric, 9:16', caption: '🌃 نئون و باران\n\nخیابان نئونی توکیو با مه مرموز و رنگ‌های الکتریکی', style: 'Cyberpunk', mood: 'Mysterious' },
      { imagePrompt: 'Dreamy Renaissance oil painting of a celestial goddess floating among clouds at dawn, flowing translucent silk robes, long silver hair adorned with stars, surrounded by golden light rays, deep blue and gold color palette, Caravaggio lighting, chiaroscuro, ultra-detailed brushstrokes, classical art masterpiece, 4:5', caption: '✨ نقاشی رنسانسی\n\n الهه آسمانی در میان ابرها با نور طلایی صبحگاهی', style: 'Renaissance', mood: 'Ethereal' }
    ];
    return presets[Math.floor(Math.random() * presets.length)];
  }

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
      const match = res.response.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    }
  }

  return null;
}

// ─── ساخت عکس با FLUX ───
async function generateImage(prompt, env) {
  if (!env.AI) return null;

  try {
    const result = await env.AI.run(
      '@cf/black-forest-labs/FLUX-1-schnell',
      {
        prompt: prompt,
        width: 768,
        height: 1024,
        num_steps: 4,
        guidance: 0,
        seed: Math.floor(Math.random() * 1000000)
      }
    );

    if (result && result.image) {
      return Buffer.from(result.image, 'base64');
    }
    return null;
  } catch (e) {
    console.error('Image gen error:', e);
    return null;
  }
}

// ─── تست پرامپت ───
async function testPrompt(env) {
  const promptData = await generateCreativePrompt(env);
  if (!promptData) {
    return new Response('Error generating prompt', { status: 500 });
  }
  return new Response(JSON.stringify(promptData, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// ─── ارسال عکس ───
async function sendImageToTelegram(caption, imageBuffer, env) {
  try {
    const formData = new FormData();
    formData.append('chat_id', env.CHAT_ID);
    formData.append('photo', new Blob([imageBuffer], { type: 'image/webp' }), 'ai.webp');
    formData.append('caption', caption);

    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
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
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
  } catch (e) {}
}
