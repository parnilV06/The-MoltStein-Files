import fs from 'fs';
fetch('https://www.moltbook.com/')
  .then(r => r.text())
  .then(t => {
    fs.writeFileSync('moltbook-dom.html', t);
    console.log('Saved moltbook-dom.html');
  });
