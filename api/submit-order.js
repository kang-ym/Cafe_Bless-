export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
  
    const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbx5CUwHjrJDz6xUnNxgItonXlRQq0jyzccc1BQ7f2N2IzyAfqihG3A5r-RN_hlYQQr5/exec';
  
    const data = req.body;
  
    try {
      const response = await fetch(googleAppsScriptUrl, {
        method: 'POST',
        body: new URLSearchParams({ data: JSON.stringify(data) }),
      });
  
      const text = await response.text();
  
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).send(text);
    } catch (error) {
      console.error('❌ 프록시 오류:', error);
      res.status(500).send('Server Error');
    }
  }
  