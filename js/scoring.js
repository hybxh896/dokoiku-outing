(function(root){
  'use strict';
  const D=typeof module!=='undefined'&&module.exports?require('./data.js'):root.DateData;
  function questions(a){
    const list=[...D.scheduleQuestions,{id:'main',eyebrow:'まずは、今の気分から',title:'一番楽しみたいのは？',hint:'いちばん近い気分をひとつ選んでね。',options:D.interests}];
    if(D.refinements[a.main]) list.push({id:'detail',eyebrow:'もう少しだけ、聞かせて',hint:'気になるものがなければ、こだわらなくても大丈夫。',...D.refinements[a.main]});
    return list.concat(D.commonQuestions.filter(q=>['travel','extras'].includes(q.id)||(a.extras==='yes'&&(q.id!=='companion'||a.duration!=='meal'))));
  }
  function answer(a,id,value){
    const q=questions(a).find(q=>q.id===id);
    if(!q||!q.options.some(o=>o.id===value)) throw new Error('Invalid answer');
    const next={...a,[id]:value};
    if(id==='detail'&&value==='neither'){delete next.main;delete next.detail;delete next.companion;return next;}
    if(id==='main'&&value!==a.main){delete next.detail; delete next.companion;}
    if(id==='extras'&&value==='skip')for(const key of ['walking','environment','time','companion'])delete next[key];
    if(id==='duration'&&value==='meal')delete next.companion;
    return next;
  }
  function complete(a){return a.detail!=='neither'&&questions(a).every(q=>q.options.some(o=>o.id===a[q.id]));}
  function label(a,id){const q=questions(a).find(q=>q.id===id);return q?.options.find(o=>o.id===a[id])?.label||'';}
  function rank(input){
    const a={...input};
    if(a.extras!=='yes')for(const key of ['walking','environment','time','companion'])delete a[key];
    if(a.duration==='meal')delete a.companion;
    const specific=a.detail&&!['any','unknown','neither'].includes(a.detail);
    const results=D.profiles.filter(p=>p.id!=='night'||(a.main==='nature'&&a.detail==='night'&&a.time!=='early')).map(p=>{
      let detail=0;
      if(specific) detail=a.detail==='both'?Math.max(p.detail.town||0,p.detail.temple||0):(p.detail[a.detail]||0);
      const main=specific?(detail>=D.scoring.detailDirect?D.scoring.direct:detail>0?D.scoring.partial:0):(p.main[a.main]||0);
      const env=a.environment!=='any'&&p.environment?(D.scoring.environment[a.environment]?.[p.environment]||0):0;
      // Only same-profile or verified nearby combinations contribute companion points.
      const companion=a.companion&&a.companion!=='none'?(p.companions[a.companion]?.points||Math.min(D.scoring.companionMax,(p.main[a.companion]||0)*D.scoring.companionMax/D.scoring.direct)):0;
      const travel=D.travel.penalties[a.travel]?.[p.travelBand]||0;
      const time=D.travel.timePenalties[a.time]?.[p.travelBand]||0;
      // Both preferences concern the same journey: apply the stronger penalty once.
      const mobility=Math.min(travel,time);
      // Conservative editorial availability, not opening-hours or route calculations.
      const short=D.schedulePolicy.shortDurations.includes(a.duration);
      const timeConflict=a.start==='evening'&&a.time==='early';
      const scheduleFit=!timeConflict&&(!short||D.schedulePolicy.shortProfiles.includes(p.id))&&(a.duration!=='half'||p.travelBand!=='far')&&(!D.schedulePolicy.lateStarts.includes(a.start)||p.travelBand!=='far')&&(a.start!=='evening'||D.schedulePolicy.eveningProfiles.includes(p.id));
      return {...p,scheduleFit,mainScore:main,detailScore:detail,companionScore:companion,travelScore:travel,timeScore:time,mobilityScore:mobility,score:main+detail+env+companion+mobility,matched:main>0&&scheduleFit};
    });
    const compare=(x,y)=>Number(y.matched)-Number(x.matched)||y.score-x.score||y.mobilityScore-x.mobilityScore||y.mainScore-x.mainScore||x.id.localeCompare(y.id,'en');
    return D.scoring.areaOrder.map(area=>results.filter(p=>p.area===area).sort(compare)[0]).sort((x,y)=>y.score-x.score||y.mobilityScore-x.mobilityScore||y.mainScore-x.mainScore||D.scoring.areaOrder.indexOf(x.area)-D.scoring.areaOrder.indexOf(y.area));
  }
  root.DateLogic={questions,answer,complete,label,rank};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.DateLogic;
})(typeof globalThis!=='undefined'?globalThis:window);
