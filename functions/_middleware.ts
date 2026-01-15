const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const response = await context.next();

  // CORSヘッダーを追加
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
};
