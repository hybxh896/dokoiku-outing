(function(){
  'use strict';
  const D=window.DateData,L=window.DateLogic,app=document.querySelector('#app');
  let answers={},route={view:'home'},epoch=0,pending=null;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(label,action,extra='',style='')=>`<button class="button ${style}" data-action="${action}" ${extra}>${label}</button>`;
  const picture=(key)=>{
    const r=D.referenceImages,[x,y,w,h]=r.regions[key];
    return `<span class="image-window" style="aspect-ratio:${w}/${h}"><svg viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><image href="${r.src}" width="${r.width}" height="${r.height}" /></svg></span>`;
  };
  const art=(area,extra='')=>{
    const d=D.destinations[area];
    if(d.gallery&&!d.image)return `<figure class="photo-gallery ${d.color} ${extra}"><div class="gallery-main">${picture(d.gallery[0])}</div><div class="gallery-thumbs">${d.gallery.slice(1).map(picture).join('')}</div><figcaption>${d.name}のおでかけをイメージ · 参考画像</figcaption></figure>`;
    return `<div class="art ${d.scene} ${extra}" aria-hidden="true"><span class="sun"></span><span class="cloud"></span><span class="water"></span><span class="art-label">A LITTLE DAY OUT</span>${d.image?`<img src="${esc(d.image)}" alt="">`:''}${extra==='hero-art'?'<span class="hero-sticker">気になる場所、<br>見つけよう。</span>':''}</div>`;
  };
  const prototype=()=>`<details class="notice"><summary>試作版について</summary><p>車でのおでかけを想定しています。車での移動負担を順位に反映しています。正確な所要時間の計算ではありません。歩く量の希望は注意書きに反映します。一部の店舗・組み合わせは確認中です。回答はこのページ内だけで使います。</p></details>`;
  function move(next,replace=false){
    clearTimeout(pending);pending=null;
    history.replaceState({...route,epoch,scroll:window.scrollY},'');
    route=next;
    const hash=next.view==='home'?'#home':next.view==='question'?`#question-${next.step}`:next.view==='detail'?`#area-${next.area}`:`#${next.view}`;
    history[replace?'replaceState':'pushState']({...route,epoch,scroll:0},'',hash);
    render();
  }
  function reset(){answers={};epoch++;move({view:'home'});}
  function home(){
    return `<section class="fade"><p class="eyebrow">LET'S FIND OUR NEXT STOP</p><h1 class="home-title">次どこ行く？<span>その気分から、<br>おでかけしよう。</span></h1><p class="intro">いくつか質問に答えて、<br>おでかけ先を選んでみよう。</p>${art('awaji','hero-art')}<div class="home-meta"><span class="pill">6〜7問・約1分</span><span>車で、気ままにおでかけ。</span></div>${button('はじめる <span class="arrow">→</span>','start')}<p class="subtext">正解はひとつじゃない。二人で相談してみよう。</p><div class="places-strip">${Object.values(D.destinations).map(d=>`<span>${d.name}</span>`).join('')}</div>${prototype()}</section>`;
  }
  function question(){
    const qs=L.questions(answers);route.step=Math.max(0,Math.min(route.step||0,qs.length-1));
    // A browser-forward entry cannot skip an unanswered prerequisite.
    const first=qs.findIndex(q=>!q.options.some(o=>o.id===answers[q.id]));
    if(first>=0&&route.step>first)route.step=first;
    const q=qs[route.step],total=route.step===0&&!answers.main?'6〜7':qs.length;
    return `<section class="fade"><div class="navline"><button class="back" data-action="back">← 戻る</button><span class="step">${route.step+1} / ${total}</span></div><progress aria-label="質問の進み具合" value="${route.step+1}" max="${qs.length}"></progress><p class="eyebrow">${q.eyebrow}</p><h1 class="question-title">${q.title}</h1><p class="hint">${q.hint||''}</p><div class="options" aria-label="回答を選択">${q.options.map(o=>`<button class="option ${answers[q.id]===o.id?'selected':''}" data-action="answer" data-question="${q.id}" data-value="${o.id}" aria-pressed="${answers[q.id]===o.id}"><span class="circle" aria-hidden="true">${answers[q.id]===o.id?'✓':''}</span><span><strong>${o.label}</strong>${o.note?`<small>${o.note}</small>`:''}</span></button>`).join('')}</div><p class="auto-note">ひとつ選ぶと、次の質問へ進みます</p></section>`;
  }
  function reasons(p){
    const list=[];
    if(p.matched)list.push(`${L.label(answers,answers.detail&&answers.detail!=='any'?'detail':'main')}の気分に`);
    if(p.companionScore)list.push(`${L.label(answers,'companion')}も楽しめる候補`);
    if(p.matched&&answers.environment===p.environment)list.push(`${answers.environment==='indoor'?'屋内':'屋外'}中心で楽しめる`);
    return list;
  }
  function card(p,index){
    const d=D.destinations[p.area],rs=reasons(p),featured=index===0;
    const envMismatch=p.environment&&answers.environment!=='any'&&D.scoring.environment[answers.environment]?.[p.environment]<0;
    const companionPending=answers.companion!=='none'&&!p.companionScore;
    return `<article class="result-card ${featured?'':'small-card'}">${art(p.area)}<div class="card-body"><span class="rank-label">${p.matched?`気分に合う候補 ${index+1}`:'別の楽しみ方なら'}</span><h3>${d.name}</h3><p class="theme">${p.name}</p><p class="hint">車での移動：${D.travel.labels[p.travelBand]}（${D.travel.origin}からの目安）</p>${p.timeScore<0?'<p class="caution">夕方の帰宅を希望しているため、往復の移動負担を考えて順位を控えめにしています。出発時刻と滞在時間を確認して相談しよう。</p>':p.travelScore<0?'<p class="caution">移動の希望より長めのため、順位を控えめにしています。</p>':''}<div class="tags">${p.tags.map(t=>`<span>${t}</span>`).join('')}</div>${rs.length?`<div class="reason-box"><p>こんな回答が決め手でした</p><ul>${rs.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div>`:'<p class="hint">選んだ主目的とは違うけれど、こんな場所もあります。</p>'}${envMismatch?`<p class="caution">${p.environment==='mixed'?'屋内と屋外を行き来する':p.environment==='outdoor'?'屋外中心の':'屋内中心の'}候補です。空間の希望とは少し異なります。</p>`:''}${!p.environment&&answers.environment!=='any'?'<p class="caution">屋内・屋外の詳しい利用条件は確認中です。</p>':''}${answers.walking==='low'?`<p class="caution">${p.walkingNote}</p>`:''}${p.id==='night'?'<p class="caution">夜の滞在と道路の営業確認が必要です。参拝施設の営業時間とは異なります。</p>':''}${p.companions[answers.companion]?`<p class="hint">${p.companions[answers.companion].reason}</p>`:''}${featured&&companionPending?'<p class="hint">組み合わせたい希望については、具体的な候補・移動を確認中です。</p>':''}${button('候補を見る <span class="arrow">↗</span>','detail',`data-area="${p.area}"`,featured?'':'outline')}</div></article>`;
  }
  function areaGrid(){return `<div class="area-grid">${Object.entries(D.destinations).map(([id,d])=>`<button class="area-link" data-action="detail" data-area="${id}">${d.name}<span>${d.tags.join(' · ')}</span></button>`).join('')}</div>`;}
  function results(){
    const ranked=L.rank(answers),matched=ranked.filter(p=>p.matched);
    let content='';
    if(!matched.length){
      const message=answers.detail==='night'&&answers.time==='early'?'夜景を楽しむには、夜まで過ごせる日がよさそう。時間を見直すか、昼の景色から探してみよう。':answers.detail==='seafood'?'海鮮のお店は、まだ候補を整理中です。好みに合わないのではなく、この試作版では十分に比較できません。':answers.detail==='city'?'街のクルーズは運航情報を確認中です。候補一覧には残しています。':answers.detail==='view'?'景色を楽しめるカフェの席・施設は確認中です。まずはエリアの候補を見てみよう。':'まだ目的が決まっていなくても大丈夫。6つのエリアを見ながら、気になるところを探してみよう。';
      content=`<div class="empty"><h2>候補を見ながら、考えよう。</h2><p>${message}</p></div>${areaGrid()}`;
    }else{
      const top=matched.concat(ranked.filter(p=>!p.matched)).slice(0,3);
      content=top.map(card).join('');
    }
    return `<section class="fade"><p class="eyebrow">YOUR NEXT LITTLE TRIP</p><h1>今の気分に、<br>合いそうなのは。</h1><p class="result-intro">気になるところを、二人で相談してみよう。<br>${D.travel.origin}からの移動負担も考慮しています。</p><p class="hint">${D.travel.note}帰宅時刻を保証するものではありません。</p>${content}<div class="actions">${button('回答を見直す','review','','outline')}${button('もう一度やってみる','reset','','secondary')}</div><details class="notice"><summary>選んだ回答を確認する</summary><ul class="answer-list">${L.questions(answers).map(q=>`<li>${q.title}<strong>${esc(L.label(answers,q.id))}</strong></li>`).join('')}</ul></details>${matched.length?`<details class="notice"><summary>6エリアすべてを見る</summary>${areaGrid()}</details>`:''}${prototype()}</section>`;
  }
  function detail(){
    const d=D.destinations[route.area];
    return `<section class="fade"><div class="navline"><button class="back" data-action="back">← 結果に戻る</button><span class="step">気になるスポット</span></div>${art(route.area,'detail-art')}<p class="eyebrow">A PLACE TO TALK ABOUT</p><h1>${d.name}</h1><p class="intro">${d.theme}</p><p class="section-label">全部回らなくて大丈夫。気になる場所はある？</p><p class="image-note">画像はおでかけの参考イメージです。実際の施設・料理とは異なる場合があります。</p>${d.spots.map(([name,description,status],i)=>`<article class="spot illustrated-spot"><div class="spot-images">${(d.spotImages[i]||[d.gallery[0]]).map(picture).join('')}</div><div class="spot-copy"><h3>${name}</h3><p>${description}</p>${status?`<span class="status">${status}</span>`:''}</div></article>`).join('')}<div class="actions">${button('結果に戻る','back','','outline')}</div>${prototype()}</section>`;
  }
  function render(scroll=0){
    if((route.view==='results'||route.view==='detail')&&!L.complete(answers))route={view:'home'};
    if(route.view==='detail'&&!D.destinations[route.area])route={view:'results'};
    app.innerHTML=route.view==='question'?question():route.view==='results'?results():route.view==='detail'?detail():home();
    app.querySelectorAll('.art img').forEach(img=>{img.onload=()=>img.parentElement.classList.add('photo');img.onerror=()=>img.remove();});
    const heading=app.querySelector('h1');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});
    window.scrollTo(0,scroll);
    document.title=route.view==='question'?`${route.step+1}問目 — 次どこ行く？`:route.view==='detail'?`${D.destinations[route.area].name} — 次どこ行く？`:'次どこ行く？ — おでかけのきっかけ';
  }
  app.addEventListener('click',event=>{
    const el=event.target.closest('[data-action]');if(!el||pending)return;
    switch(el.dataset.action){
      case 'start':move({view:'question',step:0});break;
      case 'back':history.back();break;
      case 'review':move({view:'question',step:0});break;
      case 'reset':reset();break;
      case 'detail':move({view:'detail',area:el.dataset.area});break;
      case 'answer':{
        const id=el.dataset.question;
        answers=L.answer(answers,id,el.dataset.value);
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
