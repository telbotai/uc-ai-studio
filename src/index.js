// UC AI Studio - Cloudflare Worker
// 🧠 LLM + 🎨 Image Gen + 📱 Telegram

// پرامپت‌های آماده (وقتی LLM کار نکنه)
const PROMPT_BANK = [
  { imagePrompt: "Ultra-realistic vintage 1970s film photo of young woman with flowing auburn hair in sun-drenched wildflower meadow, white linen dress, golden hour backlighting, 35mm Kodachrome, warm earthy tones, soft bokeh, nostalgic pastoral mood, photorealistic, 3:4", caption: "🌸 عکس رتروی ۷۰ میلادی\n\nدشت گل‌ها با نور طلایی غروب", style: "Vintage Film" },
  { imagePrompt: "Cyberpunk neon Tokyo street at night, rain-soaked pavement reflecting pink and blue neon signs in Japanese, mysterious figure in transparent raincoat holding glowing umbrella, steam rising from vents, electric blue and magenta, anamorphic lens, blade runner aesthetic, moody atmospheric, 9:16", caption: "🌃 نئون و باران\n\nخیابان نئونی توکیو در شب بارانی", style: "Cyberpunk" },
  { imagePrompt: "Dreamy Renaissance oil painting of celestial goddess floating among clouds at dawn, flowing translucent silk robes, long silver hair adorned with stars, surrounded by golden light rays, deep blue and gold palette, Caravaggio lighting, ultra-detailed brushstrokes, 4:5", caption: "✨ نقاشی رنسانسی\n\nالهه آسمانی در میان ابرهای صبحگاهی", style: "Renaissance" },
  { imagePrompt: "Ultra-realistic cinematic portrait of young woman standing knee-deep in foamy ocean at night during blue hour, shimmering metallic ice-blue liquid satin strapless gown, extremely long straight jet-black hair past waist, massive dark ocean waves behind, cool monochromatic blue tones, moonlight illuminating face, medium-long portrait, 85mm lens, f/2, cinematic editorial fashion, 3:4", caption: "🌊 پرتره سینمایی اقیانوس\n\nزن جوان در امواج شبانه با ماه کامل", style: "Cinematic" },
  { imagePrompt: "Nostalgic 1980s Japanese anime cinematic illustration, young woman walking through quiet suburban Japanese neighborhood during golden hour, bright blue sweatshirt, black pants, white sneakers, utility poles, glowing clouds, warm evening light, Makoto Shinkai style, Studio Ghibli atmosphere, city pop aesthetic, retro Japanese nostalgia, ultra-detailed, 3:4", caption: "🎌 انیمه ژاپنی کلاسیک\n\nپیاده‌روی در کوچه‌های ژاپن در غروب", style: "Anime" },
  { imagePrompt: "Ultra-realistic studio portrait of young man in black hoodie against deep blue gradient background, cool blue rim lighting on hair and shoulder, warm facial lighting, calm mysterious expression, three-quarter angle, 85mm portrait lens, shallow depth of field, cinematic studio photography, premium fashion editorial, 4:5", caption: "🔵 پرتره استودیویی\n\nپرتره سینمایی با نور آبی دراماتیک", style: "Studio" },
  { imagePrompt: "Y2K disposable film birthday photoshoot, young woman with blonde messy bun tied with pink satin ribbons, pastel pink satin corset dress, white opera gloves, pearl necklace, elegant dessert table with vintage white buttercream cake, pink flowers, cupcakes, cream puffs, flash photography, authentic 1999 disposable camera, film grain, warm skin tones, 3:4", caption: "🎂 تولد Y2K\n\nجشن تولد با سبک دوربین یکبار مصرف ۹۹", style: "Y2K" },
  { imagePrompt: "Surrealist dreamscape, giant floating crystal ball over misty mountain valley at twilight, bioluminescent plants glowing purple and teal, impossible architecture with spiral staircases in the sky, double moon reflection in still water, ethereal mist, otherworldly atmosphere, detailed fantasy art, cinematic composition, 4:5", caption: "🔮 سورئالیسم\n\nمنظره رویایی با معماری غیرممکن", style: "Surrealist" },
  { imagePrompt: "National Geographic documentary style photo of elderly fisherman mending nets at dawn on rocky Mediterranean coast, weathered face with deep wrinkles, golden morning light, fishing boat in background, turquoise sea, authentic documentary photography, natural lighting, 85mm lens, 3:4", caption: "📸 مستند ملی جغرافیایی\n\nماهیگیر پیر در ساحل مدیترانه", style: "Documentary" },
  { imagePrompt: "Dark moody editorial fashion photograph, young woman in flowing black silk gown standing in abandoned Gothic cathedral, dramatic shaft of light from stained glass window, dust particles floating in light beam, deep shadows, rich jewel tones of ruby and emerald from glass, cinematic composition, 4:5", caption: "🖤 مُد تاریک\n\nزیبایی در میان سایه‌های کلیسای گوتیک", style: "Dark Editorial" },
  { imagePrompt: "Minimalist Scandinavian interior design, clean white room with single large monstera plant, natural linen sofa, warm afternoon sunlight streaming through floor-to-ceiling windows, shadow patterns on white wall, muted earth tones, architectural photography, calm serene atmosphere, 3:4", caption: "🏠 مینیمال اسکاندیناوی\n\nآرامش در سادگی", style: "Minimalist" },
  { imagePrompt: "Psychedelic abstract art portrait, woman's face dissolving into colorful fractal patterns, vivid rainbow gradients, liquid chrome reflections, kaleidoscope effect, flowing organic shapes, trippy vibrant colors against deep black background, digital art masterpiece, 4:5", caption: "🌈 سایکدلیک\n\nپرتره انتزاعی با الگوهای فراکتالی", style: "Psychedelic" },
  { imagePrompt: "Vintage 1950s Americana diner scene, young couple sharing milkshake at red leather booth, chrome details, neon signs, checkered floor, jukebox in background, warm tungsten lighting, Kodachrome color palette, nostalgic romantic mood, film grain, 3:4", caption: "🍦 رتروی ۵۰ میلادی\n\nزوج عاشق در رستوران کلاسیک آمریکایی", style: "Vintage Americana" },
  { imagePrompt: "Dramatic wildlife photography, majestic snow leopard perched on Himalayan rocky cliff at golden hour, snow-capped peaks in background, warm orange light on fur, intense golden eyes looking directly at camera, breath visible in cold air, National Geographic quality, 4:5", caption: "🐆 عکاسی حیات وحش\n\nپلنگ برفی هیمالیایی در نور طلایی", style: "Wildlife" },
  { imagePrompt: "Ethereal underwater fashion photograph, young woman in flowing white chiffon dress floating weightlessly in crystal clear turquoise ocean, sun rays piercing through water surface, air bubbles rising, dreamy soft focus, pastel color palette, serene peaceful mood, 3:4", caption: "🫧 زیر آب\n\nشناور در اقیانوس شفاف با پرتوهای نور", style: "Underwater" },
  { imagePrompt: "Stop-motion animation style scene, handcrafted clay characters in miniature cozy coffee shop, warm lighting, tiny latte art, handmade felt details, visible fingerprints on clay, shallow depth of field, Aardman Studios aesthetic, whimsical charming atmosphere, 4:5", caption: "🎭 استاپ‌موشن\n\nکاراکترهای خمیری در کافه مینیاتوری", style: "Stop-Motion" },
  { imagePrompt: "Cinematic night street photography in Paris, couple walking along Seine river with Eiffel Tower glowing in background, wet cobblestone reflecting city lights, warm amber street lamps, misty atmosphere, romantic mood, 35mm film grain, anamorphic bokeh, 3:4", caption: "🗼 پاریس شبانه\n\nپیاده‌روی عاشقانه کنار سن با برج ایفل", style: "Street Photography" },
  { imagePrompt: "Macro photography of exotic tropical flower, extreme close-up showing intricate petal texture, morning dew drops reflecting miniature world, vibrant magenta and gold colors, soft diffused natural lighting, black background, botanical art, 1:1", caption: "🌺 ماکروی گل\n\nجزئیات شگفت‌انگیز گل استوایی", style: "Macro" },
  { imagePrompt: "Art deco luxury illustration, elegant woman in gold beaded flapper dress ascending grand marble staircase, geometric patterns, champagne gold and deep black color scheme, 1920s Great Gatsby aesthetic, glamorous dramatic lighting, ornate details, 4:5", caption: "💎 آرت دکو\n\nشکوه دهه ۲۰ میلادی", style: "Art Deco" },
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
          prompt: 'a beautiful sunset over ocean, golden light, photorealistic',
          width: 512, height: 512, num_steps: 4, seed: 42
        });
        if (res && res.image) {
          const bytes = base64ToBytes(res.image);
          return new Response(bytes, { headers: { 'Content-Type': 'image/webp' } });
        }
        return new Response('No image');
      } catch (e) {
        return new Response('Error: ' + e.message);
      }
    }

    if (url.pathname === '/generate') {
      try {
        // ۱. انتخاب پرامپت (اول LLM، بعد bank)
        let prompt = null;

        // سعی کن با LLM پرامپت بسازه
        if (env.AI) {
          try {
            prompt = await generateWithLLM(env);
          } catch (e) {
            console.error('LLM failed, using preset');
          }
        }

        // اگه LLM کار نکرد، از bank استفاده کن
        if (!prompt) {
          prompt = PROMPT_BANK[Math.floor(Math.random() * PROMPT_BANK.length)];
        }

        // ۲. ساخت عکس
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
              imgBlob = new Blob([base64ToBytes(r.image)], { type: 'image/webp' });
            }
          } catch (e) {
            console.error('Image error:', e);
          }
        }

        // ۳. ارسال به تلگرام
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
      if (env.AI) {
        try { prompt = await generateWithLLM(env); } catch (e) {}
      }
      if (!prompt) prompt = PROMPT_BANK[Math.floor(Math.random() * PROMPT_BANK.length)];

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

// ─── LLM پرامپت بسازه ───
async function generateWithLLM(env) {
  const res = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
    messages: [
      { role: 'user', content: 'Write a creative AI image generation prompt in English. Topic and style: your choice - be creative and unique. Include camera angle, lighting, mood, colors. End with aspect ratio like 3:4 or 9:16. Write ONLY the prompt, nothing else. Max 100 words.' }
    ],
    temperature: 0.95,
    max_tokens: 200
  });

  if (res && res.response) {
    const text = res.response.trim();
    if (text.length > 20) {
      return {
        imagePrompt: text,
        caption: `🎨 پرامپت خودکار\n\n${text.substring(0, 100)}...`,
        style: "AI Generated"
      };
    }
  }
  return null;
}

// ─── base64 → Uint8Array ───
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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
