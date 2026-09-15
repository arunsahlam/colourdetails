export async function onRequest({ params, env, request }) {
  const { code } = params; // e.g., "ff5733" from /color/ff5733
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Color: #${code}</title>
        <style>
          body { background: #${code}; color: white; font-family: sans-serif; }
        </style>
      </head>
      <body>
        <h1>Background: #${code}</h1>
      </body>
    </html>
  `;
  return new Response(html, {
    headers: { "content-type": "text/html;charset=UTF-8" }
  });
}
