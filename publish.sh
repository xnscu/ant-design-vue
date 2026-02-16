#!/usr/bin/env bash
set -e

echo "🔧 Generating version file..."
npm run version

echo "📊 Collecting token statistics..."
npm run collect-token-statistic

echo "📋 Generating token meta..."
npm run token-meta

echo "📦 Compiling ES + Lib (ignoring TS errors)..."
node antd-tools/cli/run.js compile --ignore-error

echo "📦 Building dist (UMD)..."
node --max_old_space_size=8192 antd-tools/cli/run.js dist

echo "🌐 Generating locale files..."
node -e "
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, 'locale');
const localeDts = \"import type { Locale } from '../lib/locale-provider';\\ndeclare const localeValues: Locale;\\nexport default localeValues;\";
if (!fs.existsSync(localeDir)) fs.mkdirSync(localeDir);
const files = fs.readdirSync(path.join(__dirname, 'components/locale')).filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'));
files.forEach(file => {
  const locale = file.replace(/\.tsx?$/, '');
  fs.writeFileSync(path.join(localeDir, locale + '.js'), \"module.exports = require('../lib/locale/\" + locale + \"');\");
  fs.writeFileSync(path.join(localeDir, locale + '.d.ts'), localeDts);
});
console.log('Generated ' + (files.length * 2) + ' locale files');
"

echo "🔧 Generating vetur web-types..."
npx tsc -p antd-tools/generator-types/tsconfig.json --strict false --skipLibCheck true 2>/dev/null
node antd-tools/generator-types/index.js

echo "🚀 Publishing to npm..."
npm publish --access public --with-antd-tools --registry https://registry.npmjs.org/

echo "✅ Done! Published @xnscu/ant-design-vue@$(node -p "require('./package.json').version")"
