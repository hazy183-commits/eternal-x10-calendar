const HANDLE='orzelbialyfirstofight';

function decodeXml(value=''){
  return value
    .replace(/&amp;/g,'&')
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>');
}

async function resolveChannelId(){
  const response=await fetch(`https://www.youtube.com/@${HANDLE}/videos`,{
    headers:{
      'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36',
      'accept-language':'pl-PL,pl;q=0.9,en;q=0.8'
    }
  });
  if(!response.ok)throw new Error(`YouTube channel request failed: ${response.status}`);
  const html=await response.text();
  return html.match(/<meta itemprop="channelId" content="([^"]+)"/i)?.[1]
    || html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/)?.[1]
    || null;
}

function parseFeed(xml){
  const entries=[...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  return entries.map((match)=>{
    const block=match[1];
    const id=block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title=decodeXml(block.match(/<media:title>([\s\S]*?)<\/media:title>/)?.[1]?.trim()||'');
    const published=block.match(/<published>([^<]+)<\/published>/)?.[1]||null;
    if(!id)return null;
    return {
      id,
      title:title||'Orzeł Biały — akcja klanu',
      published,
      thumbnail:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    };
  }).filter(Boolean);
}

export default async function handler(req,res){
  try{
    const channelId=await resolveChannelId();
    if(!channelId)throw new Error('Channel ID not found');
    const feed=await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,{
      headers:{'user-agent':'Mozilla/5.0'}
    });
    if(!feed.ok)throw new Error(`YouTube feed request failed: ${feed.status}`);
    const videos=parseFeed(await feed.text());
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
    res.status(200).json({channelId,videos});
  }catch(error){
    res.setHeader('Cache-Control','no-store');
    res.status(500).json({videos:[],error:error instanceof Error?error.message:'Unknown error'});
  }
}
