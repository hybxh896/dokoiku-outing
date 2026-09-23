(function(root){
  'use strict';
  const D=typeof module!=='undefined'&&module.exports?require('./data.js'):root.DateData;
  const questions=(a={})=>D.questions.filter(q=>q.id!=='priority'||(a.food!=='unknown'&&a.activity!=='unknown'));
  const chosen=value=>Boolean(value&&value!=='unknown');
  function answer(input,id,value){
    const q=questions().find(q=>q.id===id);
    if(!q||!q.options.some(o=>o.id===value))throw new Error('Invalid answer');
    // Discard retired question fields when editing an answer.
    const next={...input,[id]:value};
    if((id==='food'||id==='activity')&&input[id]!==value)delete next.priority;
    return Object.fromEntries(questions(next).filter(q=>next[q.id]!==undefined).map(q=>[q.id,next[q.id]]));
  }
  const complete=a=>questions(a).every(q=>q.options.some(o=>o.id===a[q.id]));
  const label=(a,id)=>questions().find(q=>q.id===id)?.options.find(o=>o.id===a[id])?.label||'';
  function schedule(p,a){
    const startKnown=chosen(a.start),endKnown=chosen(a.time);
    let reason='';
    if(a.start==='evening'&&a.time==='early')reason='集合と帰宅の時間が重なっています。';
    else if(p.night&&a.time==='early')reason='夜の景色を楽しむには、夕方より遅い帰宅が必要です。';
    else if(p.daylight&&a.start==='evening')reason='日中の訪問を想定した候補です。';
    else if(p.travelBand==='far'&&['afternoon','evening'].includes(a.start))reason='午後以降の出発では、日帰りの遠出は時間が足りない想定です。';
    else if(startKnown&&endKnown&&!D.schedule.allowedReturns[p.travelBand][a.start]?.includes(a.time))reason='往復と現地で過ごす時間に、もう少し余裕がほしい候補です。';
    return {scheduleFit:!reason,scheduleReason:reason,scheduleUnknown:!startKnown||!endKnown};
  }
  function compare(x,y){
    return Number(y.matched)-Number(x.matched)||Number(y.fullMatch)-Number(x.fullMatch)||y.score-x.score||y.travelScore-x.travelScore||x.order-y.order;
  }
  function rank(a,all=false){
    const wantsFood=chosen(a.food),wantsActivity=chosen(a.activity);
    const results=D.profiles.map((p,order)=>{
      const potentialFoodScore=wantsFood?(p.food[a.food]||0):0;
      const foodScore=p.foodStatus==='pending'?0:potentialFoodScore;
      const activityScore=wantsActivity?(p.activity[a.activity]||0):0;
      const travelScore=D.travel.penalties[a.travel]?.[p.travelBand]||0;
      const timing=schedule(p,a);
      const matched=timing.scheduleFit&&(foodScore>0||activityScore>0);
      const fullMatch=matched&&(!wantsFood||foodScore>0)&&(!wantsActivity||activityScore>0);
      return {...p,...timing,order,foodScore,potentialFoodScore,activityScore,travelScore,score:foodScore+activityScore+travelScore,matched,fullMatch};
    }).sort(compare);
    return results;

  }
  function groups(a){
    const matched=rank(a).filter(p=>p.matched);
    const both=matched.filter(p=>p.foodScore>0&&p.activityScore>0);
    const food=matched.filter(p=>p.foodScore>0&&!p.activityScore);
    const activity=matched.filter(p=>p.activityScore>0&&!p.foodScore);
    const titles={both:'ごはんも遊びも楽しめる',food:'食べたいものから選ぶ',activity:'やりたいことから選ぶ'};
    const buckets={both,food,activity};
    const order=a.priority==='activity'?['both','activity','food']:['both','food','activity'];
    return order.map(id=>({id,title:titles[id],plans:buckets[id]})).filter(g=>g.plans.length);
  }
  function catalog(a={},filters={}){
    const indexed=new Map(rank(a).map(p=>[p.id,p]));
    return D.profiles.map(p=>indexed.get(p.id)).filter(p=>(!filters.area||p.area===filters.area)&&(!filters.food||(p.foodStatus!=='pending'&&(p.food[filters.food]||0)>0))).sort((x,y)=>Number(y.isNew)-Number(x.isNew)||x.order-y.order);
  }
  root.DateLogic={questions,answer,complete,label,rank,schedule,groups,catalog};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.DateLogic;
})(typeof globalThis!=='undefined'?globalThis:window);
