// Decode a separate frame without seeking or interrupting the persistent player.
export function captureVideoFrame(src, position = 1) {
  return new Promise(resolve => {
    const video=document.createElement('video');video.crossOrigin='anonymous';video.muted=true;video.preload='auto';video.playsInline=true;
    const finish=value=>{clearTimeout(timer);video.onloadedmetadata=null;video.onseeked=null;video.onerror=null;video.removeAttribute('src');video.load();resolve(value);};
    const timer=setTimeout(()=>finish(null),8000);
    video.onerror=()=>finish(null);
    video.onloadedmetadata=()=>{video.currentTime=Math.min(Math.max(.01,position),Math.max(.01,(video.duration||1)-.1));};
    video.onseeked=()=>{try{const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);finish(canvas);}catch{finish(null);}};
    video.src=src;
  });
}
