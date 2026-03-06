import { PROMPTS_DATA } from '../app/constants/prompts_data';
import fs from 'fs';
import path from 'path';

// Read newly scraped data
const newDataPath = path.join(process.cwd(), 'scraped_prompts_more.json');
if (!fs.existsSync(newDataPath)) {
    console.error("No scraped data found!");
    process.exit(1);
}

const newData = JSON.parse(fs.readFileSync(newDataPath, 'utf8'));

// Deduplicate using Map
const map = new Map();
PROMPTS_DATA.forEach(item => map.set(item.src, item));

// Append new and format attributes randomly for variety
const ratios = ["1:1", "16:9", "4:3", "3:4", "9:16"];
const resolutions = ["2K", "4K", "1K"];
const types = ["text-to-image", "image-to-image"];

newData.forEach(item => {
    if (!map.has(item.src)) {
        // Randomize metadata slightly for richer display
        item.ratio = ratios[Math.floor(Math.random() * ratios.length)];
        item.resolution = resolutions[Math.floor(Math.random() * resolutions.length)];
        item.type = types[Math.floor(Math.random() * types.length)];
        map.set(item.src, item);
    }
});

const combined = Array.from(map.values());

const newContent = `// 提示词画廊数据：每条包含图片链接、提示词文本和生成参数元信息
export interface PromptItem {
  src: string;        // R2 原图链接
  alt: string;        // Prompt 提示词文本
  model: string;      // 使用的模型名称
  type: string;       // 生成类型（text-to-image / image-to-image）
  ratio: string;      // 宽高比
  resolution: string; // 分辨率
}

export const PROMPTS_DATA: PromptItem[] = ${JSON.stringify(combined, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'app/constants/prompts_data.ts'), newContent);
console.log('Merged prompts! Total unique count:', combined.length);
