const fs = require('fs');

console.log('🔧 Generating app configuration file...');

// Read .env file
const envLocal = {};
if (fs.existsSync('.env')) {
  const content = fs.readFileSync('.env', 'utf8');
  content.split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envLocal[key.trim()] = valueParts.join('=').split('#')[0].trim();
      }
    }
  });
}

// Merge with system environment
const env = { ...process.env, ...envLocal };

// Read template
let template = fs.readFileSync('public/config.template.json', 'utf8');

// Replace placeholders
const placeholders = template.match(/\$\{[^}]+\}/g) || [];
placeholders.forEach((placeholder) => {
  const varName = placeholder.slice(2, -1);
  let value = env[varName] || '';

  // Handle boolean values without quotes
  if (varName === 'PRODUCTION') {
    value = value.toLowerCase() === 'true' ? 'true' : 'false';
    console.log(`   ${varName}: ${value}`);
    template = template.replace(new RegExp('\\$\\{' + varName + '\\}', 'g'), value);
  } else {
    console.log(`   ${varName}: ${value}`);
    template = template.replace(new RegExp('\\$\\{' + varName + '\\}', 'g'), value);
  }
});

// Write file
fs.writeFileSync('public/config.json', template);
console.log('✅ File generated successfully: public/config.json');
