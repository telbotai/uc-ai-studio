// UC AI Studio - People-Focused Prompts
// 🧠 LLM + 🎨 Image Gen + 📱 Telegram

const PROMPT_BANK = [
  // ─── Y2K / Disposable Film ───
  { imagePrompt: "Ultra-realistic Y2K disposable film flash birthday photoshoot, joyful young woman with blonde hair in messy bun tied with pink satin ribbons, soft face-framing strands, natural glowing makeup, rosy cheeks, glossy lips, pastel pink satin corset dress, long white opera gloves, pearl necklace, pearl drop earrings, sitting at elegant dessert table with vintage white buttercream birthday cake decorated with pink flowers, cupcakes, cream puffs, eating cake with silver fork, eyes closed laughing, deep black backdrop, dramatic direct on-camera flash, high contrast, late-90s birthday party atmosphere, editorial fashion, luxury feminine aesthetic, dreamy coquette vibe, 35mm Kodak Gold 200 film, photorealistic, 3:4", caption: "🎂 تولد Y2K\n\nجشن تولد با سبک دوربین یکبار مصرف ۹۹", style: "Y2K Film" },

  { imagePrompt: "Ultra-realistic Y2K disposable flash photo of young woman playfully leaning forward taking a big bite from birthday cake, frosting on tip of nose, smiling mischievously, blonde hair messy bun with pink satin ribbons, white opera gloves, pastel pink dress, pearl jewelry, clusters of pastel pink and ivory helium balloons in background, dark backdrop, direct on-camera flash, film grain, candid editorial, authentic disposable camera look, 3:4", caption: "🎈 Y2K کیک خوری\n\nبازیگوشی با کیک تولد", style: "Y2K Film" },

  // ─── Cinematic Ocean ───
  { imagePrompt: "Ultra-realistic cinematic portrait of mysterious young woman standing knee-deep in foamy ocean at night during blue hour, shimmering metallic ice-blue liquid satin strapless gown, extremely long straight jet-black hair past waist, wet at ends, massive dark ocean waves behind, cool monochromatic blue tones, moonlight illuminating face and dress, droplets of water on neck and skin, delicate silver necklace with large oval dark sapphire pendant, soft glam makeup, dreamy melancholic expression, softly parted lips, 85mm lens, f/2, shallow depth of field, cinematic editorial fashion, luxury campaign aesthetic, 3:4", caption: "🌊 پرتره سینمایی اقیانوس\n\nشب مهتابی در امواج", style: "Cinematic" },

  // ─── Japanese Anime ───
  { imagePrompt: "Nostalgic 1980s-1990s Japanese anime cinematic illustration, highly detailed hand-painted background, warm golden-hour lighting, soft film grain, young woman with long wavy blonde hair wearing bright blue sweatshirt, black pants, white sneakers, walking through quiet suburban Japanese neighborhood during golden hour, looking directly at camera, utility poles lining narrow residential street, glowing purple pink orange clouds overhead, warm evening light, Makoto Shinkai inspired, Studio Ghibli atmosphere, city pop aesthetic, retro Japanese nostalgia, cinematic framing, ultra-detailed, 3:4", caption: "🎌 انیمه ژاپنی غروب\n\nپیاده‌روی در کوچه‌های ژاپن", style: "Anime" },

  { imagePrompt: "Nostalgic Japanese anime cinematic illustration, young man with dark curly hair wearing light gray overcoat over white t-shirt, black pants, gold rings, walking through quiet Japanese street during golden hour, looking directly at camera, utility poles, glowing clouds, warm evening light, neon signs, vending machines, Makoto Shinkai style, retro Japanese nostalgia, cinematic composition, ultra-detailed, 3:4", caption: "🗼 انیمه خیابان ژاپنی\n\nمرد جوان در غروب طلایی", style: "Anime" },

  // ─── Family / Cozy ───
  { imagePrompt: "Photorealistic horizontal early-2000s family snapshot, young mother with long wavy light brown hair resting cheek on hand looking down at toddler daughter on fluffy white cushion over Persian carpet, toddler with dark brown hair in small ponytail, light pink top, cozy home, wooden furniture, warm dim lighting, direct compact-camera flash, muted brown tones, soft focus, subtle grain, nostalgic intimate atmosphere, 3:4", caption: "👨‍👩‍👧 لحظه خانوادگی\n\nمادر و دختر در آرامش خانه", style: "Family" },

  { imagePrompt: "Photorealistic early-2000s family snapshot, young father with dark hair resting cheek on hand looking down at infant baby on fluffy white cushion, baby with dark hair bright blue eyes wearing navy blue top, cozy living room with wooden cabinet, framed photos, striped couch, warm dim lighting, compact-camera flash, muted tones, soft grain, nostalgic intimate mood, 3:4", caption: "👶 پدر و فرزند\n\nلحظه صمیمی پدر با نوزاد", style: "Family" },

  // ─── Night Romantic ───
  { imagePrompt: "Intimate night photograph of couple in tender embrace on residential street, man with dark wavy hair in dark hoodie wrapping arms around woman with dark brown hair in black leather jacket, her eyes closed warm relaxed smile, man's forehead resting against her head, warm yellow streetlamp lighting, apartment building with glowing windows behind, parked cars, trees, romantic intimate atmosphere, candid emotional moment, 3:4", caption: "🤗 در آغوش شبانه\n\nلحظه عاشقانه در نور خیابان", style: "Night Romantic" },

  // ─── Birthday Celebration ───
  { imagePrompt: "Full-body night photograph of young woman with long wavy brown hair sitting in open trunk of black luxury sedan, wearing form-fitting sleeveless black dress with deep V-neckline, silver strappy high-heeled sandals, holding small round pink-frosted birthday cake with six lit white candles, large cluster of shiny pearlescent pink and rose gold balloons beside her, dark parking lot background, flash photography, celebratory intimate mood, 3:4", caption: "🎉 تولد ماشینی\n\nجشن تولد در صندوق عقب ماشین", style: "Birthday" },

  // ─── Studio Portrait ───
  { imagePrompt: "Split-panel studio portrait, left: young woman with long voluminous wavy dark brown hair swept over shoulder, warm fair complexion, striking light green hazel eyes, dark eyeliner, long lashes, multiple gold piercings, matte black fleece hoodie, deep dark blue gradient background, cool blue rim lighting on hair, warm facial lighting. Right: young man with short textured dark brown hair swept back, square defined jawline, fair skin with freckles, bright light blue eyes, thick dark eyebrows, matching black hoodie, same blue lighting setup, both looking directly at camera, calm composed expressions, cinematic studio photography, 3:4", caption: "🔵 پرتره دوتایی استودیویی\n\nنور آبی دراماتیک", style: "Studio" },

  // ─── Collage / Multi-panel ───
  { imagePrompt: "6-panel photo collage, 3x2 grid on deep black background, elegant birthday celebration. Top left: young woman with light brown messy bun with pink ribbon, pink satin bustier, pearl choker, pearl earrings, white opera gloves, holding fork with cake, smiling widely. Top right: same woman eating cake from fork with delight. Middle left: close-up with frosting on nose, playful smile. Middle right: leaning over large white birthday cake with pink flowers. Bottom left: cluster of pink and silver metallic balloons. Bottom right: balloons from different angle. Vintage flash photography aesthetic, soft pink white silver palette, intimate celebratory whimsical mood, 3:4", caption: "🎂 کلاژ تولد\n\n۶ صحنه از جشن تولد", style: "Collage" },

  // ─── Underwater Fashion ───
  { imagePrompt: "Cinematic underwater fashion photograph, young woman with long wet dark brown hair draped over shoulders, wearing strapless form-fitting metallic blue liquid satin dress, standing in deep blue ocean, water droplets on glistening skin, round dark blue pendant necklace, foamy waves around waist, dark moody sky with full moon, moonlight reflecting off water and dress, ethereal surreal atmosphere, cool blue tones, medium-long portrait, centered composition, 85mm lens, fashion editorial, 3:4", caption: "🫧 زیرآب فشن\n\nمد زیر دریا با نور ماه", style: "Underwater" },

  // ─── Street Photography ───
  { imagePrompt: "Cinematic night street photography in Paris, young couple walking hand in hand along Seine river, Eiffel Tower glowing golden in background, wet cobblestone reflecting warm amber street lamps and city lights, misty romantic atmosphere, woman in flowing red dress, man in dark coat, 35mm film grain, anamorphic bokeh, romantic mood, 3:4", caption: "🗼 پاریس شبانه\n\nپیاده‌روی عاشقانه کنار سن", style: "Street" },

  // ─── Dark Editorial ───
  { imagePrompt: "Dark moody editorial fashion photograph, young woman in flowing black silk gown standing in abandoned Gothic cathedral, dramatic shaft of light from stained glass window illuminating her face and upper body, dust particles floating in light beam, deep shadows, rich jewel tones of ruby and emerald from glass, intense gaze directly at camera, cinematic composition, luxury fashion editorial, 3:4", caption: "🖤 مُد تاریک\n\nزیبایی در سایه‌های کلیسای گوتیک", style: "Dark Editorial" },

  // ─── Vintage 70s ───
  { imagePrompt: "Ultra-realistic vintage 1970s film photograph of young woman with flowing auburn hair sitting in sun-drenched meadow of wildflowers, wearing white linen dress, golden hour backlighting with lens flare, warm earthy tones, 35mm Kodachrome film grain, soft bokeh background, nostalgic pastoral mood, natural beauty, 3:4", caption: "🌸 رتروی ۷۰ میلادی\n\nدشت گل‌ها با نور طلایی", style: "Vintage" },

  // ─── Ethereal / Dreamy ───
  { imagePrompt: "Dreamy ethereal portrait of young woman with long flowing silver-white hair floating weightlessly in crystal clear turquoise water, wearing flowing white chiffon dress, sun rays piercing through water surface, air bubbles rising, pastel pink and blue color palette, soft diffused lighting, serene peaceful expression, eyes gently closed, fashion editorial, underwater fine art photography, 3:4", caption: "🫧 رویایی زیر آب\n\nشناور در اقیانوس شفاف", style: "Ethereal" },

  // ─── Cyberpunk ───
  { imagePrompt: "Cyberpunk portrait of young woman with short asymmetric neon-pink hair, glowing LED eyeshadow, wearing transparent tech-jacket with visible circuitry, standing on rain-soaked Tokyo rooftop at night, massive holographic billboards behind, electric blue and magenta neon reflections on wet surfaces, steam rising, anamorphic lens flare, blade runner aesthetic, cinematic composition, 3:4", caption: "🌃 پرتره سایبرپانک\n\nنئون و باران در توکیو", style: "Cyberpunk" },

  // ─── Renaissance ───
  { imagePrompt: "Renaissance oil painting style portrait of young woman with long flowing dark hair adorned with pearls and small flowers, wearing deep burgundy velvet gown with gold embroidery, soft dramatic lighting from left, rich warm color palette, classical composition, oil painting texture, Rembrandt lighting, elegant timeless beauty, 4:5", caption: "👑 پرتره رنسانسی\n\nشکوه کلاسیک با نور دراماتیک", style: "Renaissance" },

  // ─── Stop Motion ───
  { imagePrompt: "Stop-motion animation style portrait, handcrafted clay figure of young woman with brown hair in ponytail, wearing cozy knitted sweater, sitting in miniature handcrafted coffee shop with tiny latte art, warm lighting, visible fingerprints on clay, felt details, shallow depth of field, Aardman Studios aesthetic, whimsical charming atmosphere, 3:4", caption: "🎭 استاپ‌موشن\n\nکاراکتر خمیری در کافه مینیاتوری", style: "Stop-Motion" },

  // ─── Minimalist ───
  { imagePrompt: "Minimalist Scandinavian portrait, young woman with natural hair pulled back, wearing simple cream knit sweater, sitting by large floor-to-ceiling window, soft natural afternoon light casting shadow patterns on white wall, monstera plant nearby, muted earth tones, calm serene expression, clean architectural composition, 3:4", caption: "🏠 مینیمال\n\nآرامش در سادگی", style: "Minimalist" },

  // ─── Art Deco ───
  { imagePrompt: "Art deco luxury illustration, elegant woman in gold beaded flapper dress ascending grand marble staircase, geometric patterns, champagne gold and deep black color scheme, 1920s Great Gatsby aesthetic, glamorous dramatic lighting, ornate details, bold confident expression, cinematic composition, 4:5", caption: "💎 آرت دکو\n\nشکوه دهه ۲۰ میلادی", style: "Art Deco" },
];

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
        // ۱. پرامپت (اول LLM، بعد bank)
        let prompt = null;
        if (env.AI) {
          try { prompt = await generateWithLLM(env); } catch (e) {}
        }
        if (!prompt) prompt = PROMPT_BANK[Math.floor(Math.random() * PROMPT_BANK.length)];

        // ۲. عکس
        let imgBlob = null;
        if (env.AI) {
          try {
            const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
              prompt: prompt.imagePrompt,
              width: 768, height: 1024,
              num_steps: 4,
              seed: Math.floor(Math.random() * 999999)
            });
            if (r && r.image) imgBlob = new Blob([base64ToBytes(r.image)], { type: 'image/webp' });
          } catch (e) {}
        }

        // ۳. ارسال
        if (imgBlob) {
          const fd = new FormData();
          fd.append('chat_id', env.CHAT_ID);
          fd.append('photo', imgBlob, 'ai.webp');
          fd.append('caption', prompt.caption);
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
        } else {
          await sendTelegram(`🎨 **${prompt.style}**\n\n📝 ${prompt.imagePrompt}\n\n💬 ${prompt.caption}`, env);
        }
        return new Response('Done! Style: ' + prompt.style);
      } catch (e) {
        return new Response('Error: ' + e.message);
      }
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(event, env) {
    try {
      let prompt = null;
      if (env.AI) { try { prompt = await generateWithLLM(env); } catch (e) {} }
      if (!prompt) prompt = PROMPT_BANK[Math.floor(Math.random() * PROMPT_BANK.length)];

      let imgBlob = null;
      if (env.AI) {
        try {
          const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
            prompt: prompt.imagePrompt, width: 768, height: 1024,
            num_steps: 4, seed: Math.floor(Math.random() * 999999)
          });
          if (r && r.image) imgBlob = new Blob([base64ToBytes(r.image)], { type: 'image/webp' });
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
    } catch (e) { console.error('Cron error:', e); }
  }
};

