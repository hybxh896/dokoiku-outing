(function(){
  'use strict';
  const D=window.DateData,L=window.DateLogic,app=document.querySelector('#app');
  let answers={},route={view:'home'},epoch=0,pending=null;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(label,action,extra='',style='')=>`<button class="button ${style}" data-action="${action}" ${extra}>${label}</button>`;
  const picture=(key)=>{
    const asset=D.imageAssets[key];
    if(asset)return '<span class="image-window standalone" style="aspect-ratio:3/2"><img src="'+esc(asset.src)+'" alt="'+esc(asset.alt)+'" width="1536" height="1024" loading="lazy" decoding="async"></span>';
    const r=D.referenceImages,[x,y,w,h]=r.regions[key];
    return `<span class="image-window" style="aspect-ratio:${w}/${h}"><svg viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><image href="${r.src}" width="${r.width}" height="${r.height}" /></svg></span>`;
  };
  const art=(area,extra='',imageKey=null)=>{
    const d=D.destinations[area];
    if(d.textOnly)return '<div class="plan-banner"><span>近場で、短めのおでかけ</span><p>うどんを食べて、<br>あとはその日の気分で。</p><small>ケーキは、余裕があれば。</small></div>';
    if(d.gallery&&!d.image)return `<figure class="photo-gallery ${d.color} ${extra}"><div class="gallery-main">${picture(imageKey||d.gallery[0])}</div><div class="gallery-thumbs">${d.gallery.slice(1).map(picture).join('')}</div><figcaption>${d.name}のおでかけをイメージ · AI参考画像${d.imageNote?'<br>'+esc(d.imageNote):''}</figcaption></figure>`;
    return `<div class="art ${d.scene} ${extra}" aria-hidden="true"><span class="sun"></span><span class="cloud"></span><span class="water"></span><span class="art-label">A LITTLE DAY OUT</span>${d.image?`<img src="${esc(d.image)}" alt="">`:''}${extra==='hero-art'?'<span class="hero-sticker">気になる場所、<br>見つけよう。</span>':''}</div>`;
  };
  const prototype=()=>`<details class="notice"><summary>試作版について</summary><p>車でのおでかけを想定しています。車での移動負担を順位に反映しています。正確な所要時間の計算ではありません。歩く量の希望は注意書きに反映します。一部の店舗・組み合わせは確認中です。回答はこのページ内だけで使います。</p></details>`;
  function move(next,replace=false){
    clearTimeout(pending);pending=null;
    history.replaceState({...route,epoch,scroll:window.scrollY},'');
    route=next;
    const hash=next.view==='home'?'#home':next.view==='question'?`#question-${next.step}`:next.view==='detail'?`#plan-${next.plan}`:`#${next.view}`;
    history[replace?'replaceState':'pushState']({...route,epoch,scroll:0},'',hash);
    render();
  }
  function reset(){answers={};epoch++;move({view:'home'});}
  function home(){
    return `<section class="fade"><p class="eyebrow">LET'S FIND OUR NEXT STOP</p><h1 class="home-title">次どこ行く？<span>その気分から、<br>おでかけしよう。</span></h1><p class="intro">いくつか質問に答えて、<br>おでかけ先を選んでみよう。</p>${art('awaji','hero-art')}<div class="home-meta"><span class="pill">5〜6問＋任意の希望</span><span>車で、気ままにおでかけ。</span></div>${button('はじめる <span class="arrow">→</span>','start')}<p class="subtext">正解はひとつじゃない。二人で相談してみよう。</p><div class="places-strip">${Object.values(D.destinations).map(d=>`<span>${d.name}</span>`).join('')}</div>${prototype()}</section>`;
  }
  function question(){
    const qs=L.questions(answers);route.step=Math.max(0,Math.min(route.step||0,qs.length-1));
    // A browser-forward entry cannot skip an unanswered prerequisite.
    const first=qs.findIndex(q=>!q.options.some(o=>o.id===answers[q.id]));
    if(first>=0&&route.step>first)route.step=first;
    const q=qs[route.step],total=qs.length;
    return `<section class="fade"><div class="navline"><button class="back" data-action="back">← 戻る</button><span class="step">${route.step+1} / ${total}</span></div><progress aria-label="質問の進み具合" value="${route.step+1}" max="${qs.length}"></progress><p class="eyebrow">${q.eyebrow}</p><h1 class="question-title">${q.title}</h1><p class="hint">${q.hint||''}</p><div class="options" aria-label="回答を選択">${q.options.map(o=>`<button class="option ${answers[q.id]===o.id?'selected':''}" data-action="answer" data-question="${q.id}" data-value="${o.id}" aria-pressed="${answers[q.id]===o.id}"><span class="circle" aria-hidden="true">${answers[q.id]===o.id?'✓':''}</span><span><strong>${o.label}</strong>${o.note?`<small>${o.note}</small>`:''}</span></button>`).join('')}</div><p class="auto-note">ひとつ選ぶと、次の質問へ進みます</p></section>`;
  }
  function reasons(p){
    const list=[];
    if(p.matched)list.push(`${L.label(answers,answers.detail&&!['any','unknown'].includes(answers.detail)?'detail':'main')}の気分に`);
    if(p.companionScore)list.push(`${L.label(answers,'companion')}も楽しめる候補`);
    if(p.matched&&answers.environment===p.environment)list.push(`${answers.environment==='indoor'?'屋内':'屋外'}中心で楽しめる`);
    return list;
  }
  function card(p,index){
    const d=D.destinations[p.area],rs=reasons(p).slice(0,2),notes=[];
    if(d.duration)notes.push(d.duration);
    if(p.id==='byakuan'&&['afternoon','evening'].includes(answers.start))notes.push('白庵は昼と夜の営業の間に休憩があります。曜日ごとの夜営業・麺切れを確認してから出かけよう。');
    if(answers.start==='unknown')notes.push('集合時間が未定のため、利用時間帯はまだ確認していません。');
    const hasEnv=['indoor','outdoor'].includes(answers.environment);
    if(hasEnv&&p.environment&&D.scoring.environment[answers.environment]?.[p.environment]<0)notes.push('屋内・屋外の希望とは少し異なる候補です。');
    if(hasEnv&&!p.environment)notes.push('屋内・屋外の利用条件は確認中です。');
    if(answers.walking==='low')notes.push(p.walkingNote);
    if(p.id==='night')notes.push('夜の滞在と道路の営業時間の確認が必要です。');
    if(p.companions[answers.companion])notes.push(p.companions[answers.companion].reason);
    if(answers.companion&&!['none','unknown'].includes(answers.companion)&&!p.companionScore)notes.push('組み合わせたい希望の具体的な候補・移動は確認中です。');
    const caution=p.timeScore<0?'帰りたい時間に合わせて、往復の移動に余裕を。':p.travelScore<0?'移動は希望より長めです。':notes.shift()||'';
    return `<article class="result-card"><header class="card-body"><span class="rank-label">気分に合う候補 ${index+1}</span><h3>${p.name}</h3><p class="area-name">${d.name}</p></header>${art(p.area,'',p.imageKey)}<div class="card-body"><ul class="brief-reasons">${rs.map(r=>'<li>'+esc(r)+'</li>').join('')}</ul><p class="travel-summary">車での移動：${D.travel.labels[p.travelBand]}</p>${caution?'<p class="caution">'+esc(caution)+'</p>':''}${notes.length?'<details class="notice"><summary>詳しい条件</summary><ul>'+notes.map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul></details>':''}<div class="card-actions">${button('スポットを見る','detail','data-profile="'+D.planGroup(p.id)+'"','outline')}</div></div></article>`;
  }
  function plans(){
    const scored=L.rank(answers,true),groups=new Map();
    for(const p of scored){const id=D.planGroup(p.id);if(!groups.has(id))groups.set(id,{...p,id,name:D.profiles.find(x=>x.id===id).name});}
    return [...groups.values()];
  }
  function mismatch(p){
    if(!L.complete(answers))return '';
    if(!p.scheduleFit)return '今回の予定の長さ・時間帯には余裕が必要です。営業可否は別途確認してください。';
    if(!p.mainScore)return '今回選んだ楽しみ方とは異なる候補です。';
    if(p.travelScore<0)return '希望より移動が長めです。';
    return '今回の条件に合う候補です。';
  }
  function catalog(){
    const all=route.filter==='all',items=plans().filter(p=>all||p.matched);
    return '<section class="fade"><h1>おでかけの候補</h1><p>主役を選んで、近くの寄り道も見てみよう。</p><div class="catalog-tabs">'+['matched','all'].map(f=>'<button class="button outline" data-action="filter" data-filter="'+f+'" aria-pressed="'+(route.filter===f)+'">'+(f==='all'?'すべての候補':'今回の条件に合う候補')+'</button>').join('')+'</div><p>'+items.length+'件のプラン</p>'+(items.length?'':'<p>合う候補が少ない場合は、すべての候補も見てみよう。</p>')+items.map(p=>'<article class="spot catalog-card"><h2>'+esc(p.name)+'</h2><p>'+esc(D.destinations[p.area].name)+'</p><p>車での移動：'+D.travel.labels[p.travelBand]+'</p><p class="hint">'+esc(mismatch(p))+'</p>'+button('詳しく見る','detail','data-profile="'+p.id+'"','outline')+'</article>').join('')+button('診断結果に戻る','results','','outline')+button('条件を変える','review','','outline')+'</section>';
  }
  function results(){
    const ranked=L.rank(answers),matched=ranked.filter(p=>p.matched);
    let content='';
    if(!matched.length){
      const message=answers.detail==='other'?'この分野の希望は残していますが、選択肢以外の好みはまだ比較できません。候補を見たり、回答を見直したりしてみよう。':answers.start==='evening'&&answers.time==='early'?'夕方からの集合と夕方までの帰宅が重なっています。どちらかの時間を見直してみよう。':answers.main==='none'?'まだ目的が決まっていなくても大丈夫。候補を見ながら考えよう。':'今の予定の長さ・集合時間・好みに合う候補は、まだ十分に用意できていません。無理に遠出をすすめず、回答を見直すか候補から相談してみよう。';
      content=`<div class="empty"><h2>候補を見ながら、考えよう。</h2><p>${message}</p></div>`;
    }else{
      const top=matched.slice(0,3);
      content=top.map(card).join('');
      if(top.length<3)content+='<p class="hint">今の主目的に合う候補は'+top.length+'エリアです。ほかの楽しみ方は下の一覧から見られます。</p>';
    }
    return `<section class="fade"><p class="eyebrow">YOUR NEXT LITTLE TRIP</p><h1>今の気分に、<br>合いそうなのは。</h1><p class="result-intro">気になるところを、二人で相談してみよう。<br>${D.travel.origin}からの移動負担も考慮しています。</p>${content}${button('ほかの候補も見る','catalog','','outline')}<details class="notice"><summary>移動の目安について</summary><p>${D.travel.origin}を基準にしています。${D.travel.note}帰宅時刻を保証するものではありません。</p></details><div class="actions">${button('回答を見直す','review','','outline')}${button('もう一度やってみる','reset','','secondary')}</div><details class="notice"><summary>選んだ回答を確認する</summary><ul class="answer-list">${L.questions(answers).map(q=>`<li>${q.title}<strong>${esc(L.label(answers,q.id))}</strong></li>`).join('')}</ul></details>${prototype()}</section>`;
  }
  function detail(){
    const p=D.profiles.find(p=>p.id===route.plan),d=D.destinations[p.area],spec=D.planDetails[p.id];
    const used=new Set(Object.values(spec).flat());
    const groups=[['main','今回の主役'],['near','近くで一緒に楽しむ'],['extra','余裕があれば'],['drive','車で移動する寄り道'],['related','同じエリアの別の候補'],['ending','帰り方']];
    const related=d.spots.map((_,i)=>i).filter(i=>!used.has(i));
    const section=(key,title)=>{
      const ids=key==='related'?related:spec[key]||[];if(!ids.length)return '';
      const note=key==='drive'||key==='related'?'追加の移動と滞在時間の確認が必要です。同じエリアでも、近いとは限りません。':key==='near'?'営業・待ち時間に合わせて選んでください。':key==='extra'?'追加しなくても、このプランは成立します。':'';
      const cards=ids.map(i=>{const [name,description,status]=d.spots[i];return '<article class="spot illustrated-spot"><div class="spot-images">'+(d.spotImages[i]||[]).map(picture).join('')+'</div><div class="spot-copy"><h3>'+esc(name)+'</h3><p>'+esc(description)+'</p>'+(status?'<span class="status">'+esc(status)+'</span>':'')+'</div></article>';}).join('');
      return key!=='main'&&answers.duration==='meal'?'<details class="notice"><summary>'+title+'（任意）</summary><p>'+note+'</p>'+cards+'</details>':'<section class="plan-section"><h2>'+title+'</h2><p class="hint">'+note+'</p>'+cards+'</section>';
    };
    return '<section class="fade">'+button(route.from==='catalog'?'候補一覧に戻る':'診断結果に戻る','back','','outline')+'<h1>'+esc(p.name)+'</h1><p>'+esc(d.name)+'</p>'+art(p.area,'detail-art',p.imageKey)+'<p class="image-note">'+esc(d.imageNote||'AI参考画像です。実際の施設・料理の写真ではありません。')+'</p><p>主役だけでも大丈夫。全部回る必要はありません。</p>'+(d.duration?'<p>'+esc(d.duration)+'</p>':'')+groups.map(([key,title])=>section(key,title)).join('')+button(route.from==='catalog'?'候補一覧に戻る':'診断結果に戻る','back','','outline')+(route.from==='catalog'?button('診断結果に戻る','results','','outline'):button('ほかの候補も見る','catalog','','outline'))+'</section>';
  }
  function render(scroll=0){
    if((route.view==='results'||route.view==='detail'||route.view==='catalog')&&!L.complete(answers))route={view:'home'};
    if(route.view==='detail'&&!D.profiles.some(p=>p.id===route.plan))route={view:'results'};
    app.innerHTML=route.view==='question'?question():route.view==='results'?results():route.view==='detail'?detail():route.view==='catalog'?catalog():home();
    app.querySelectorAll('.art img').forEach(img=>{img.onload=()=>img.parentElement.classList.add('photo');img.onerror=()=>img.remove();});
    const heading=app.querySelector('h1');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});
    window.scrollTo(0,scroll);
    document.title=route.view==='question'?`${route.step+1}問目 — 次どこ行く？`:route.view==='detail'?`${D.profiles.find(p=>p.id===route.plan).name} — 次どこ行く？`:'次どこ行く？ — おでかけのきっかけ';
  }
  app.addEventListener('click',event=>{
    const el=event.target.closest('[data-action]');if(!el||pending)return;
    switch(el.dataset.action){
      case 'catalog':move({view:'catalog',filter:'matched'});break;
      case 'filter':move({view:'catalog',filter:el.dataset.filter},true);break;
      case 'results':move({view:'results'});break;
      case 'start':move({view:'question',step:0});break;
      case 'back':history.back();break;
      case 'review':move({view:'question',step:0});break;
      case 'reset':reset();break;
      case 'detail':move({view:'detail',plan:el.dataset.profile,from:route.view});break;
      case 'answer':{
        const id=el.dataset.question;
        answers=L.answer(answers,id,el.dataset.value);
        if(id==='detail'&&el.dataset.value==='neither'){move({view:'question',step:L.questions(answers).findIndex(q=>q.id==='main')},true);break;}
        app.querySelectorAll('.option').forEach(b=>{const selected=b===el;b.disabled=true;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));b.querySelector('.circle').textContent=selected?'✓':'';});
        pending=setTimeout(()=>{
          pending=null;
          const next=L.questions(answers).findIndex(q=>q.id===id)+1;
          if(next<L.questions(answers).length)move({view:'question',step:next});else move({view:'results'});
        },window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:160);
        break;
      }
    }
  });
  document.querySelector('#home-link').addEventListener('click',e=>{e.preventDefault();move({view:'home'});});
  window.addEventListener('popstate',e=>{
    clearTimeout(pending);pending=null;
    route=e.state?.epoch===epoch?e.state:{view:'home'};
    render(route.scroll||0);
  });
  history.replaceState({...route,epoch,scroll:0},'');render();
})();
