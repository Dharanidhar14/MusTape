const fs = require('fs');

async function findApiUrl() {
  try {
    const htmlRes = await fetch('https://mus-tape.vercel.app/');
    const html = await htmlRes.text();
    const scriptRegex = /<script[^>]+src=\"([^\"]+)\"/g;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      let src = match[1];
      if (src.startsWith('/')) src = 'https://mus-tape.vercel.app' + src;
      try {
        const jsRes = await fetch(src);
        const js = await jsRes.text();
        const urls = js.match(/https:\/\/[a-zA-Z0-9-]+\.onrender\.com/g);
        if (urls) {
          console.log('Found URL in ' + src + ':', urls[0]);
          return;
        }
      } catch(e) {}
    }
    console.log('Could not find API URL');
  } catch (error) {
    console.error(error);
  }
}
findApiUrl();
