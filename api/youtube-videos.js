const HANDLE='orzelbialyfirstofight';

const HEADERS={
  'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36',
  'accept-language':'pl-PL,pl;q=0.9,en;q=0.8',
  'cookie':'SOCS=CAI; CONSENT=YES+cb.20210328-17-p0.en+FX+667'
};

const FALLBACK_TITLE='Orzeł Biały — akcja klanu';

function decodeXml(value=''){
  return value
    .replace(/&amp;/g,'&')
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>');
}

function decodeJsonText(value=''){
  try{return JSON.parse(`"${value.replace(/"/g,'\\"')}"`)}catch{return value.replace(/\\u0026/g,'&').replace(/\\n/g,' ').replace(/\\"/g,'"')}
}

function channelIdFromHtml(html=''){
  const patterns=[
    /<meta[^>]+itemprop=["']channelId["'][^>]+content=["'](UC[a-zA-Z0-9_-]{22})["']/i,
    /<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']*\/channel\/(UC[a-zA-Z0-9_-]{22})/i,
    /feeds\/videos\.xml\?channel_id=(UC[a-zA-Z0-9_-]{22})/i,
    /"externalId":"(UC[a-zA-Z0-9_-]{22})"/,
    /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /"browseId":"(UC[a-zA-Z0-9_-]{22})"/,
    /\\"channelId\\":\\"(UC[a-zA-Z0-9_-]{22})\\"/,
    /\\"browseId\\":\\"(UC[a-zA-Z0-9_-]{22})\\"/,
    /\/channel\/(UC[a-zA-Z0-9_-]{22})/
  ];
  for(const pattern of patterns){
    const id=html.match(pattern)?.[1];
    if(id)return id;
  }
  return null;
}

function videosFromHtml(html=''){
  const seen=new Set();
  const videos=[];
  for(const match of html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)){
    const id=match[1];
    if(seen.has(id))continue;
    seen.add(id);
    const start=Math.max(0,(match.index||0)-600);
    const end=Math.min(html.length,(match.index||0)+2800);
    const nearby=html.slice(start,end);
    const rawTitle=nearby.match(/"title":\{"runs":\[\{"text":"((?:\\.|[^"\\])+)"/)?.[1]
      || nearby.match(/"title":\{"simpleText":"((?:\\.|[^"\\])+)"/)?.[1]
      || nearby.match(/"headline":\{"simpleText":"((?:\\.|[^"\\])+)"/)?.[1]
      || nearby.match(/"accessibility":\{"accessibilityData":\{"label":"((?:\\.|[^"\\])+)"/)?.[1]
      || '';
    videos.push({
      id,
      title:rawTitle?decodeJsonText(rawTitle):FALLBACK_TITLE,
      published:null,
      thumbnail:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    });
    if(videos.length>=40)break;
  }
  return videos;
}

function parseFeed(xml){
  const entries=[...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  return entries.map((match)=>{
    const block=match[1];
    const id=block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title=decodeXml(block.match(/<media:title>([\s\S]*?)<\/media:title>/)?.[1]?.trim()||'');
    const published=block.match(/<published>([^<]+)<\/published>/)?.[1]||null;
    if(!id)return null;
    return {id,title:title||FALLBACK_TITLE,published,thumbnail:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`};
  }).filter(Boolean);
}

async function fetchText(url){
  const response=await fetch(url,{headers:HEADERS,redirect:'follow'});
  if(!response.ok)throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function fetchFeed(url){
  const videos=parseFeed(await fetchText(url));
  if(!videos.length)throw new Error(`empty feed ${url}`);
  return videos;
}

async function fetchOriginalTitle(id){
  try{
    const url=`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
    const response=await fetch(url,{headers:{'user-agent':HEADERS['user-agent']},redirect:'follow'});
    if(!response.ok)return null;
    const data=await response.json();
    return typeof data?.title==='string'&&data.title.trim()?data.title.trim():null;
  }catch{
    return null;
  }
}

async function enrichOriginalTitles(videos=[]){
  const limited=videos.slice(0,30);
  const enriched=await Promise.all(limited.map(async(video)=>{
    const original=await fetchOriginalTitle(video.id);
    return original?{...video,title:original}:video;
  }));
  return [...enriched,...videos.slice(30)];
}

async function discoverFromYoutube(){
  const urls=[
    `https://www.youtube.com/@${HANDLE}/videos?view=0&sort=dd&shelf_id=0`,
    `https://www.youtube.com/@${HANDLE}/videos`,
    `https://www.youtube.com/@${HANDLE}`,
    `https://www.youtube.com/@${HANDLE}/about`,
    `https://m.youtube.com/@${HANDLE}/videos`,
    `https://www.youtube.com/results?search_query=${encodeURIComponent('@'+HANDLE)}`,
    `https://www.youtube.com/results?search_query=${encodeURIComponent(HANDLE)}`
  ];
  const errors=[];
  for(const url of urls){
    try{
      const html=await fetchText(url);
      const channelId=channelIdFromHtml(html);
      if(channelId){
        try{
          const videos=await fetchFeed(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`);
          if(videos.length)return {channelId,videos,source:'youtube-rss'};
        }catch(error){errors.push(error instanceof Error?error.message:'rss failed')}
      }
      const videos=videosFromHtml(html);
      if(videos.length>=2)return {channelId,videos,source:'youtube-html'};
      errors.push(`no videos ${url}`);
    }catch(error){errors.push(error instanceof Error?error.message:'youtube fetch failed')}
  }
  try{
    const videos=await fetchFeed(`https://www.youtube.com/feeds/videos.xml?user=${encodeURIComponent(HANDLE)}`);
    return {channelId:null,videos,source:'youtube-legacy-rss'};
  }catch(error){errors.push(error instanceof Error?error.message:'legacy rss failed')}
  throw new Error(errors.slice(0,6).join(' | '));
}

function normalizeExternalVideos(data){
  const items=Array.isArray(data)?data:(Array.isArray(data?.items)?data.items:[]);
  const seen=new Set();
  const videos=[];
  for(const item of items){
    const id=item?.videoId || item?.id || String(item?.url||'').match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1] || String(item?.url||'').match(/\/watch\/([a-zA-Z0-9_-]{11})/)?.[1];
    if(!id||!/^[-_a-zA-Z0-9]{11}$/.test(id)||seen.has(id))continue;
    seen.add(id);
    const thumb=item?.thumbnail || item?.thumbnailUrl || item?.videoThumbnails?.[0]?.url || item?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    videos.push({id,title:item?.title||FALLBACK_TITLE,published:null,thumbnail:thumb});
  }
  return videos;
}

async function discoverFromPublicFrontends(){
  const endpoints=[
    `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent('@'+HANDLE)}&filter=videos`,
    `https://pipedapi.reallyaweso.me/search?q=${encodeURIComponent('@'+HANDLE)}&filter=videos`,
    `https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent('@'+HANDLE)}&type=video`,
    `https://yewtu.be/api/v1/search?q=${encodeURIComponent('@'+HANDLE)}&type=video`
  ];
  const errors=[];
  for(const url of endpoints){
    try{
      const response=await fetch(url,{headers:{'user-agent':HEADERS['user-agent']},redirect:'follow'});
      if(!response.ok){errors.push(`${response.status} ${url}`);continue;}
      const videos=normalizeExternalVideos(await response.json());
      if(videos.length>=2)return {channelId:null,videos,source:'public-youtube-frontend'};
      errors.push(`empty ${url}`);
    }catch(error){errors.push(error instanceof Error?error.message:'frontend failed')}
  }
  throw new Error(errors.slice(0,4).join(' | '));
}

export default async function handler(req,res){
  const attempts=[];
  try{
    if(process.env.YOUTUBE_CHANNEL_ID?.startsWith('UC')){
      try{
        const videos=await enrichOriginalTitles(await fetchFeed(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(process.env.YOUTUBE_CHANNEL_ID)}`));
        res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
        return res.status(200).json({channelId:process.env.YOUTUBE_CHANNEL_ID,videos,source:'env-rss'});
      }catch(error){attempts.push(error instanceof Error?error.message:'env rss failed')}
    }

    for(const discover of [discoverFromYoutube,discoverFromPublicFrontends]){
      try{
        const result=await discover();
        if(result.videos?.length){
          result.videos=await enrichOriginalTitles(result.videos);
          res.setHeader('Cache-Control','s-maxage=180, stale-while-revalidate=600');
          return res.status(200).json(result);
        }
      }catch(error){attempts.push(error instanceof Error?error.message:'discovery failed')}
    }

    throw new Error(attempts.join(' || ')||'No YouTube videos found');
  }catch(error){
    res.setHeader('Cache-Control','no-store');
    res.status(500).json({videos:[],error:error instanceof Error?error.message:'Unknown error'});
  }
}
