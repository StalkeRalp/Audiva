export function dominantCoverColor(pixels){const bins=new Map();for(let i=0;i<pixels.length;i+=4){const r=pixels[i],g=pixels[i+1],b=pixels[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b);if(pixels[i+3]<128||max<24||min>235)continue;const key=[r>>5,g>>5,b>>5].join(':');const bin=bins.get(key)||{r:0,g:0,b:0,count:0,weight:0};bin.r+=r;bin.g+=g;bin.b+=b;bin.count++;bin.weight+=1+(max-min)/128;bins.set(key,bin);}const best=[...bins.values()].sort((a,b)=>b.weight-a.weight)[0];return best?[Math.round(best.r/best.count),Math.round(best.g/best.count),Math.round(best.b/best.count)]:[45,79,77];}
export function coverGradient(rgb){const shade=f=>`rgb(${rgb.map(v=>Math.round(v*f)).join(', ')})`;return `linear-gradient(115deg, ${shade(.48)} 0%, ${shade(.34)} 58%, ${shade(.16)} 100%)`;}
export function vividCoverColor(rgb){
  const [red,green,blue]=(rgb||[55,122,190]).map(value=>Math.min(255,Math.max(0,Number(value)||0))/255);
  const max=Math.max(red,green,blue),min=Math.min(red,green,blue),delta=max-min;
  let hue=0,saturation=0,lightness=(max+min)/2;
  if(delta>0){
    saturation=delta/(1-Math.abs(2*lightness-1));
    if(max===red)hue=60*(((green-blue)/delta)%6);
    else if(max===green)hue=60*((blue-red)/delta+2);
    else hue=60*((red-green)/delta+4);
  }
  hue=(hue+360)%360;
  if(saturation<.13){hue=203;saturation=.62;}
  else saturation=Math.min(.88,Math.max(.58,saturation*1.24));
  lightness=Math.min(.66,Math.max(.48,lightness));
  const chroma=(1-Math.abs(2*lightness-1))*saturation;
  const x=chroma*(1-Math.abs((hue/60)%2-1));
  const match=lightness-chroma/2;
  const channels=hue<60?[chroma,x,0]:hue<120?[x,chroma,0]:hue<180?[0,chroma,x]:hue<240?[0,x,chroma]:hue<300?[x,0,chroma]:[chroma,0,x];
  return channels.map(channel=>Math.round((channel+match)*255));
}
export function extractCoverColor(src){return new Promise(resolve=>{const image=new Image();image.crossOrigin='anonymous';const timer=setTimeout(()=>resolve(null),5000);image.onload=()=>{clearTimeout(timer);try{const canvas=document.createElement('canvas');canvas.width=40;canvas.height=40;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,40,40);resolve(dominantCoverColor(ctx.getImageData(0,0,40,40).data));}catch{resolve(null);}};image.onerror=()=>{clearTimeout(timer);resolve(null);};image.src=src;});}
