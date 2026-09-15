/* 質問・候補・配点はこのファイルで編集。外部通信・永続保存なし。 */
(function (root) {
  'use strict';
  const option = (id, label, note = '') => ({id, label, note});
  const interests = [
    option('food','おいしいごはん','おでかけ先で、おいしいものを'),
    option('cafe','カフェ・スイーツ','甘いものと、ひと休み'),
    option('nature','景色・植物','海や山、緑に会いに'),
    option('shopping','洋服や雑貨の買い物','気になるお店をのぞきたい'),
    option('art','美術館でアート','作品をゆっくり楽しみたい'),
    option('boat','船などの体験','いつもと違う景色を見たい'),
    option('walk','街並み散策・お参り','歩きながら、寄り道も'),
    option('none','まだ決めていない','候補を見て考えたい')
  ];
  const refinements = {
    food:{title:'何を食べたい気分？',options:[option('beef','焼肉・牛肉料理'),option('seafood','海鮮'),option('noodles','麺'),option('any','こだわらない')]},
    cafe:{title:'どんな楽しみ方がいい？',options:[option('sweets','スイーツを目当てに'),option('view','景色も楽しみたい'),option('any','こだわらない')]},
    nature:{title:'どんな景色が気になる？',options:[option('sea','海'),option('lake','湖・山'),option('green','植物・緑'),option('night','夜景'),option('any','こだわらない')]},
    boat:{title:'どちらの体験が気になる？',options:[option('whirlpool','渦潮など、自然の迫力'),option('city','街の水辺をクルーズ'),option('any','どちらでも')]},
    walk:{title:'どちらを楽しみたい？',options:[option('town','食べ歩き・街並み'),option('temple','お寺や神社へのお参り'),option('both','どちらも')]}
  };
  Object.values(refinements).forEach(q=>{
    if(!q.options.some(o=>o.id==='any'))q.options.push(option('any','こだわらない'));
    q.options.push(option('unknown','まだ決めていない','この質問では好みを絞りません'));
    q.options.push(option('neither','この中にはない','最初の楽しみ方を選び直す'));
  });
  const commonQuestions = [
    {id:'travel',eyebrow:'車での移動',title:'車での移動は、どれくらいなら？',hint:'大阪駅周辺を基準にした、大まかな移動負担で比べます。',options:[option('short','なるべく短めがいい'),option('middle','ほどよくドライブしたい'),option('long','長めのドライブもOK')]},
    {id:'time',eyebrow:'過ごせる時間',title:'おでかけに使える時間は？',hint:'夕方に帰りたい日は、移動が長い候補を控えめにします。',options:[option('early','夕方には帰りたい'),option('late','朝から夜まで使える'),option('unknown','まだ決めていない')]},
    {id:'walking',eyebrow:'現地での過ごし方',title:'現地で歩く量は？',hint:'歩行量を調査中のため、結果の注意書きに反映します。',options:[option('low','移動を少なめにしたい'),option('medium','休憩しながらなら歩ける'),option('high','散策もたっぷり楽しみたい')]},
    {id:'environment',eyebrow:'好きな空間',title:'屋内と屋外、どちらがいい？',hint:'屋外の景色か、屋内でのんびりか。',options:[option('indoor','屋内中心がいい'),option('any','どちらでもいい'),option('outdoor','屋外を楽しみたい')]},
    {id:'companion',eyebrow:'もうひとつ、楽しむなら',title:'ほかに組み合わせたいことは？',hint:'主目的を大切にしながら、もうひとつ。',options:interests.filter(o=>o.id!=='none').map(o=>option(o.id,o.label)).concat(option('none','特になし'))}
  ];
  for(const id of ['travel','walking','environment','companion'])commonQuestions.find(q=>q.id===id).options.push(option('unknown','まだ決めていない'));
  const destinations = {
    sanda:{name:'三田',theme:'お店をのぞいて、ひと休み。',icon:'♧',scene:'town',color:'sand',image:null,tags:['買い物','カフェ'],spots:[['神戸三田プレミアム・アウトレット','今回の主役。気になるお店をゆっくり巡ろう。'],['ランチ・カフェ','買い物の合間にひと休み。お店はこれから選びます。','候補を整理中']]},
    awaji:{name:'淡路島',theme:'緑とおいしいものに会いに。',icon:'☀',scene:'island',color:'blue',image:null,tags:['植物','スイーツ'],spots:[['あわじグリーン館','温室の植物を眺めながら、緑の中を散策。'],['いづも庵','名物の玉ねぎを使ったうどんが気になる。'],['幸せのパンケーキ','スイーツを楽しむひととき。席や景観は確認中。'],['淡路島バーガー','ドライブの途中に気になるひと口。店舗は未定。','店舗未定'],['ニジゲンノモリ','知っている場所から候補に。遊ぶ内容はこれから。','参考候補']]},
    tokushima:{name:'徳島',theme:'アートと、海の迫力。',icon:'◈',scene:'sea',color:'mint',image:null,tags:['美術館','クルーズ'],spots:[['大塚国際美術館','世界の名画を陶板で再現した美術館。鑑賞範囲を選んで楽しもう。'],['うずしお汽船','美術館近くの観潮船の暫定候補。潮時と運航状況の確認が必要。','暫定候補'],['ひょうたん島クルーズ','街の水辺を巡る別の楽しみ方。運航情報を確認中。','確認中'],['徳島ラーメン・海鮮・鳥料理','ご当地のごはんも気になる。具体的なお店は未定。','店舗未定']]},
    mie:{name:'三重',theme:'横丁を歩いて、おいしい寄り道。',icon:'⌂',scene:'town',color:'peach',image:null,tags:['おかげ横丁','食べ歩き'],spots:[['おかげ横丁','今回の主役。街並みを眺めながら食べ歩き。'],['伊勢神宮','お参りも気になるなら。参道を歩く時間を見込んで。'],['一升びん','松阪で焼肉を楽しむ追加候補。支店と移動は確認中。','確認中'],['伊勢志摩スカイライン','景色を楽しむ追加候補。横丁との移動を確認中。','確認中'],['うなぎグルメ','おいしいごはんの候補として。お店は未定。','店舗未定']]},
    shiga:{name:'滋賀',theme:'湖と山の景色、ごほうびのごはん。',icon:'△',scene:'lake',color:'mint',image:null,tags:['湖・山','近江牛'],spots:[['びわ湖テラス','湖と山の広がりを眺める展望スポット。天候・営業状況を確認して。'],['メタセコイア並木','季節ごとに表情が変わる並木道。ほかの候補とは距離があります。'],['比叡山のお参り','山のお寺へ。参拝する区域はこれから選びます。'],['夢見が丘の夜景','比叡山の夜景の暫定候補。夜まで過ごせる日に。','暫定候補'],['農家レストランだいきち 大津堅田店','近江牛を楽しむ食事の候補。景色スポットとの移動は確認中。']]},
    kyoto:{name:'天橋立',theme:'海を見晴らして、松並木を歩く。',icon:'≈',scene:'sea',color:'blue',image:null,tags:['海の展望','散策'],spots:[['天橋立ビューランド','高いところから、海と松並木の景色を眺めよう。'],['天橋立の松並木','景色を見ながら散策。全部を渡らず、短く歩く楽しみ方も。'],['海鮮グルメ','海鮮のお店も候補に。具体的なお店はこれから。','店舗未定']]}
  };
  const p=(id,area,name,main,detail,environment,walkingNote,companions={})=>({id,area,name,main,detail,environment,walkingNote,companions});
  const profiles=[
    p('outlet','sanda','アウトレットで買い物',{shopping:12},{},'mixed','お店を巡るため歩きます。見るお店を絞ると過ごしやすそう。'),
    p('garden','awaji','あわじグリーン館で植物を眺める',{nature:12},{green:4},'indoor','温室内を散策します。駐車場からの歩行量は確認中。'),
    p('pancake','awaji','パンケーキを目当てに',{food:6,cafe:12},{sweets:4},null,'座って楽しむ食事ですが、待ち時間や駐車場からの動線は確認中。'),
    p('udon','awaji','いづも庵でごはん',{food:12},{noodles:4},null,'駐車場からお店までの動線は確認中。'),
    p('museum','tokushima','大塚国際美術館でアート',{art:12},{},'indoor','全体の鑑賞ルートは約4km。歩く量を抑えるなら鑑賞範囲を絞って。',{boat:{points:4,reason:'観潮船の乗り場は美術館正面口から徒歩約5分。潮時と滞在時間は確認して。'}}),
    p('boat','tokushima','うずしお汽船で海の迫力を',{boat:12,nature:6},{whirlpool:4,sea:2},null,'乗降時や乗り場までの歩行量は確認中。',{art:{points:4,reason:'近くに大塚国際美術館。両方楽しむ場合は鑑賞時間と船の時刻を確認して。'}}),
    p('okage','mie','おかげ横丁で食べ歩き',{food:12,cafe:6,walk:12},{town:4},'mixed','街並みを歩いて楽しむ場所です。駐車場からの移動もあります。'),
    p('terrace','shiga','びわ湖テラスで湖の景色を',{nature:12},{lake:4},'outdoor','駐車場から山麓駅への移動や、展望エリアでの歩行があります。'),
    p('trees','shiga','メタセコイア並木へ',{nature:12},{green:4},'outdoor','歩く範囲は調整できます。駐車場からの動線は確認中。'),
    p('temple','shiga','比叡山でお参り',{walk:12,nature:6},{temple:4,lake:4},null,'参拝する区域によって歩く量が変わります。区域は未定。'),
    p('night','shiga','夢見が丘で夜景を',{nature:12},{night:4},'outdoor','駐車場から展望場所までの動線を確認中。夜間の営業条件にも注意。'),
    p('beef','shiga','だいきちで近江牛を',{food:12},{beef:4},null,'食事中心の候補です。駐車場からの動線は確認中。'),
    p('bridge','kyoto','天橋立の展望と松並木散策',{nature:12,walk:6},{sea:4,green:2,town:2},'outdoor','松並木の全区間横断は片道約50分。短い散策でも楽しむ案です。')
  ];
  // These are additional choices within the user's existing areas, not a route timetable.
  destinations.mie.spots[2]=['一升びん 本店','松阪で焼肉を楽しむ追加候補。本店を候補にしました。伊勢との移動は別途検討。','追加候補'];
  destinations.mie.spots.push(['海老丸','おかげ横丁で、海鮮丼など伊勢志摩の魚介を楽しむ。'],['ふくすけ','おかげ横丁で伊勢うどん。街並み散策と一緒に。'],['五十鈴川カフェ','五十鈴川を眺めながら、コーヒーとスイーツでひと休み。']);
  destinations.tokushima.spots[2]=['ひょうたん島クルーズ','徳島市中心部の水辺を約30分で周遊。出航時刻と当日の運航状況を確認して。'];
  profiles.push(
    p('okage-seafood','mie','おかげ横丁と海老丸の海鮮',{food:12,walk:12},{seafood:4,town:4},'mixed','横丁を散策して海老丸へ。街歩きと食事を組み合わせる候補です。'),
    p('okage-udon','mie','おかげ横丁とふくすけの伊勢うどん',{food:12,walk:12},{noodles:4,town:4},'mixed','横丁の散策と店までの徒歩移動があります。'),
    p('okage-cafe','mie','おかげ横丁と五十鈴川カフェ',{cafe:12,walk:12,nature:6},{view:4,sweets:4,town:4},'mixed','街並みを歩き、川沿いのカフェでひと休みする候補です。'),
    p('city-cruise','tokushima','ひょうたん島クルーズで街の水辺へ',{boat:12,nature:6},{city:4},null,'乗り場は徳島市中心部。鳴門の観潮船とは別の場所です。乗降の動線は確認中。')
  );
  const profileTags={outlet:['買い物','お店巡り'],garden:['植物','温室'],pancake:['スイーツ'],udon:['うどん'],museum:['アート','屋内'],boat:['観潮船'],okage:['食べ歩き','街並み'],terrace:['湖の展望'],trees:['並木','緑'],temple:['参拝'],night:['夜景'],beef:['近江牛'],bridge:['海の展望','松並木']};
  profiles.forEach(p=>{p.tags=profileTags[p.id]||[];});
  profiles.find(p=>p.id==='okage-seafood').tags=['海鮮','横丁散策'];
  profiles.find(p=>p.id==='okage-udon').tags=['伊勢うどん','横丁散策'];
  profiles.find(p=>p.id==='okage-cafe').tags=['川の景色','カフェ'];
  profiles.find(p=>p.id==='city-cruise').tags=['街の水辺','クルーズ'];
  // Reference image displayed through CSS windows; original pixels are preserved.
  // Each rectangle is [x,y,width,height] in the 1122 × 1402 supplied image.
  const referenceImages={src:'images/outings-reference.png',width:1122,height:1402,regions:{
    outlet:[36,270,261,195],steak:[38,489,150,99],coffee:[210,489,147,99],dinner:[380,489,147,99],
    awaji:[586,271,261,196],pancake:[587,491,136,97],flowers:[751,491,155,97],burger:[932,491,150,97],
    whirlpool:[39,713,258,169],museum:[40,908,142,89],cruise:[208,908,151,89],ramen:[386,908,140,89],
    shrine:[587,714,258,168],road:[587,908,137,89],beef:[750,908,153,89],eel:[928,908,151,89],
    lake:[40,1130,255,137],trees:[39,1293,147,77],temple:[209,1293,146,77],omibeef:[384,1293,143,77],
    amanohashidate:[593,1118,286,147],seafood:[589,1294,142,77],lift:[755,1294,145,77],street:[932,1294,146,77]
  }};
  const imageAssets={};
  for(const [key,alt] of Object.entries({okage:'商家の通りで食べ歩きを楽しむイメージ','ise-udon':'太い麺とたまりだれの伊勢うどんのイメージ','onion-udon':'揚げた玉ねぎとうどんのイメージ',night:'湖と街の灯りを見下ろす夜景のイメージ',pines:'海辺の松林を歩くイメージ',outlet:'アウトレットで買い物を楽しむイメージ',garden:'温室の植物を眺めるイメージ',pancake:'パンケーキのイメージ',burger:'玉ねぎ入りバーガーのイメージ',forest:'森の中のレクリエーションのイメージ'}))imageAssets[key]={src:'images/generated/'+key+'.webp',alt:alt+'（AI生成）',width:1536,height:1024};
  const profileImages={outlet:'outlet',garden:'garden',pancake:'pancake',udon:'onion-udon',night:'night',okage:'okage','okage-seafood':'okage','okage-udon':'ise-udon','okage-cafe':'okage',museum:'museum',boat:'whirlpool','city-cruise':'cruise',terrace:'lake',trees:'trees',temple:'temple',beef:'omibeef',bridge:'amanohashidate'};
  profiles.forEach(p=>{p.imageKey=profileImages[p.id];});
  const galleries={sanda:['outlet','steak','coffee','dinner'],awaji:['garden','pancake','onion-udon','burger'],tokushima:['whirlpool','museum','cruise','ramen'],mie:['okage','ise-udon','beef','eel'],shiga:['lake','trees','temple','omibeef'],kyoto:['amanohashidate','seafood','lift','pines']};
  const spotImages={sanda:[['outlet'],['steak','coffee']],awaji:[['garden'],['onion-udon'],['pancake'],['burger'],['forest']],tokushima:[['museum'],['whirlpool'],['cruise'],['ramen','seafood']],mie:[['okage'],['shrine'],['beef'],['road'],['eel']],shiga:[['lake'],['trees'],['temple'],['night'],['omibeef']],kyoto:[['amanohashidate'],['pines'],['seafood']]};
  // Avoid attaching a ramen image to an udon dish: use a general food visual.

  spotImages.mie.push(['seafood'],['ise-udon'],['coffee']);
  Object.keys(destinations).forEach(id=>{destinations[id].gallery=galleries[id];destinations[id].spotImages=spotImages[id];});
  const scoring={direct:12,partial:6,detailDirect:4,detailPartial:2,companionMax:4,environment:{indoor:{indoor:0,mixed:-2,outdoor:-4},outdoor:{indoor:-4,mixed:-1,outdoor:0}},areaOrder:Object.keys(destinations)};
  // Editorial relative burden, not measured journey times or live routing.
  const travel={origin:'大阪駅周辺',note:'高速道路利用を想定した暫定の区分です。渋滞・休憩・現地での移動は含みません。',labels:{near:'比較的短め',middle:'中くらい',far:'長め'},penalties:{short:{near:0,middle:-3,far:-6},middle:{near:0,middle:0,far:-2},long:{near:0,middle:0,far:0}}};
  travel.timePenalties={early:{near:0,middle:-2,far:-6}};
  const travelBands={outlet:'near',garden:'middle',pancake:'middle',udon:'middle',museum:'far',boat:'far',okage:'far',terrace:'middle',trees:'far',temple:'middle',night:'middle',beef:'middle',bridge:'far','okage-seafood':'far','okage-udon':'far','okage-cafe':'far','city-cruise':'far'};
  profiles.forEach(p=>{p.travelBand=travelBands[p.id];});
  const data={interests,refinements,commonQuestions,destinations,profiles,scoring,referenceImages,travel,imageAssets};
  root.DateData=data;
  if(typeof module!=='undefined'&&module.exports) module.exports=data;
})(typeof globalThis!=='undefined'?globalThis:window);
