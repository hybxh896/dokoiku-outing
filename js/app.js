(function(){
  'use strict';
  const D=window.DateData,L=window.DateLogic,app=document.querySelector('#app');
  let answers={},route={view:'home'},epoch=0,pending=null;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(label,action,extra='',style='')=>'<button class="button '+style+'" data-action="'+action+'" '+extra+'>'+label+'</button>';
  const picture=key=>{
    const asset=D.imageAssets[key];
    if(asset)return '<span class="image-window standalone" style="aspect-ratio:3/2"><img src="'+esc(asset.src)+'" alt="'+esc(asset.alt)+'" width="1536" height="1024" loading="lazy" decoding="async"></span>';
    const r=D.referenceImages,frame=r.regions[key];
    if(!frame)return '';
    const [x,y,w,h]=frame;
    return '<span class="image-window" style="aspect-ratio:'+w+'/'+h+'"><svg viewBox="'+[x,y,w,h].join(' ')+'" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><image href="'+r.src+'" width="'+r.width+'" height="'+r.height+'" /></svg></span>';
  };
  const art=(area,extra='',imageKey=null)=>{
    const d=D.destinations[area];
    if(d.gallery.length){
      const key=imageKey||d.gallery[0];
      return '<figure class="photo-gallery '+d.color+' '+extra+'"><div class="gallery-main">'+picture(key)+'</div></figure>';
    }
    return '<div class="destination-art '+d.color+' '+extra+'"><span class="destination-symbol" aria-hidden="true">'+d.icon+'</span><p>'+esc(d.theme)+'</p><span class="destination-caption">A LITTLE DAY OUT</span></div>';
  };
  const prototype=()=>'<details class="notice"><summary>この診断について</summary><p>大阪駅周辺から車で出かける、日帰りの候補選びです。時間の判定は大まかな目安で、営業日や当日の所要時間を保証するものではありません。回答は保存・送信されません。</p></details>';
  function move(next,replace=false){
    clearTimeout(pending);pending=null;
    history.replaceState({...route,epoch,scroll:window.scrollY},'');
    route=next;
    const hash=next.view==='home'?'#home':next.view==='question'?'#question-'+next.step:next.view==='detail'?'#plan-'+next.plan:'#'+next.view;
    history[replace?'replaceState':'pushState']({...route,epoch,scroll:0},'',hash);
    render();
  }
  function reset(){answers={};epoch++;move({view:'home'});}
  function home(){
    return '<section class="fade"><p class="eyebrow">LET’S FIND OUR NEXT STOP</p><h1 class="home-title">次どこ行く？</h1><p class="trip-edition">10/4のおでかけ用</p><p class="home-tagline">ごはんも、遊びも。<br>一日を楽しもう。</p><p class="intro">食べたいものと、やってみたいこと。<br>ふたつの気分から、日帰りのおでかけを。</p>'+art('nagoya','hero-art','daytrip-world-hero')+'<div class="home-meta"><span class="pill">5〜6問で候補を探す</span><span>車で、一日のおでかけ。</span></div>'+button('はじめる <span class="arrow">→</span>','start')+button('おでかけプランを一覧で見る →','catalog','','outline')+'<p class="subtext">気になるところを、二人で相談してみよう。</p><div class="places-strip">'+Object.values(D.destinations).map(d=>'<span>'+esc(d.name)+'</span>').join('')+'</div>'+prototype()+'</section>';
  }
  function question(){
    const qs=L.questions(answers);
    route.step=Math.max(0,Math.min(route.step||0,qs.length-1));
    const first=qs.findIndex(q=>!q.options.some(o=>o.id===answers[q.id]));
    if(first>=0&&route.step>first)route.step=first;
    const q=qs[route.step];
    return '<section class="fade"><div class="navline"><button class="back" data-action="back">← 戻る</button><span class="step">'+(route.step+1)+' / '+qs.length+'</span></div><progress aria-label="質問の進み具合" value="'+(route.step+1)+'" max="'+qs.length+'"></progress><p class="eyebrow">'+q.eyebrow+'</p><h1 class="question-title">'+q.title+'</h1><p class="hint">'+q.hint+'</p><div class="options" aria-label="回答を選択">'+q.options.map(o=>'<button class="option '+(answers[q.id]===o.id?'selected':'')+'" data-action="answer" data-question="'+q.id+'" data-value="'+o.id+'" aria-pressed="'+(answers[q.id]===o.id)+'"><span class="circle" aria-hidden="true">'+(answers[q.id]===o.id?'✓':'')+'</span><span><strong>'+o.label+'</strong>'+(o.note?'<small>'+o.note+'</small>':'')+'</span></button>').join('')+'</div><p class="auto-note">ひとつ選ぶと、次へ進みます</p></section>';
  }
  function reasons(p){
    const list=[];
    if(p.foodScore)list.push('「'+L.label(answers,'food')+'」'+(p.foodScore===10?'を楽しめる候補':'を一部楽しめる候補'));
    if(p.activityScore)list.push('「'+L.label(answers,'activity')+'」'+(p.activityScore===10?'の希望に合う候補':'の希望に部分的に合う候補'));
    return list;
  }
  function cautions(p){
    const notes=[];
    if(p.scheduleReason)notes.push(p.scheduleReason);
    if(p.travelScore<0)notes.push('車での移動は、希望より長めです。');
    if(p.scheduleUnknown)notes.push('集合・帰宅の時間が決まったら、滞在できる時間も確認しよう。');
    if(answers.food&&answers.food!=='unknown'&&!p.foodScore)notes.push('希望の料理のお店は、このプランには未登録です。');
    if(answers.activity&&answers.activity!=='unknown'&&!p.activityScore)notes.push('希望のアクティビティとの組み合わせは、まだ用意できていません。');
    return [...notes,...p.notes];
  }
  function card(p){
    const d=D.destinations[p.area],notes=cautions(p);
    return '<article class="result-card '+(p.foodScore&&p.activityScore?'':'compact-result')+'" data-plan="'+p.id+'"><header class="card-body"><span class="rank-label">'+(p.foodScore&&p.activityScore?'ごはんも遊びも':p.foodScore?'ごはんの希望に合う':'遊びの希望に合う')+'</span><h3>'+esc(p.name)+'</h3><p class="area-name">'+esc(d.name)+'</p></header>'+art(p.area,'',p.imageKey)+'<div class="card-body"><ul class="brief-reasons">'+reasons(p).map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul><p class="travel-summary">車での移動：'+D.travel.labels[p.travelBand]+'</p>'+(notes.length?'<p class="caution">'+esc(notes[0])+'</p>':'')+(notes.length>1?'<details class="notice"><summary>出かける前に</summary><ul>'+notes.slice(1).map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul></details>':'')+'<div class="card-actions">'+button('ここでの過ごし方を見る →','detail','data-profile="'+p.id+'"')+'</div></div></article>';
  }
  const plans=()=>L.complete(answers)?L.rank(answers,true):D.profiles;
  function mismatch(p){
    if(!L.complete(answers))return p.foodStatus==='pending'?'食事のお店はこれから選ぶ候補です。':'';
    if(!p.scheduleFit)return p.scheduleReason;
    if(p.fullMatch)return '選んだ希望に合う候補です。'+(p.travelScore<0?'移動は希望より長めです。':'');
    if(p.matched)return '食事かアクティビティの、一部の希望に合う候補です。';
    if(p.foodStatus==='pending'&&p.potentialFoodScore)return '食事のお店が未定のため、一致候補には含めていません。';
    return '今回の希望とは別の候補です。';
  }
  function catalogCard(p){
    const d=D.destinations[p.area],status=mismatch(p);
    return '<article class="spot catalog-card" data-plan="'+p.id+'">'+art(p.area,'catalog-art',p.imageKey)+'<div class="catalog-copy">'+(p.isNew?'<span class="new-plan">今回追加</span>':'')+'<h2>'+esc(p.name)+'</h2><p>'+esc(d.name)+'</p><p>車での移動：'+D.travel.labels[p.travelBand]+'</p>'+(status?'<p class="hint">'+esc(status)+'</p>':'')+'<details class="catalog-spots"><summary>同じエリアの別の候補も見る</summary><p>全部を一日で回るコースではありません。</p><ul>'+d.spots.map(([name])=>'<li>'+esc(name)+'</li>').join('')+'</ul></details>'+button('ここでの過ごし方を見る →','detail','data-profile="'+p.id+'"','outline')+'</div></article>';
  }
  function catalog(){
    const complete=L.complete(answers),items=L.catalog(answers,route);
    const select=(id,label,options)=>'<label>'+label+'<select data-catalog-filter="'+id+'"><option value="">すべて</option>'+options.map(([value,name])=>'<option value="'+esc(value)+'"'+(route[id]===value?' selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>';
    const controls='<div class="catalog-filters">'+select('area','エリア',Object.entries(D.destinations).map(([id,d])=>[id,d.name]))+select('food','ごはん',D.questions.find(q=>q.id==='food').options.filter(o=>o.id!=='unknown').map(o=>[o.id,o.label]))+'</div>';
    return '<section class="fade"><h1>おでかけプラン一覧</h1><p>エリアや食べたいもので、気軽に選ぼう。</p>'+controls+'<div class="filter-summary"><p class="catalog-count" aria-live="polite">'+items.length+'件のプラン</p>'+((route.area||route.food)?button('絞り込みを解除','clear-filters','','outline'):'')+'</div><p class="hint">今回追加したプランから順に表示しています。</p>'+(!items.length?'<p class="empty">この組み合わせのプランはまだありません。</p>':'')+items.map(catalogCard).join('')+(complete?button('診断結果に戻る','results','','outline')+button('条件を変える','review','','outline'):button('質問に答えて絞り込む','start'))+button('ホームに戻る','home','','outline')+'</section>';
  }
  function results(){
    const ranked=L.rank(answers),matched=ranked.filter(p=>p.matched);
    let content='';
    if(!matched.length){
      const unknown=answers.food==='unknown'&&answers.activity==='unknown';
      const conflict=answers.start==='evening'&&answers.time==='early';
      const message=conflict?'集合と帰宅の時間が重なっています。もう一度選んでみよう。':unknown?'まだ決まっていなくても大丈夫。候補を見てから考えよう。':'今の希望に合う候補は見つかりませんでした。未定のお店や、時間の条件が異なる候補も一覧で見られます。';
      content='<div class="empty"><h2>候補を見ながら、考えよう。</h2><p>'+message+'</p></div><h2 class="section-label">すべてのおでかけ候補</h2>'+plans().map(catalogCard).join('');
    }else{
      content=L.groups(answers).map(g=>'<section class="result-group" data-group="'+g.id+'"><h2 class="group-title">'+g.title+'<span>'+g.plans.length+'件</span></h2>'+g.plans.map(card).join('')+'</section>').join('');
      content='<p class="hint">'+(answers.priority==='food'?'ごはんの候補を先に。':answers.priority==='activity'?'やりたいことの候補を先に。':'ごはんと遊び、どちらの候補も。')+'希望に合う'+matched.length+'件を表示しています。</p>'+content;
    }
    return '<section class="fade"><p class="eyebrow">YOUR NEXT LITTLE TRIP</p><h1>こんなおでかけは<br>どう？</h1><p class="result-intro">食事と遊び、ふたつの気分から。<br>日帰りの時間と移動の負担も考えた候補です。</p>'+content+button('おでかけプランを一覧で見る <span aria-hidden="true">→</span>','catalog','','browse-more')+'<details class="notice"><summary>移動と時間の目安について</summary><p>'+D.travel.origin+'が基準です。'+D.travel.note+'時間の絞り込みは大まかな目安です。出発前に営業・予約・帰路を確認してね。</p></details><div class="actions">'+button('もう一度やってみる','reset','','secondary')+'</div><details class="notice"><summary>選んだ回答を確認する</summary><ul class="answer-list">'+L.questions(answers).map(q=>'<li>'+q.title+'<strong>'+esc(L.label(answers,q.id))+'</strong></li>').join('')+'</ul></details>'+prototype()+'</section>';
  }
  function detail(){
    const p=D.profiles.find(p=>p.id===route.plan),d=D.destinations[p.area],spec=D.planDetails[p.id];
    const used=new Set(Object.values(spec).flat());
    const related=d.spots.map((_,i)=>i).filter(i=>!used.has(i));
    const section=(key,title)=>{
      const ids=key==='related'?related:spec[key]||[];
      if(!ids.length)return '';
      const note=key==='related'?'同じエリアでも距離があります。このプランと一緒に回れるとは限りません。':key==='near'?'時間に余裕があれば。営業時間と待ち時間を確認して選ぼう。':key==='extra'?'追加の寄り道は、移動と滞在の時間を見て選ぼう。':'';
      return '<section class="plan-section"><h2>'+title+'</h2>'+(note?'<p class="hint">'+note+'</p>':'')+ids.map(i=>{
        const [name,description,status]=d.spots[i];
        const keys=d.spotImages[i]||[];
        const imageNote='';
        return '<article class="spot illustrated-spot"><div class="spot-images">'+keys.map(picture).join('')+'</div><div class="spot-copy"><h3>'+esc(name)+'</h3><p>'+esc(description)+'</p>'+imageNote+(status?'<span class="status">'+esc(status)+'</span>':'')+'</div></article>';
      }).join('')+'</section>';
    };
    const sources=p.sources.length?'<section class="plan-section"><h2>営業・体験を確認する</h2><ul class="source-links">'+p.sources.map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.label)+' ↗</a></li>').join('')+'</ul></section>':'';
    const backLabel=route.from==='catalog'?'候補一覧に戻る':'診断結果に戻る';
    return '<section class="fade">'+button(backLabel,'back','','outline')+'<h1>'+esc(p.name)+'</h1><p>'+esc(d.name)+'</p>'+art(p.area,'detail-art',p.imageKey)+'<h2 class="group-title">このプランの楽しみ方</h2><p>主役を楽しんで、余裕があれば寄り道も。</p>'+(p.notes.length?'<div class="caution">'+p.notes.map(n=>'<p>'+esc(n)+'</p>').join('')+'</div>':'')+[['main','今回の主役'],['near','近くで一緒に楽しむ'],['extra','余裕があれば'],['related','同じエリアの別の候補']].map(([key,title])=>section(key,title)).join('')+sources+button(backLabel,'back','','outline')+(route.from==='catalog'?(L.complete(answers)?button('診断結果に戻る','results','','outline'):button('質問に答えて絞り込む','start')):button('おでかけプランを一覧で見る →','catalog','','outline'))+'</section>';
  }
  function render(scroll=0){
    if(route.view==='results'&&!L.complete(answers))route={view:'home'};
    if(route.view==='detail'&&!D.profiles.some(p=>p.id===route.plan))route={view:L.complete(answers)?'results':'home'};
    app.innerHTML=route.view==='question'?question():route.view==='results'?results():route.view==='detail'?detail():route.view==='catalog'?catalog():home();
    const heading=app.querySelector('h1');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});
    window.scrollTo(0,scroll);
    document.title=route.view==='question'?(route.step+1)+'問目 — 次どこ行く？':route.view==='detail'?D.profiles.find(p=>p.id===route.plan).name+' — 次どこ行く？':'次どこ行く？';
    document.title+='｜10/4のおでかけ用';
  }
  app.addEventListener('click',event=>{
    const el=event.target.closest('[data-action]');if(!el||pending)return;
    switch(el.dataset.action){
      case 'home':move({view:'home'});break;
      case 'catalog':move({view:'catalog',area:'',food:''});break;
      case 'clear-filters':move({view:'catalog',area:'',food:''},true);break;
      case 'results':move({view:'results'});break;
      case 'start':move({view:'question',step:0});break;
      case 'back':history.back();break;
      case 'review':move({view:'question',step:0});break;
      case 'reset':reset();break;
      case 'detail':move({view:'detail',plan:el.dataset.profile,from:route.view});break;
      case 'answer':{
        const id=el.dataset.question;
        answers=L.answer(answers,id,el.dataset.value);
        app.querySelectorAll('.option').forEach(b=>{const selected=b===el;b.disabled=true;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));b.querySelector('.circle').textContent=selected?'✓':'';});
        pending=setTimeout(()=>{
          pending=null;
          const next=L.questions(answers).findIndex(q=>q.id===id)+1;
          move(next<L.questions(answers).length?{view:'question',step:next}:{view:'results'});
        },window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:160);
        break;
      }
    }
  });
  app.addEventListener('change',event=>{
    const field=event.target.dataset.catalogFilter;
    if(route.view!=='catalog'||!['area','food'].includes(field))return;
    const scroll=window.scrollY;
    move({...route,[field]:event.target.value},true);
    app.querySelector('[data-catalog-filter="'+field+'"]').focus({preventScroll:true});
    window.scrollTo(0,scroll);
  });
  document.querySelector('#home-link').addEventListener('click',e=>{e.preventDefault();move({view:'home'});});
  window.addEventListener('popstate',e=>{
    clearTimeout(pending);pending=null;
    route=e.state?.epoch===epoch?e.state:{view:'home'};
    render(route.scroll||0);
  });
  history.replaceState({...route,epoch,scroll:0},'');render();
})();
