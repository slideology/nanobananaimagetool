// 提示词画廊数据：每条包含图片链接、提示词文本和生成参数元信息
export interface PromptItem {
  src: string;        // R2 原图链接
  alt: string;        // Prompt 提示词文本
  model: string;      // 使用的模型名称
  type: string;       // 生成类型（text-to-image / image-to-image）
  ratio: string;      // 宽高比
  resolution: string; // 分辨率
}

export const PROMPTS_DATA: PromptItem[] = [
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/6fe46b86-bcb8-4867-ba69-2756bd953490.webp",
    "alt": "Create a hyper-realistic, square 1:1 image featuring a small helicopter flying through a bright blue sky with fluffy white clouds and a subtle lens flare. The helicopter is painted in the signature colors and graphics of [BRAND]. It is carrying a giant product from [BRAND] hanging below. The composition has the look and feel of a clean, playful (or premium, futuristic) advertisement. At the bottom, include the [BRAND] logo and a small slogan like [BRAND SLOGAN] in a stylish font. 1080x1080 dimension.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/a7031c4b-174b-4f43-8f80-2be358288274.webp",
    "alt": "A hyper-realistic editorial concept for a collaboration between [BRAND] and [MAGAZINE BRAND]. Square 1:1 composition, shot in a sleek Parisian interior with marble floors and tall windows, golden afternoon light illuminating the scene. A single model in a couture gown poses gracefully beside a realistically sized [BRAND] perfume bottle with the [BRAND] logo clearly visible placed on a marble pedestal. Ultra-refined textures, cinematic realism, Vogue-style photography.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/0b573022-b350-47f1-8da2-6353b504583e.webp",
    "alt": "Create step-by-step recipe infographic for creamy garlic mushroom pasta, top-down view, minimal style on white background, ingredient photos labeled: \"200g spaghetti\", \"150g mushrooms\", \"3 garlic cloves\", \"200ml cream\", \"1 tbsp olive oil\", \"parmesan\", \"parsley\", dotted lines showing process steps with icons (boiling pot, sauté pan, mixing), final plated pasta shot at the bottom",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "auto",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/ca5eaf38-0034-4b73-8a60-8558206becff.webp",
    "alt": "Colorful, cartoon-style app icon design for a [type of app: game, movie, food, sport, etc.] logo with the text [\"App Name\"] and [character, symbol, or cute object + short description of its pose or action] on the front of a square button, set against a [background color / theme] with simple details. High-resolution game art and graphics for a mobile app, Pixar style, realistic.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/3902893b-ab9a-44a2-a993-7ba20fe35646.webp",
    "alt": "A stylized capital letter [Letter] with a cartoon [Animal] intertwined with it, on a solid color background.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/c30f23ab-fe0a-4bf1-b660-96db977df6e7.webp",
    "alt": "Scene\nMirror selfie in an otaku-style computer corner, blue-toned atmosphere.\n\nSubject\nGender expression: Female\nAge range: Around 25 years old\nEthnicity: East Asian\nBody type: Slim with a defined waist; natural body proportions\nSkin tone: Light neutral tone\n\nHair:\nLength: Waist-length hair\nStyle: Straight with slightly curled ends\nColor: Medium brown\n\nPose:\nStanding posture: Standing with a slight contrapposto stance\nRight hand: Holding a phone in front of the face, obscuring identity\nLeft arm: Hanging naturally beside the torso\n\nClothing:\nTop: Light blue cropped knit cardigan\nBottom: Denim ultra-short shorts\nSocks: Blue-and-white striped over-the-knee socks\n\nLighting\nLight source: Daylight from a large window, filtered through sheer curtains\nLight quality: Soft, diffused light\n\nCamera\nEquivalent focal length: 26mm\nAperture: f/1.8\nISO: 100\nAspect ratio: 1:1",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/2360c09c-4301-4ec2-9a64-4ede706ea967.webp",
    "alt": "Ultra-detailed, photorealistic portrait of a beautiful woman, high fashion editorial, deep white plunging V-neck lace sequined evening gown, elegant low bun updo, soft studio lighting, light grey background, dramatic shadowplay, hyperrealistic, 8K",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "auto",
    "resolution": "4K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/11048dbe-3994-46ce-8702-4f2e7409446e.webp",
    "alt": "Please take a photo in the photo studio, using the female face from the attached photo.\nThe shooting angle is frontal, with a white studio background, and the female is sitting on a chair.\nShe was dressed in a full set of white attire: a white suit jacket, a white skirt, and white high heels.\nShe has an elegant posture, with her chin resting on her hand, and a small white rose in her hand.\nThe soft light of the setting sun shone through the windows, casting a warm glow on the walls of the photo studio.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "auto",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/83c2d38b-f502-42d6-b028-900811ca24a5.webp",
    "alt": "Create a hyper-realistic 3D render of a large capsule-shaped container. The top half is solid and glossy in McDonald's signature colors, featuring the official McDonald's logo prominently. The bottom half is transparent, revealing multiple miniature McDonald's Big Mac burgers neatly packed inside. Set against a dark background with cinematic lighting and soft reflections to create a premium, surreal advertising aesthetic. Ultra-detailed, professional product render style. 1080×1080 dimension.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/02b4114d-d660-4afc-855e-fbab9acec2ed.webp",
    "alt": "A selfie-style shot of a smiling young man with dark hair and a beard, wearing a red and black plaid shirt. He is surrounded by several animated movie monsters, including Count Dracula, a mummy, a large blue furry monster resembling Sulley from Monsters Inc., a werewolf, and a smaller blue vampire bat character. They are all smiling and posing for the selfie. The background is a grand hall with stained-glass windows and chandeliers, resembling a gothic castle or church interior. The lighting is warm and inviting.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/10a91ef6-3970-44bb-bffa-89945ebb8f54.webp",
    "alt": "Editorial 3x3 photo grid in a clean soft beige studio. Character (matches reference 100%) wearing lightweight dark navy shirt, ivory trousers, barefoot for raw simplicity. Lighting: large diffused key light directly front-right, silver reflector left, subtle rim from top. Shots to include: 1. extreme close-up of lips + cheekbone with blurred hand partially covering (85mm, f/1.8, razor-thin DOF); 2. tight crop on eyes looking into lens with reflection of light strip visible (85mm, f/2.0); 3. black & white close portrait resting chin on fist, face filling frame (50mm, f/2.2); 4. over-shoulder shot, blurred foreground fabric curtain framing half face (85mm, f/2.0); 5. very close frontal with hands overlapping face, light streak across eyes (50mm, f/2.5); 6. tight angled portrait showing hair falling into eyes, soft-focus background (85mm, f/2.2); 7. crop of hands touching jawline, eyes cropped out (50mm, f/3.2, detail-focused); 8. half-body seated sideways on low cube, head turned sharply away, blurred foreground (35mm, f/4.5); 9. intense close-up of profile with single tear-like water droplet, cinematic light slice across (85mm, f/1.9).",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "auto",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/4e65bb85-819c-4fb3-a574-1a4924531c70.webp",
    "alt": "Create a 3D kawaii 10:16 canvas featuring nine chibi-style stickers in various outfits, poses, and expressions. Use the attached image for reference. Each sticker has a white border and includes a speech bubble with phrases like \"Goodmorning\", \"Lunch kana\", \"Huh\", \"Hugs\", \"Thank you\", \"Goodnight\", \"You're the best\" \"miss you\" \"mwah 😙\" \"good job\" and \"Ingat ka\". Set on a soft white-to-pastel blue gradient background for a fun, positive vibe.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "10:16",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/902e4552-6b35-4393-89b1-df818c8b69ba.webp",
    "alt": "Using the exact facial features from the attached image\nCreate an hyperrealistic and high quality close-up portrait of a styling young woman, her dark thick long hair styled in twin high artistic braids that falls over her ears, few loose trendils clipped using a different style matte brown statement hair clips, with few loose strands falls across and frames her face, wearing a drawstring halter top, a thick-frame brown cat-eye eyeglasses slightly lowered, soft hazel nut eyes, glossy red pouty lips, peached dewy blush and soft warm tone eyeshadows with a little bit shimmers and glitters on her cheeks and under her eyes, artistic brown eyeliner, natural dewy skin, head slightly tilted, relaxed and confident gaze hand-on-cheek pose, minimalistic background, warm beige and brown tones, bright and harsh illumination coming from the camera highlighting the texture of her figure, soft studio background lighting, K-fashion editorial aesthetic, Seoul street style influence, hyper-detailed face texture, cinematic tone, 85mm lens photography, Vogue Korea vibe, stylish and modern mood",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "2:3",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/362a0f51-403d-4d1a-99a3-7c2fc395ed75.webp",
    "alt": "Create a new cinematic scene by placing the subject from the uploaded image into a completely different environment, using the uploaded image only as a reference for the subject's face, hair, and overall appearance. Do not reuse or reference the original background in any way.\nThe new setting is inside a bus, focused on a window that conveys a sad, troubled, and sorrowful atmosphere. The young man, whose appearance must remain consistent with the uploaded image, is seated by the window with his head gently resting against the glass. He is fully integrated into this new environment, with sharp focus on the subject and a naturally blurred background.\nAttached directly to the surface of the bus window is a glassmorphism-style music player interface. The music player displays the song title “Wrecked” and the artist name “Imagine Dragons.”\nThe scene is shot in a cinematic portrait style with realistic compositing, using a medium shot or medium close-up at eye level. Depth of field is shallow, creating background bokeh. Lighting is soft, ambient, and moody.\nAspect ratio is 1:1.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "1:1",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/2dfb0feb-ffff-448e-be1c-5274160f91bf.webp",
    "alt": "A realistic full-body portrait of a [ARTIST] in their signature style, positioned next to a giant vertical smartphone displaying a Spotify interface. The phone screen shows a music player interface featuring the song “[SONG]” with signature [COLOR] accent colors at approximately 80% opacity for a premium aesthetic effect.\nThe artist wears their characteristic outfit and styling. Their pose is confident and editorial, embodying the mood and energy of the song.\nTechnical specifications:\n• Plain background with subtle [COLOR] lighting accents\n• Soft studio lighting with colored gels in signature [COLOR] tones\n• 35mm or 50mm lens, f/2.2, ISO 100-160, shutter speed 1/125\n• Sharp focus on subject and phone interface\n• Editorial style consistent with premium music platform campaigns",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "auto",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/76488ae4-cd86-4d84-8e06-2a1ad399cea4.webp",
    "alt": "A cute anthropomorphic cat in triple view: front-left, front, and back. Standing upright with a plump body, expressive face, and wearing [clothing/style]. Cartoon mascot in 2D animation style, clean bold lines, flat shading with subtle gradients, soft outlines, and a light neutral background.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "auto",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/58575b17-dfa7-4ff2-8f8d-353b554dc926.webp",
    "alt": "A doodle-style, naive lines, humorous shape exaggeration",
    "model": "nano-banana",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/7e03d356-28da-436e-a2cc-f0e90911c926.webp",
    "alt": "A cinematic 16:9 wide shot featuring a single centered headshot of Naruto Uzumaki, face split vertically in half. A distinct black line separates the two art styles down the center. [LEFT HALF]: Classic anime style, bright blonde spiky hair, blue anime eye, black whisker marks, metal headband with bold lines. [RIGHT HALF]: Gritty realism, realistic dirty blonde textured hair, piercing blue human eye, whisker marks as faint scars, weathered metal texture on the headband with rust. The headband and facial features align perfectly to form a single, unified character portrait, rendered in Unreal Engine 5.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "16:9",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/6cc3f60a-387a-4dc2-b4f8-4680216529e4.webp",
    "alt": "A photorealistic wide-angle landscape shot of the Statue of Liberty with the New York City skyline and harbor in the background. Superimposed on the scene is a white, hand-drawn augmented reality technical overlay. Features include: 1. Sketchy white leader lines pointing to key details like the \"Torch,\" \"Crown Rays,\" and \"Copper Shell\" with handwritten text labels. 2. Large dimensional vertical measurement arrows indicating the total height from ground to torch. 3. Small floating wireframe icons showing wind load data and material composition. Aesthetic: Structural engineering analysis, F1 broadcast graphics style, bright outdoor daylight, architectural blueprint overlay.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "auto",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/03795c64-1e7c-4b08-a863-1d277b28c279.webp",
    "alt": "Use the provided portrait photo as the base.\nDo NOT change the person's face, expression, age, skin tone or gender. Just overlay a clean, minimal infographic on top.\nCreate a high-resolution vertical “FACIAL AESTHETIC REPORT” poster, studio lighting, soft beige background, premium beauty clinic style.\nThe subject can be MALE or FEMALE – keep them exactly as in the original photo.\nAdd thin white lines and labels pointing to each area of the REAL face, with percentage scores based on global aesthetic ratios, symmetry and proportions (not changing the face):\n1. Eyes: “Eyes Beauty – 92%”\n2. Cheeks: “Cheeks Harmony – 85%”\n3. Lips: “Lips Shape – 88%”\n4. Eyebrows: “Eyebrows Design – 80%”\n5. Jaw & Chin: “Jaw & Chin Definition – 90%”\n6. Overall Facial Symmetry: “Facial Symmetry – 89%”\nAt the bottom center, add a BIG bold number: “OVERALL SCORE: XX%”\nDesign style: clean, medical-grade, aesthetic-clinic infographic, modern thin sans-serif typography, white text and lines, subtle drop shadows.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "auto",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/d74805c7-92ab-474f-826d-17f0768c6346.webp",
    "alt": "A high-angle, wide-angle real-world photograph of [Space X] serves as the background, overlaid with detailed white technical engineering schematics and blueprint-style line work. The style resembles white hand-drawn chalk or pencil sketches drawn directly onto the photograph.\n\nKey elements include dimension lines with measurement values labeling [key dimensions of the subject], directional arrows indicating [forces, motion, or flow], detailed cross-section diagrams of [internal components], and an exploded-view diagram of [complex components]. Key features are annotated with clean, neat handwritten-style text labels.\n\nAesthetic style: educational science illustration, industrial design analysis, clean, precise, mixed-media visual language. In the bottom-left corner, include a blueprint-style logo enclosed in a hand-drawn frame, with the text “[Space X]”.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "9:16",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/ab11c8bf-9be3-4273-ade1-1a9651090f77.webp",
    "alt": "Add clean, minimal white line-drawing illustrations of people into this photo. Match the perspective, lighting, and scale of the scene. The illustrated figures should interact naturally and meaningfully with the environment, reflecting the mood, purpose, and activity of the space. Keep the drawings simple, fluid, and expressive, with no facial details. Maintain a modern, warm, and slightly whimsical tone that complements the overall aesthetic. Do not obscure any original elements. The illustrated figures should feel like friendly, imaginative additions that blend seamlessly with the context of the scene.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/7ab8c6c6-39cf-4c75-866d-d2d6e890c99a.webp",
    "alt": "创作一张手绘风格的信息图卡片，比例为9:16竖版。卡片主题鲜明，背景为带有纸质肌理的米色或米白色，整体设计体现质朴、亲切的手绘美感。\n\n卡片上方以红黑相间、对比鲜明的大号毛笔草书字体突出标题，吸引视觉焦点。文字内容均采用中文草书，整体布局分为2至4个清晰的小节，每节以简短、精炼的中文短语表达核心要点。字体保持草书流畅的韵律感，既清晰可读又富有艺术气息。\n\n卡片中点缀简单、有趣的手绘插画或图标，例如人物或象征符号，以增强视觉吸引力，引发读者思考与共鸣。整体布局注意视觉平衡，预留足够的空白空间，确保画面简洁明了，易于阅读和理解。\n\n主题是：“做IP是长期复利，坚持每日出摊，持续做，肯定会有结果，因为99%都坚持不住的。”",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "16:9",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/6cd30211-fcfa-44c7-b197-be7bbe68b7b8.webp",
    "alt": "A street mural with ultra-high definition and strong photographic texture, the image presents a strong Chinese charm.\n\nThe painting depicts a stunningly beautiful woman with a close-up head shot in a cartoon style, her demeanor gentle and serene. The top of the wall is covered with a vast expanse of blooming roses, with lush green leaves and flourishing flowers stretching outward. Some branches hang down from the top of the wall, cleverly merging with the woman's hair, making her hair appear as if it is composed of layers of roses. These dense flowers surround the woman's head, forming a magnificent crown, creating a visually beautiful and romantic effect.\n\nThe background features a clear blue sky dotted with fluffy white clouds; the ground is a realistic asphalt street littered with colorful petals, with pedestrians strolling leisurely among them. The overall scene is exquisitely detailed, with bright and soft lighting, creating a dreamlike streetscape atmosphere that feels like reality.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "4:3",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-03/50f73bb7-a7b1-4fc4-a1a8-7fccebcbda5a.webp",
    "alt": "Put this whole text, verbatim, into a photo of a glossy magazine article on a desk, with photos, beautiful typography design, pull quotes and brave formatting. The text:",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "3:4",
    "resolution": "4K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/b1c953f3-addc-4428-b054-59ff1bc6d138.webp",
    "alt": "Generate a photo of a grand Apple product launch event with a large audience. The venue is dark and immersive, filled with dazzling stage lighting. The camera focuses on a massive, wide curved screen that dominates the scene. On the screen, display the white gradient text: “Nano Banana is here.” The text follows the same perspective as the curved display, with a subtle 3D depth and realistic distortion.\n\nA very small human silhouette stands on the stage in front of the screen, emphasizing scale and grandeur. The background softly diffuses from deep purple to blue tones, creating a cinematic atmosphere. The overall scene should look like a real on-site photograph from a high-end keynote event, premium, elegant, and technologically advanced. Aspect ratio 16:9.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "3:4",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/20b802d1-1afc-4692-8cdc-67784519dc70.webp",
    "alt": "A wide celebrity quote card, featuring a brown background, with a serif font in light gold. The small text reads \"Stay hungry, stay foolish\" with the name \"- Steve Jobs\" underneath. The text is preceded by a large, faint quotation mark. The portrait of the person is on the left, and the text is on the right. The text occupies 2/3 of the image, while the person occupies 1/3. The person's image has a subtle gradient transition effect",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "16:9",
    "resolution": "4K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/44c04f9a-7b49-48af-af52-d07d54cff9f4.webp",
    "alt": "Role (Character Definition)\nYou are a top-tier game and anime concept artist, specializing in highly detailed character sheets. You possess a “pixel-level deconstruction” capability: you can precisely break down clothing layers, capture subtle micro-expressions, and realistically visualize all items associated with a character. You are particularly skilled at enriching a character’s personality and backstory through the depiction of female characters’ intimate belongings, personal items, and everyday life details.\n\nTask (Objective)\nBased on a character image uploaded by the user or a textual description, generate a “panoramic in-depth character concept breakdown sheet.”\nThe image must feature a full-body character illustration at the center, surrounded by detailed breakdowns of clothing layers, multiple facial expressions, core props, material close-ups, and highly life-like displays of personal and carried items.\n\nVisual Guidelines\n\nLayout\nCenter: Place the full-body character illustration or primary dynamic pose in the center as the visual anchor.\nSurroundings: Arrange all deconstructed elements in an organized manner around the central figure, using the surrounding empty space.\nConnectors: Use hand-drawn arrows or guide lines to connect each surrounding element to its corresponding part or area of the character (for example, a bag connected to the character’s hand).\n\nDeconstruction Details — Core Iteration Areas\n\nClothing Layers (Enhanced):\nBreak down the character’s outfit into individual clothing pieces. If the outfit has multiple layers, show the inner layers after removing outer garments.\n\nNew: Intimate Apparel Breakdown:\nIndependently display the character’s innerwear, emphasizing design and material quality. Examples include matching lace bra and panties (with lace pattern details), thong underwear (highlighting cut and structure), stockings (showing sheerness and top-band design), shapewear, or safety shorts.\n\nExpression Sheet:\nDraw 3–4 different head close-ups in the corners, showing varied emotions such as indifference, shyness, surprise, absent-mindedness, or focused concentration while applying lipstick.\n\nTexture & Zoom (Enhanced):\nSelect 1–2 key areas for magnified close-ups, such as fabric folds, skin texture, or detailed hands.\n\nNew: Object Material Close-ups:\nAdd detailed material studies of small items, such as the creamy sheen of lipstick, the grain of a leather handbag, or the fine powder texture of cosmetics.\n\nRelated Items (Deep Iteration):\nThis section should go beyond large props and instead present slices of the character’s daily life.\n\nBag and Contents:\nIllustrate the character’s everyday handbag or clutch opened up, with its contents laid out nearby.\n\nBeauty & Grooming:\nShow commonly used cosmetics and care items, such as specific lipstick or lip gloss shades, compact powder cases with mirrors, perfume bottle designs, and hand cream.\n\nLifestyle & Intimate Items:\nMaterialize the character’s hidden, private side. Depending on personality, this may include a private diary, daily medication or supplement box, an e-cigarette, or more personal items. If adult products are included, they should be depicted objectively from a design-sheet perspective, with model names or design features clearly labeled.\n\nStyle & Annotations\n\nArt Style: Maintain a high-quality 2D illustration style or concept sketch style with clean, confident linework.\nBackground: Use beige, parchment-like, or light gray textured backgrounds to evoke a design draft or concept sheet atmosphere.\nText Notes: Add simulated handwritten annotations next to each element, briefly describing materials (for example, “soft lace,” “matte leather”) or subtle brand/model hints (such as “daily shade #520,” “custom edition”).\n\nWorkflow\n\nWhen the user provides an image or description:\n\nAnalyze the character’s core features, fashion style, and implied personality.\n\nExtract first-level elements (outerwear, shoes, major expressions).\n\nDesign second-level depth elements through creative inference (what style of underwear she wears, what lipstick is in her bag, what items she uses when alone).\n\nGenerate a single composite image containing all elements, ensuring accurate perspective, consistent lighting, and clear annotations.\n\nOutput in English, labeled in English, in high-resolution 4K HD quality.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "4:3",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/cb014669-a912-4683-9ac7-d1e18b23bcfc.webp",
    "alt": "请创建诸葛连弩的复古风格工程爆炸图，里面的文字是中文",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "9:16",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/4b35fed6-c564-4acd-9a93-cefb08f4820e.webp",
    "alt": "Make a 4×4 grid starting with the 1880s. In each section, I should appear styled according to that decade (clothing, hairstyle, facial hair, accessories). Use colors, background, & film style accordingly.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "16:9",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/b51efcf8-581f-42a8-9f7b-db1685aba212.webp",
    "alt": "Create a detailed visual chart showing the full evolution of “Super Saiyan–style transformations”, using an original Saiyan-inspired warrior , depicted in multiple stages from base form to divine transformations",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/b7fdef2f-321e-4588-a67b-65bb97c57e9c.webp",
    "alt": "Create an image of this person as an artist painting a tiny miniature figurine version of themselves. The person is wearing their most iconic signature outfit, looking directly at the camera with a confident expression while holding a tiny paintbrush in one hand. The small action figure-sized version of themselves is prominently placed on a clean workbench in front of them - make the miniature slightly larger and more visible than realistic scale so it clearly stands out. The miniature figure is also wearing the same iconic outfit in a signature pose. Minimal art supplies on the workbench to avoid clutter - just 2-3 small paint bottles and one extra brush, keeping the focus on the person and their miniature. Soft neutral white background, professional studio lighting, shallow depth of field. The composition emphasizes the person’s face looking at camera and the miniature figure they’re working on. Clean, uncluttered, photorealistic style with high detail on both figures",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "3:4",
    "resolution": "4K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/81f67949-3e68-4831-bba2-03dc597d6cad.webp",
    "alt": "Create a grid of 5 different hairstyles for this women. List the name of each hairstyle and the brief history about the hairstyle. They can be from any era.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "3:4",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/6096c0af-0f5f-4c54-ba64-d47c7b914b22.webp",
    "alt": "Generate a sunset image at coordinates 36.4602° N, 25.3730° E",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "9:16",
    "resolution": "4K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/ebd50a2f-cbd8-4888-82f0-7ee039e52981.webp",
    "alt": "Place Monkey D. Luffy next to the man, smiling widely with his straw hat tilted. Use a Thousand Sunny deck background with bright blue sky. Keep the selfie composition intact and integrate both characters naturally.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "4:3",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/957eefb6-1f33-4417-b265-b53b8b7fee8f.webp",
    "alt": "A photorealistic ESC keycap scene shows a miniature cozy living room setup. Inside: a glowing red Netflix screen, a plush red couch, popcorn bowl, and throw blanket. A small figure lounges with feet up, watching content. The red “N” logo glows from behind like mood lighting. Outside: cool tech-blue reflections on F1, Shift, and Q keys. The word “ESC” is subtly present in a glassy fog on top of the cap.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/fb41d6b5-74ee-49a8-b79f-43d4ec0adf41.webp",
    "alt": "Create a highly detailed miniature surreal scene in which tiny human figures interact realistically with the Hamburger product shown in the reference image. The characters should behave as if the product is their entire world, with all visual elements naturally adapting to the product’s shape, scale, and characteristics—without any forced or predefined assumptions.\n\nEnsure that the interactions between the figures and the product subtly and coherently convey the Hamburger brand identity and its intended use. Use a clean visual composition with a minimalist background to keep the focus on the product and the storytelling.\n\nApply cinematic lighting, crisp shadows, and sharp photographic techniques. Seamlessly integrate the Hamburger logo into the scene, and add a short tagline that naturally adapts to the product context.\n\nRequirements:\n1:1 aspect ratio · ultra-detailed · photorealistic · clean, professional production style.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "3:4",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/f0b47c40-32d3-4ca8-b87e-9b309ea81144.webp",
    "alt": "Generate a detailed infographic that explains the four seasons as experienced in New York City, United States. The infographic is designed for a Grade 3 classroom and should be presented in the distinctive, colorful collage style of Eric Carle, with child-friendly illustrations, clear labels, and simple explanations suitable for young learners.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "1:1",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/6da2bdb7-8d1f-43a0-8e4c-d5055e846127.webp",
    "alt": "请用中文制作一张高细节的3D信息图海报，介绍印尼传统天贝的制作过程，海报中需包含一个可爱的3D厨师角色Koki Cubby（胖乎乎的，可爱，戴着白色厨师帽和围裙，表情丰富，色彩鲜艳）。\n制作过程的每个步骤都应有Koki Cubby的帮助或讲解。\n海报颜色：白色、叶绿色、大豆黄、天贝棕色。\n视觉风格：3D半写实食物插画+可爱角色，柔和的光线，高细节。\n大标题：\n“天贝制作过程——从大豆到成品”\n主图：\n逼真的3D天贝盒，盒身用香蕉叶或半透明塑料包裹，盒内有纹理清晰的天贝切片和白色酵母（根霉菌）丝。Koki Cubby站在旁边，指着成品天贝。\n大豆挑选与分拣（3D场景）\n• 木桌上摆放着干大豆的3D插图。\n• 厨师库比拿着小铲子检查大豆的质量。\n• 文字：“选择优质、干净、无破损的大豆。”\n大豆浸泡（3D碗）\n• 大豆浸泡在一大碗水中，可见其膨胀。\n• 3D水泡。\n• 厨师库比用锅铲搅拌水。\n• 文字：“浸泡6-12小时，让大豆膨胀。”\n• 煮沸（3D锅蒸）\n• 一大锅大豆正在煮沸。\n• 3D热蒸汽细节。\n• 厨师库比拿着厨房计时器。\n• 文字：“煮至软烂，杀死有害细菌。”\n• 大豆去皮及去缩\n• 挤压并揉搓大豆以去除外皮。\n• 使用小型3D过滤机或手工操作。\n• 厨师Cubby正在帮忙去除大豆皮。\n• 文字：“去除大豆皮有助于酵母发酵。”\n大豆过筛及干燥\n• 将湿大豆放入大筛子中沥干水分。\n• 厨师Cubby用小风扇吹干或用毛巾吸干水分。\n• 文字：“确保大豆干燥——水分过多会抑制发酵。”\n• 添加天贝酵母（根霉菌）\n• 一碗3D酵母呈白色细粉状。\n• 厨师Cubby将酵母均匀地撒在大豆上。\n• 文字：“将天贝酵母搅拌均匀。”\n• 包裹（叶子/塑料袋）\n• 将大豆放入香蕉叶或带孔塑料袋中。\n• 小厨师卡比用小手按压，使之折叠整齐。\n• 文字：“包裹紧实，才能完美发酵。”\n天贝发酵（24-48 小时）\n• 将天贝放在通风的木架上。\n• 由于根霉菌的作用，天贝的质地开始变白。\n• 小厨师卡比坐在一旁等待，看着温度计。\n• 文字：“在 30-32°C 下发酵。”\n天贝发酵完成\n• 天贝质地紧实，呈白色，带有粗壮整齐的酵母纤维。\n• 逼真的 3D 天贝切片展示了其内部纹理。\n• 小厨师卡比竖起大拇指。\n• 文字：“天贝可以烹饪了——美味、健康、富含蛋白质！”\n海报风格\n• 3D 立体信息图，采用简洁的面板、小图标和连接时间线。\n• 柔和的白绿色渐变背景。\n• 大豆和豆豉带有微妙的光晕。\n• 现代无衬线字体。\n• 4K 高分辨率。\n• 简洁、专业、教育性强，适合儿童和成人阅读。\n把这个提示词中的食物改成小笼包",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "3:4",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/ba1bd002-b914-415c-9306-4e3fef67b47f.webp",
    "alt": "Einstein, with his disheveled hair, stared at his smartphone in confusion, attempting to take a selfie. Elon Musk stood beside him, patiently pointing at the screen to teach him.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "9:16",
    "resolution": "4K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/df29e7d4-1170-4674-a9c8-17d932c61961.webp",
    "alt": "A vibrant Pixar-style 3D animated scene depicting a joyful group selfie moment featuring Frodo, Sam, Aragorn, Gandalf, Legolas, and Gimli in a culturally representative fantasy environment inspired by Middle-earth.\n\nAt the center, Frodo confidently holds a selfie stick topped with an iPhone, wearing an expression that clearly reflects his brave yet gentle determination and exudes a quiet heroic presence.\n\nTo the left, Sam adopts a warm, supportive pose, leaning in closely with a heartfelt smile that vividly captures his loyal, caring, and earnest personality.\n\nOn the right side, Gimli strikes a playful and humorous pose, holding his iconic battle axe, with an exaggerated, lively facial expression highlighting his bold, fiery, and comedic spirit.\n\nNearby, Aragorn stands slightly behind the group with a calm, protective posture, his expressive face conveying noble leadership, strength, and quiet confidence.\n\nClose to him, Legolas performs a graceful, relaxed pose with effortless balance, bearing a serene expression that encapsulates his elegant, sharp, and composed personality.\n\nHovering slightly above or standing behind the group, Gandalf smiles wisely while holding his staff, his expressive face reflecting wisdom, warmth, and gentle authority.\n\nAll characters wear bright, cheerful, adorably rounded outfits styled in a contemporary fusion of traditional fantasy attire and modern elements, reflecting their cultural and historical backgrounds in a lighthearted Pixar-inspired way.\n\nThe scene is warmly lit, colorful, and filled with dynamic expressions and lively poses. The background features a fantasy landscape emblematic of their identities—rolling green hills, distant mountains, ancient stone architecture, and glowing natural light—rendered in the adorable, cinematic style characteristic of Pixar animations.\n\nThe overall composition exudes energy, humor, and heartwarming joy, capturing the essence of each character through their selfie expressions and playful postures.\n\nSELECT\nEXPORT",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "3:4",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/97d3f39f-a554-4178-a544-bd6619e7c5b0.webp",
    "alt": "A stylish vertical illustration imbued with a summer vibe. The background features a hand-drawn blue ocean wave texture and beach color blocks, rendered in a colored pencil texture. The protagonist sticker is dressed in a resort-style long dress or swimsuit, basking in the bright sunshine. The Labubu doll sticker wears a Hawaiian shirt, holding a surfboard or a swim ring. Accessory stickers include a straw bag and sunglasses. The hidden layer sticker showcases a set of exquisite lace bikinis or sheer blouses, displayed in a tiled manner. Surrounding the scene are cute doodles of palm trees, the sun, and cocktails. In the corner of the sticker, there is a handwritten travel note reading \"Was here\". The overall atmosphere is relaxed and joyful, resembling a scanned page from a travel scrapbook.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "4:3",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/44637cf9-e203-4d9b-a439-a8ec23ffa696.webp",
    "alt": "{\n  \"scene_description\": \"A playful, high-energy fisheye portrait of a stylish young woman sitting inside a metal shopping cart in a vibrant supermarket aisle.\",\n  \"subject\": {\n    \"type\": \"young woman\",\n    \"age\": \"early 20s\",\n    \"features\": {\n      \"hair\": \"long dark brown hair tied in loose low pigtails\",\n      \"expression\": \"playful wink, slight smile\",\n      \"hands\": \"long manicured nails, making a finger-frame gesture around her eye\"\n    },\n    \"attire\": \"black tank top, blue and white plaid shirt tied around the waist, white scrunched socks\",\n    \"footwear\": \"oversized chunky white sneakers with light blue accents and thick laces\",\n    \"position\": \"sitting inside a wire shopping cart, legs extended toward the camera lens creating foreshortening\"\n  },\n  \"action\": {\n    \"primary\": \"posing playfully inside a shopping cart\",\n    \"secondary\": \"framing her winking eye with her fingers using an 'L' shape gesture\",\n    \"effect\": \"dynamic distortion emphasizing the sneakers and hands due to the lens\"\n  },\n  \"environment\": {\n    \"setting\": \"brightly lit grocery store snack aisle\",\n    \"foreground_elements\": [\n      \"silver metal wire of the shopping cart\",\n      \"chunky sneaker sole in extreme close-up\"\n    ],\n    \"background_elements\": [\n      \"shelves stocked with colorful snack bags (yellow, red, green packaging)\",\n      \"overhead fluorescent lights\",\n      \"tiled supermarket floor\",\n      \"promotional signage on shelves\"\n    ]\n  },\n  \"lighting\": {\n    \"style\": \"high-key, flat commercial lighting\",\n    \"key_light\": {\n      \"type\": \"overhead fluorescent tubes\",\n      \"color\": \"cool white/neutral\",\n      \"illuminates\": [\n        \"entire aisle evenly\",\n        \"reflections on plastic snack packaging\",\n        \"sheen on the metal cart\"\n      ]\n    },\n    \"shadows\": \"minimal, soft shadows beneath the cart\"\n  },\n  \"style\": {\n    \"medium\": \"digital photography\",\n    \"aesthetic\": \"Gen Z social media trend, Y2K influence, street style\",\n    \"quality\": \"high definition, vibrant colors\",\n    \"details\": \"sharp focus throughout\"\n  },\n  \"scene_composition\": {\n    \"subject_action\": \"Leaning back casually in the cart, engaging directly with the camera\",\n    \"camera_behavior\": \"Extreme close-up, wide-angle distortion\",\n    \"depth_layering\": \"Exaggerated foreground (shoes) -> Middle ground (subject) -> Curved background (shelves)\"\n  },\n  \"visual_description\": {\n    \"core_subject\": \"A trendy young woman with a fun, carefree attitude.\",\n    \"attire_physics\": \"The plaid shirt is bunched naturally around the waist; the shoe laces appear large and textured due to proximity.\",\n    \"skin_rendering\": \"Smooth, bright complexion, soft makeup with emphasized blush.\"\n  },\n  \"lighting_and_atmosphere\": {\n    \"type\": \"Artificial Interior Lighting\",\n    \"specifics\": \"Even, bright illumination typical of retail environments, creating vibrant color pop on the merchandise.\",\n    \"color_grade\": \"Slightly overexposed highlights, saturated primaries (reds, yellows, blues).\"\n  },\n  \"attire_customization\": {\n    \"current_clothing\": \"Black tank top, plaid shirt (blue/white/grey), denim shorts (hidden), white chunky sneakers.\",\n    \"customizable_clothing\": \"Leave empty to maintain current style or replace with 'oversized hoodie' for a different vibe.\"\n  },\n  \"brand_product_customization\": {\n    \"current_brand_product\": \"Generic colorful potato chip bags and snack packaging in background.\",\n    \"customizable_brand\": \"User can insert specific snack brand names for the shelves.\",\n    \"customizable_product\": \"User can specify the type of sneaker (e.g., Jordan, Balenciaga).\",\n    \"product_placement_area\": \"The shelves behind the subject or the yellow bag inside the cart.\"\n  },\n  \"objects_and_props\": {\n    \"main_objects\": [\n      \"Metal shopping cart\",\n      \"Chunky sneakers\"\n    ],\n    \"secondary_objects\": [\n      \"Yellow snack bag inside the cart\",\n      \"Silver scrunched bracelet\"\n    ]\n  },\n  \"camera_and_lens\": {\n    \"focal_length_feel\": \"8mm to 10mm Fisheye\",\n    \"aperture_effect\": \"Deep depth of field (f/8 or f/11)\",\n    \"camera_angle\": \"High angle / POV looking down into the cart\",\n    \"lens_type\": \"Ultra-wide angle fisheye lens\",\n    \"bokeh_style\": \"None (everything in focus)\"\n  }\n}",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "3:4",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/80c6a8c1-6d84-47b6-8622-f1fd782b015f.webp",
    "alt": "Present a clear, 45° top-down isometric miniature 3D cartoon scene of [CITY], featuring its most iconic landmarks and architectural elements. Use soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. Integrate the current weather conditions directly into the city environment to create an immersive atmospheric mood.\nUse a clean, minimalistic composition with a soft, solid-colored background.\n\nAt the top-center, place the title “Paris” in large bold text, a prominent weather icon beneath it, then the date (small text) and temperature (medium text).\nAll text must be centered with consistent spacing, and may subtly overlap the tops of the buildings.\nSquare 1080x1080 dimension.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "4:3",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/0065f82f-2581-4620-87bd-994ccc386bbc.webp",
    "alt": "Create a colorful Y2K scrapbook–style poster collage with a vibrant, chaotic-yet-balanced aesthetic. The image should feel like an early-2000s magazine scrapbook filled with stickers, cutouts, doodles, and playful graphic elements. The overall style is frameless, highly artistic, visually dense, and extremely engaging.\n\nThe same young Y2K-styled woman appears multiple times throughout the collage, wearing the same outfit and hairstyle in every appearance, but shown in different poses and cutout-style compositions. Her identity must remain perfectly consistent across all instances, with full face-lock accuracy and no facial distortion or changes.\n\nThe collage includes the following scenes and poses:\n\nA close-up shot where she forms a heart shape with her fingers\n\nA full-body squatting pose, resting her chin on her hand while holding a white Polaroid camera\n\nA mid-shot touching her cheek while blowing pink bubblegum\n\nA mid-shot smiling elegantly while holding a cat\n\nA seated pose with one eye winking and a peace sign gesture\n\nA mid-shot holding a bouquet of daisy flowers\n\nAt the center of the composition is the main subject in a confident, playful Y2K pose. She slightly pops one hip to the side, faces the camera directly with a cute-cool expression and a subtle pout, and holds a lens-flare keychain in one hand. The vibe is candid, nostalgic, and unmistakably early 2000s.\n\nHer outfit consists of a cropped oversized pastel sweater decorated with embroidered patches, paired with a pastel skirt and a white belt. She wears white ankle socks with colorful pastel stripes and white sneakers. Accessories include colorful plastic bracelets, chunky bright rings, and a sparkling belly chain.\n\nHer hairstyle is a classic Y2K half-up, half-down look with wavy dark brown hair. The lower strands are tinted bubblegum pink, with thin front tendrils framing the face and pastel flower clips adding a playful touch.\n\nThe collage is packed with additional visual elements such as heart, star, and butterfly stickers, retro sparkles, Polaroid frames, neon outlines, doodle borders, and magazine-style cutout text reading “SO CUTE!”, “199X!”, and “GIRL VIBES”. The lighting is pastel and dreamy, with a glossy retro glow and holographic textures, pastel gradients, glitter accents, and playful doodles layered throughout.\n\nColor grading is bold and cinematic with a neon Y2K palette. Lighting resembles soft on-camera flash. Skin texture appears smooth and glossy, consistent with high-end Y2K editorial imagery. The rendering is high-detail, hyperrealistic within the Y2K aesthetic, in ultra-high resolution, with a perfectly balanced and artistic composition.\n\nAvoid anything that breaks the Y2K style. Do not include modern 2020s fashion, messy layouts, blurred faces, distorted hands, extra limbs, warped facial features, low resolution, heavy grain, muted colors, watermarks, or visible AI artifacts. The final image should feel polished, nostalgic, and authentically Y2K rather than modern or realistic in a contemporary sense.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "4:3",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/35cceef0-3457-4981-82ad-55d53cc7f465.webp",
    "alt": "Create a breathtaking cinematic scene using the same child from the uploaded reference image. The person’s face, facial structure, hairstyle, age, and overall identity must be strictly preserved. Do not change or reinterpret the character’s appearance. The final image must clearly depict the exact same individual as in the uploaded photo.\n\nThe shot is composed as a wide, aerial long shot with a bird’s-eye perspective. The camera is positioned at approximately a 60-degree angle relative to the character, carefully arranged so the person does not block the city skyline and the night view remains fully visible.\n\nThe child appears facing the camera from the front, wearing an expression of excitement and joy. The child is standing on a high vantage point overlooking the city, performing a cheerful gesture with both hands raised over the shoulders, forming a heart shape. The pose feels celebratory, innocent, and full of wonder.\n\nThe child is wearing festive clothing that matches and harmonizes with the culture and landmarks of Hong Kong, replacing any original outfit from the reference image while keeping the character’s identity intact. The clothing style should feel appropriate for a New Year celebration and visually blend with the city’s atmosphere.\n\nThe background features a stunning night view of Victoria Harbour, Hong Kong, with the city skyline glowing brilliantly. Iconic skyscrapers, harbor reflections, and city lights are clearly visible under a star-filled night sky.\n\nThe sky is illuminated by a spectacular fireworks display customized for the celebration. Large, radiant golden fireworks form the number “2026” clearly in the center of the sky. Additional colorful fireworks burst across the scene, enhancing the festive and magical mood.\n\nThe image is rendered in ultra-high resolution with photorealistic detail, cinematic lighting, and subtle film grain. The overall atmosphere is dreamy, grand, and hopeful, conveying a sense of celebration, new beginnings, and awe while maintaining a realistic, photographic look rather than a CGI or illustrated style.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "4:3",
    "resolution": "4K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/5c2e6b23-1e55-4898-bbe5-5bdda4139811.webp",
    "alt": "Create a photorealistic 3×3 grid collage featuring the same young woman from the previous image. The person’s face, facial proportions, hairstyle, and overall identity must remain exactly consistent with the previously generated image. Do not change her appearance, reinterpret her facial features, or introduce a different person. The collage must clearly depict the same individual across all frames.\n\nThe scene takes place on a snowy forest road during winter, surrounded by tall pine trees on an overcast winter day. A black SUV is visible in the background in some of the frames, reinforcing a winter travel atmosphere.\n\nThe woman is dressed in a brown teddy coat layered over a white crop top, paired with grey sweatpants, beige boots, and a brown beanie. Her long, wavy brown hair flows naturally beneath the beanie. Her expressions vary across the grid, showing happy, laughing, smiling, candid moments that feel natural and spontaneous.\n\nThe collage includes a mix of shot types: full-body shots, close-up portraits, high-angle views, and a rear-view shot to create visual variety while maintaining identity consistency. Each image should feel like part of the same moment and environment.\n\nLighting is soft, natural, overcast daylight with realistic shadows and true-to-life winter tones. The overall style is a lifestyle travel photo dump commonly seen on social media—energetic, authentic, and casual, yet highly realistic and photographic.\n\nThe final result should feel like a genuine winter travel collage captured by a real camera, with no artificial styling, no CGI or rendered look, and no changes to the subject’s identity.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "3:4",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/58baae8c-7f7f-49fc-bcd9-27a7b24a8942.webp",
    "alt": "Create a hyper-realistic optical-illusion photograph using the uploaded reference portrait. The woman from the reference image appears to be emerging from a freshly developed instant photo (Polaroid-style) that is lying on a small café table. Inside the instant photo frame, her full outfit is visible. In reality, her upper body and head rise out of the glossy photo print, clearly breaking the boundary between the photo and the real world, and casting a realistic shadow onto the table surface.\n\nHer identity must be strictly preserved from the uploaded portrait. Do not alter her facial structure, hairline, or overall likeness. No face morphing or reinterpretation is allowed. She appears to be in her 20s and looks directly at the viewer with playful, confident eyes. Her mouth is pouting or blowing a kiss, giving a chic, charming, and engaging expression.\n\nHer hair is styled in long, loose waves with realistic shine and slight natural movement, as if caught by a gentle breeze. Her pose shows her upper torso emerging out of the instant photo, with one hand slightly reaching forward, as if she is stepping into reality. The overall feeling is energetic, spontaneous, and full of life.\n\nShe is wearing a high-neck knit turtleneck with premium textile detail. Inside the instant photo, her full outfit is visible, including a mini skirt and leather boots, with the boots clearly shown within the photo frame.\n\nThe instant photo itself looks physically real and tactile, with a glossy surface, subtle fingerprint smudges, and tiny micro-scratches. At the bottom of the instant photo frame, there is a small printed caption line that is clearly readable and not mirrored. All text on the photo must be correctly oriented and fully legible.\n\nOn the surface of the instant photo, add white handwritten marker-style annotations with arrows pointing to specific clothing items. One annotation reads “leather boots” pointing to the boots inside the photo. Another reads “clean turtleneck” pointing to the top. A third reads “mini skirt” pointing to the skirt. All handwritten text must be sharp, readable, and not mirrored.\n\nThe image should be shot in a DSLR photorealistic style, using a macro-lens look to emphasize the texture of the instant photo print. Use forced-perspective composite realism to sell the pop-out illusion. The camera angle is a close, intimate top-down three-quarter view. The aspect ratio is 3:4.\n\nLighting is soft, overcast daylight with natural, believable shadows. Depth of field is shallow, with the instant photo and her face in sharp focus while the background café environment falls into soft bokeh.\n\nThe background setting is a Paris sidewalk café in autumn, featuring a small espresso cup, fallen leaves, stone pavement, and softly blurred pedestrians in the distance.\n\nThe overall mood is fashion-forward and viral, telling a story of an outfit-of-the-day breakdown escaping from a photograph. The image must feel authentic and photographic, not CGI or 3D rendered. Emphasize real-world textures, realistic skin detail, and a strong pop-out illusion with convincing shadows.\n\nAvoid any 3D render look, cartoon or anime style, plastic skin, illegible or mirrored text, oversharpened halos, uncanny facial features, or fake glossy CGI prints.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "9:16",
    "resolution": "4K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/98dd0615-b54b-464b-9596-bf5e8dd32d7c.webp",
    "alt": "Create a YouTube thumbnail for this hand-drawn image using modern typography and a realistic visual style.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "3:4",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/77c639ff-c229-4435-b521-a68da2cca558.webp",
    "alt": "Create a 16:9 YouTube thumbnail featuring a surprised woman standing in a dramatic yet softly lit environment, with glowing particles in the background. She is holding a brightly glowing yellow banana with both hands, as if amazed by it. The lighting is cinematic with cool-toned colors. Her mouth is open in awe. On the right side, place bold, eye-catching yellow text reading “Nano Banana Pro,” with smaller white text above it saying “Could this be?”. A white dashed arrow points toward the glowing banana.",
    "model": "nano-banana-pro",
    "type": "text-to-image",
    "ratio": "4:3",
    "resolution": "1K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/c6560e76-1fba-432d-9867-49e5ed4e759d.webp",
    "alt": "生成一张适用于小学生的教育海报，图中是“守株待兔”成语的画面，一棵大树下，农夫静静守着，兔子撞到树桩，突出“守”和“待”的情境。所有文案用中文。",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "1:1",
    "resolution": "4K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/e66b01d4-81e6-4f1e-9e5d-77e6074aadb4.webp",
    "alt": "A simple line-drawing tutorial showing how to draw Pikachu, presented as a step-by-step nine-panel grid.\nStep one: draw a round head.\nStep two: draw the long ears.\nStep three: draw the facial features.\nGradually add the lightning-shaped tail.\nFinal step: add color—bright yellow with red cheeks.\nUse bold outlines in a child-friendly teaching style, on a white background.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "4:3",
    "resolution": "2K"
  },
  {
    "src": "https://r2.nanobananaimg.com/images/2026-01-02/b502f6d3-da90-42a4-9078-6e6f52c2b7b3.webp",
    "alt": "Using the uploaded image as the facial reference, generate an editorial photograph while strictly preserving the person’s original facial features, proportions, and identity. The face must remain exactly recognizable as the person in the uploaded image. Do not change facial structure, eye shape, nose, mouth, jawline, or overall likeness. No face swapping, beautification, or reinterpretation—only natural lighting and realism are allowed.\n\nThe woman is seated on a warm-toned banquette inside an elegant, upscale restaurant during the evening. She is shown in a refined profile pose, looking slightly to the side, not directly at the camera. Her expression should remain natural and consistent with the reference image.\n\nShe wears a fitted deep red strapless dress with a matching draped scarf detail, conveying a sophisticated and luxurious mood. In her right hand, she holds a white wine glass; in her left hand, she holds a clutch bag. Her posture is poised, relaxed, and confident.\n\nThe environment is a high-end fine-dining interior with gold accents, subtle mirrors, and an elegant table setting, creating a premium, upscale atmosphere.\n\nLighting should be warm and cinematic, similar to soft tungsten light, with gentle shadows and a subtle natural glow on the skin. Use a 35mm prime lens look with shallow depth of field and a softly blurred background. Focus should be sharp on the face and the wine glass.\n\nApply realistic, cinematic color grading with a refined editorial fashion aesthetic. Maintain natural skin texture and subtle film grain. Avoid any artificial smoothing or stylized facial changes.\n\nStrictly avoid over-sharpening, AI artifacts, distorted facial features, altered identity, extra fingers, warped jewelry, deformed glass, strange reflections, text, watermarks, or low-resolution output.",
    "model": "nano-banana-pro",
    "type": "image-to-image",
    "ratio": "3:4",
    "resolution": "2K"
  }
];