// ─── LLM پرامپت انسانی ───
async function generateWithLLM(env) {
  const styles = ["Y2K birthday flash", "cinematic ocean portrait", "Japanese anime", "cozy family snapshot", "night romantic candid", "birthday celebration", "studio portrait blue lighting", "underwater fashion", "dark gothic editorial", "vintage 70s film", "cyberpunk neon", "renaissance painting", "minimalist Scandinavian", "Art Deco luxury"];
  const style = styles[Math.floor(Math.random() * styles.length)];

  const res = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
    messages: [
      { role: 'user', content: `Write a detailed AI image prompt for a PHOTO of a PERSON. Style: ${style}. Describe: the person's pose, expression, clothing, hair, lighting, background, mood, colors. MUST feature a human as the main subject. End with aspect ratio 3:4 or 9:16. Write ONLY the prompt text, nothing else. 50-100 words.` }
    ],
    temperature: 0.9,
    max_tokens: 200
  });

  if (res && res.response) {
    const text = res.response.trim();
    if (text.length > 30) {
      return { imagePrompt: text, caption: `🎨 ${style}\n\n${text.substring(0, 80)}...`, style: "AI Generated" };
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
      body: JSON.stringify({ chat_id: env.CHAT_ID, text: text, parse_mode: 'Markdown', disable_web_page_preview: true })
    });
  } catch (e) {}
}
