const HANDLE='orzelbialyfirstofight';

const HEADERS={
  'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36',
  'accept-language':'pl-PL,pl;q=0.9,en;q=0.8'
};

function decodeXml(value=''){
  return value
    .replace(/&amp;/g,'&')
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>');
}

function channelIdFromHtml(html=''){
  const patterns=[
    /<meta[^>]+itemprop=["']channelId["'][^>]+content=["'](UC[a-zA-Z0-9_-]{22})["']/i,
    /<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']*\/channel\/(UC[a-zA-Z0-9_-]{22})/i,
    /feeds\/videos\.xml\?channel_id=(UC[a-zA-Z0-9_-]{22})/i,
    /"externalId":"(UC[a-zA-Z0-9_-]{22})"/,
    /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /"browseId":"(UC[a-zA-Z0-9_-]{22})"/,
    /\/channel\/(UC[a-zA-Z0-9_-]{22})/
  ];
  for(const pattern of patterns){
    const id=html.match(pattern)?.[1];
    if(id)return id;
  }
  return null;
}

async function resolveChannelId(){
  if(process.env.YOUTUBE_CHANNEL_ID?.startsWith('UC'))return process.env.YOUTUBE_CHANNEL_ID;

  const urls=[
    `https://www.youtube.com/@${HANDLE}`,
    `https://www.youtube.com/@${HANDLE}/videos`,
    `https://www.youtube.com/@${HANDLE}/about`,
    `https://m.youtube.com/@${HANDLE}`,
    `https://m.youtube.com/@${HANDLE}/videos`
  ];

  const errors=[];
  for(const url of urls){
    try{
      const response=await fetch(url,{headers:HEADERS,redirect:'follow'});
      if(!response.ok){errors.push(`${response.status} ${url}`);continue;}
      const html=await response.text();
      const id=channelIdFromHtml(html);
      if(id)return id;
      errors.push(`no-id ${url}`);
    }catch(error){
      errors.push(`${error instanceof Error?error.message:'fetch error'} ${url}`);
    }
  }
  throw new Error(`Channel ID not found (${errors.slice(0,3).join(' | ')})`);
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

async function fetchFeedByUrl(url){
  const response=await fetch(url,{headers:HEADERS,redirect:'follow'});
  if(!response.ok)throw new Error(`Feed request failed: ${response.status}`);
  const videos=parseFeed(await response.text());
  if(!videos.length)throw new Error('Feed returned no videos');
  return videos;
}

export default async function handler(req,res){
  try{
    let channelId=null;
    let videos=[];
    const attempts=[];

    try{
      channelId=await resolveChannelId();
      videos=await fetchFeedByUrl(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`);
    }catch(error){
      attempts.push(error instanceof Error?error.message:'channel feed failed');
    }

    if(!videos.length){
      const legacyFeeds=[
        `https://www.youtube.com/feeds/videos.xml?user=${encodeURIComponent(HANDLE)}`,
        `https://www.youtube.com/feeds/videos.xml?user=${encodeURIComponent('@'+HANDLE)}`
      ];
      for(const url of legacyFeeds){
        try{
          videos=await fetchFeedByUrl(url);
          if(videos.length)break;
        }catch(error){
          attempts.push(error instanceof Error?error.message:'legacy feed failed');
        }
      }
    }

    if(!videos.length)throw new Error(attempts.join(' | ')||'No YouTube videos found');

    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
    res.status(200).json({channelId,videos});
  }catch(error){
    res.setHeader('Cache-Control','no-store');
    res.status(500).json({videos:[],error:error instanceof Error?error.message:'Unknown error'});
  }
}
