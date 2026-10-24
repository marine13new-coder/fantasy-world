// FreeLLMWorker.js - Automated JSON Data & Dark Fantasy Content Generator
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_PORT = process.env.PORT || 3001;
const API_HOST = process.env.HOST || '127.0.0.1';
const API_KEY = process.env.FREELLM_KEY || 'freellmapi-e797e7ed1c9a29a2f89636cd474e9d1b5d984027a0b7edb6';

async function askFreeLLM(prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await new Promise((resolve, reject) => {
        const payload = JSON.stringify({
          model: 'auto',
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: 'You are an expert game data designer for a gothic dark fantasy roguelike game (Darkest Dungeon style). You output ONLY valid, strictly parseable JSON without markdown ticks or commentary.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        });

        const req = http.request({
          hostname: API_HOST,
          port: API_PORT,
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          timeout: 45000
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(body);
                const content = parsed.choices[0].message.content.trim();
                resolve(content);
              } catch (e) {
                reject(new Error(`JSON parse error on response: ${e.message}`));
              }
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            }
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timed out'));
        });
        req.write(payload);
        req.end();
      });
      return result;
    } catch (err) {
      console.warn(`[FreeLLMWorker] Attempt ${attempt + 1} failed: ${err.message}. Retrying...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error(`Failed to query FreeLLMAPI after ${retries} attempts.`);
}

function cleanJsonString(raw) {
  let cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) cleaned = cleaned.substring(startIdx, lastBrace + 1);
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1) cleaned = cleaned.substring(startIdx, lastBracket + 1);
  }
  return cleaned;
}

module.exports = { askFreeLLM, cleanJsonString };
