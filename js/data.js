/* 質問・候補・配点はこのファイルで編集。外部通信・永続保存なし。 */
(function (root) {
  'use strict';
  const option = (id, label, note = '') => ({id, label, note});
  const interests = [
    option('food','おいしいごはん','おでかけ先で、おいしいものを'),
    option('cafe','カフェ・スイーツ','甘いものと、ひと休み'),
    option('nature','景色・自然','海や山、緑に会いに'),
    option('shopping','洋服や雑貨の買い物','気になるお店をのぞきたい'),
    option('art','美術館でアート','作品をゆっくり楽しみたい'),
    option('boat','船に乗る','いつもと違う景色を見たい'),
    option('walk','街並み散策・お参り','歩きながら、寄り道も'),
    option('none','まだ決めていない','候補を見て考えたい')
  ];
  const refinements={
    food:{title:'何を食べたい気分？',options:[option('noodles','うどん'),option('beef','肉料理','候補は牛肉料理が中心です'),option('seafood','海鮮'),option('other','ほかのものがいい','ほかの候補を見ながら考えたい'),option('any','特に決めていない')]},
    cafe:{title:'どんなお茶の時間がいい？',options:[option('sweets','甘いものを楽しみたい'),option('view','景色を見ながら過ごしたい'),option('any','どちらでもいい')]},
    nature:{title:'どんな景色が気になる？',options:[option('sea','海'),option('lake','湖や山'),option('green','植物・緑'),option('night','夜景'),option('any','特に決めていない')]},
    boat:{title:'どちらの体験が気になる？',options:[option('whirlpool','渦潮を見たい'),option('city','街の水辺を巡りたい'),option('any','どちらでもいい')]},
    walk:{title:'どんな街歩きが気になる？',options:[option('town','街並み・食べ歩き'),option('temple','お寺や神社'),option('both','両方気になる','どちらか一方の候補でもOK'),option('any','特に決めていない')]}
  };
  Object.values(refinements).forEach(q=>{
    if(!q.options.some(o=>o.id==='other'))q.options.push(option('other','ほかのものがいい','ほかの候補を見ながら考えたい'));
    q.options.push(option('neither','楽しみ方を選び直す'));
  });
  const scheduleQuestions=[
    {id:'duration',eyebrow:'まずは、過ごす時間から',title:'今回はどれくらい一緒に過ごしたい？',hint:'短く会う日も、ゆっくり出かける日も。',options:[option('meal','ごはんだけ'),option('tea','ごはんとお茶くらい'),option('half','半日くらい'),option('day','一日ゆっくり'),option('unknown','まだ決めていない')]},
    {id:'start',eyebrow:'集合の時間',title:'何時ごろから会えそう？',hint:'だいたいの時間で大丈夫。',options:[option('morning','朝から'),option('noon','お昼ごろ'),option('afternoon','午後から'),option('evening','夕方から'),option('unknown','まだ決めていない')]}
  ];
  const commonQuestions=[
    {id:'travel',eyebrow:'車での移動',title:'車での移動はどれくらいがいい？',hint:'大阪駅周辺から出かける想定です。',options:[option('short','なるべく短め'),option('middle','ほどよくドライブ'),option('long','長めでも大丈夫'),option('unknown','まだ決めていない')]},
    {id:'extras',eyebrow:'ここまででも診断できます',title:'もう少し好みを伝える？',hint:'歩く量や帰りたい時間など、追加の希望を選べます。',options:[option('skip','このまま結果を見る'),option('yes','細かな希望も伝える')]},
    {id:'walking',eyebrow:'もう少し、好みを教えて',title:'歩く量の希望は？',hint:'歩く量が気になる場合は、結果の説明も参考にしてね。',options:[option('low','座って過ごす時間を多めに'),option('medium','休憩しながら少し歩きたい'),option('high','散策も楽しみたい'),option('unknown','特に希望なし')]},
    {id:'environment',eyebrow:'もう少し、好みを教えて',title:'過ごす場所の希望は？',options:[option('indoor','屋内中心'),option('outdoor','屋外も楽しみたい'),option('any','どちらでもいい')]},
    {id:'time',eyebrow:'もう少し、好みを教えて',title:'帰りたい時間はある？',hint:'移動時間もあるので、だいたいの希望を教えてね。',options:[option('early','夕方までに帰りたい'),option('earlynight','夜は早めに帰りたい'),option('unknown','特に決めていない')]},
    {id:'companion',eyebrow:'余裕があるなら',title:'余裕があれば、ほかに何をしたい？',hint:'無理のない範囲で、寄り道も。',options:[option('cafe','お茶・スイーツ'),option('shopping','少し買い物'),option('walk','少し散歩'),option('none','追加せずゆっくり'),option('unknown','当日決めたい')]}
  ];
  const destinations = {
    sanda:{name:'三田',theme:'お店をのぞいて、ひと休み。',icon:'♧',scene:'town',color:'sand',image:null,tags:['買い物','カフェ'],spots:[['神戸三田プレミアム・アウトレット','今回の主役。気になるお店をゆっくり巡ろう。'],['ランチ・カフェ','買い物の合間にひと休み。お店はこれから選びます。','候補を整理中']]},
    awaji:{name:'淡路島',theme:'植物とおいしいごはんを楽しもう。',icon:'☀',scene:'island',color:'blue',image:null,tags:['植物','スイーツ'],spots:[['あわじグリーン館','温室の植物を眺めながら、緑の中を散策。'],['いづも庵','名物の玉ねぎを使ったうどんが気になる。'],['幸せのパンケーキ','スイーツを楽しむひととき。席や景観は確認中。'],['淡路島バーガー','ドライブの途中にバーガーを楽しむ案。お店はこれから。','店舗未定'],['ニジゲンノモリ','どんな遊びをするかは、これから相談しよう。','参考候補']]},
    tokushima:{name:'徳島',theme:'アートと、海の迫力。',icon:'◈',scene:'sea',color:'mint',image:null,tags:['美術館','クルーズ'],spots:[['大塚国際美術館','世界の名画を陶板で再現した美術館。鑑賞範囲を選んで楽しもう。'],['うずしお汽船','美術館近くから船に乗って渦潮を見に。見頃の時間と運航状況を確認しよう。','候補として検討中'],['ひょうたん島クルーズ','街の水辺を巡る別の楽しみ方。運航情報を確認中。','確認中'],['徳島ラーメン・海鮮・鳥料理','ご当地のごはんも気になる。具体的なお店は未定。','店舗未定']]},
    mie:{name:'三重',theme:'横丁を歩いて、おいしい寄り道。',icon:'⌂',scene:'town',color:'peach',image:null,tags:['おかげ横丁','食べ歩き'],spots:[['おかげ横丁','今回の主役。街並みを眺めながら食べ歩き。'],['伊勢神宮','お参りも気になるなら。参道を歩く時間を見込んで。'],['一升びん','松阪で焼肉を楽しむ追加候補。支店と移動は確認中。','確認中'],['伊勢志摩スカイライン','景色を楽しむ追加候補。横丁との移動を確認中。','確認中'],['うなぎグルメ','おいしいごはんの候補として。お店は未定。','店舗未定']]},
    shiga:{name:'滋賀',theme:'湖と山の景色、ごほうびのごはん。',icon:'△',scene:'lake',color:'mint',image:null,tags:['湖・山','近江牛'],spots:[['びわ湖テラス','湖と山の広がりを眺める展望スポット。天候・営業状況を確認して。'],['メタセコイア並木','季節ごとに表情が変わる並木道。ほかの候補とは距離があります。'],['比叡山のお参り','山のお寺へ。参拝する区域はこれから選びます。'],['夢見が丘の夜景','比叡山の夜景の候補として検討中。夜まで過ごせる日に。','候補として検討中'],['農家レストランだいきち 大津堅田店','近江牛を楽しむ食事の候補。景色スポットとの移動は確認中。']]},
    kyoto:{name:'天橋立',theme:'海を見晴らして、松並木を歩く。',icon:'≈',scene:'sea',color:'blue',image:null,tags:['海の展望','散策'],spots:[['天橋立ビューランド','高いところから、海と松並木の景色を眺めよう。'],['天橋立の松並木','景色を見ながら散策。全部を渡らず、短く歩く楽しみ方も。'],['海鮮グルメ','海鮮のお店も候補に。具体的なお店はこれから。','店舗未定']]}
  };
  destinations.byakuan={name:'大阪市淀川区｜白庵（神崎川駅近く）',theme:'白庵でうどん、気が向いたらケーキ',textOnly:false,planNote:'好きなうどんを食べることがメインの、車で出かける短めのプラン。',duration:'食事とお茶で2〜3時間程度が目安。移動・待ち時間は別です。',tags:['うどん','短め','ケーキは気分で'],spots:[['神崎川の白庵でうどん','食事だけで解散しても予定どおり。好きなうどんを楽しもう。'],['余裕があれば、ケーキやスイーツ','お店は事前に決め込まず、その日の気分や元気に合わせて。','気が向いたら'],['近めに寄るなら：豊中・少路〜緑丘','ケーキやスイーツのお店を当日の気分で選ぶ候補エリア。','店舗未定'],['ドライブも楽しむなら：箕面・牧落〜桜井、小野原方面','車での寄り道も楽しみたい日に。具体的なお店と移動時間はこれから。','店舗未定'],['お茶を楽しんだら解散','カフェを入れても、食事とお茶で全体2〜3時間程度。移動・待ち時間は別に考えよう。']]};
  const p=(id,area,name,main,detail,environment,walkingNote,companions={})=>({id,area,name,main,detail,environment,walkingNote,companions});
  const profiles=[
    p('outlet','sanda','アウトレットで買い物',{shopping:12},{},'mixed','お店を巡るため歩きます。見るお店を絞ると過ごしやすそう。'),
    p('garden','awaji','あわじグリーン館で植物を眺める',{nature:12},{green:4},'indoor','温室内を散策します。駐車場から歩く距離は確認中。'),
    p('pancake','awaji','パンケーキを楽しむ',{food:6,cafe:12},{sweets:4},null,'座って楽しむ食事ですが、待ち時間や駐車場から歩く道のりは確認中。'),
    p('udon','awaji','いづも庵でごはん',{food:12},{noodles:4},null,'駐車場からお店までの道のりは確認中。'),
    p('museum','tokushima','大塚国際美術館でアート',{art:12},{},'indoor','全体の鑑賞ルートは約4km。歩く量を抑えるなら鑑賞範囲を絞って。',{boat:{points:4,reason:'観潮船の乗り場は美術館正面口から徒歩約5分。潮時と滞在時間は確認して。'}}),
    p('boat','tokushima','うずしお汽船で渦潮を見る',{boat:12,nature:6},{whirlpool:4,sea:2},null,'乗り降りのしやすさや、乗り場まで歩く距離は確認中。',{art:{points:4,reason:'近くに大塚国際美術館。両方楽しむ場合は鑑賞時間と船の時刻を確認して。'}}),
    p('okage','mie','おかげ横丁で食べ歩き',{food:12,cafe:6,walk:12},{town:4},'mixed','街並みを歩いて楽しむ場所です。駐車場からの移動もあります。'),
    p('terrace','shiga','びわ湖テラスで景色を楽しむ',{nature:12},{lake:4},'outdoor','駐車場から山麓駅への移動や、展望エリアでの歩行があります。'),
    p('trees','shiga','メタセコイア並木を散策',{nature:12},{green:4},'outdoor','歩く範囲は調整できます。駐車場から歩く道のりは確認中。'),
    p('temple','shiga','比叡山でお参り',{walk:12,nature:6},{temple:4,lake:4},null,'参拝する区域によって歩く量が変わります。区域は未定。'),
    p('night','shiga','夢見が丘で夜景を眺める',{nature:12},{night:4},'outdoor','駐車場から展望場所までの道のりを確認中。夜間の営業条件にも注意。'),
    p('beef','shiga','だいきちで近江牛を味わう',{food:12},{beef:4},null,'食事中心の候補です。駐車場から歩く道のりは確認中。'),
    p('bridge','kyoto','天橋立の展望と松並木散策',{nature:12,walk:6},{sea:4,green:2,town:2},'outdoor','松並木の全区間横断は片道約50分。短い散策でも楽しむ案です。')
  ];
  // These are additional choices within the user's existing areas, not a route timetable.
  destinations.mie.spots[2]=['一升びん 本店','松阪で焼肉を食べるなら。伊勢からの移動もあるので、時間に余裕のある日に。','追加候補'];
  destinations.mie.spots.push(['海老丸','おかげ横丁で、海鮮丼など伊勢志摩の魚介を楽しむ。'],['ふくすけ','おかげ横丁で伊勢うどん。街並み散策と一緒に。'],['五十鈴川カフェ','五十鈴川を眺めながら、コーヒーとスイーツでひと休み。']);
  destinations.tokushima.spots[2]=['ひょうたん島クルーズ','徳島市中心部の水辺を約30分で周遊。出航時刻と当日の運航状況を確認して。'];
  profiles.push(
    p('okage-seafood','mie','おかげ横丁と海老丸の海鮮',{food:12,walk:12},{seafood:4,town:4},'mixed','横丁を散策して海老丸へ。街歩きと食事を組み合わせる候補です。'),
    p('okage-udon','mie','おかげ横丁とふくすけの伊勢うどん',{food:12,walk:12},{noodles:4,town:4},'mixed','横丁の散策と店までの徒歩移動があります。'),
    p('okage-cafe','mie','おかげ横丁と五十鈴川カフェ',{cafe:12,walk:12,nature:6},{view:4,sweets:4,town:4},'mixed','街並みを歩き、川沿いのカフェでひと休みする候補です。'),
    p('city-cruise','tokushima','ひょうたん島クルーズで街の水辺を巡る',{boat:12,nature:6},{city:4},null,'乗り場は徳島市中心部。鳴門の観潮船とは別の場所です。乗り降りのしやすさは確認中。')
  );
  profiles.push(p('byakuan','byakuan','近場でうどん、気が向いたらスイーツ',{food:12},{noodles:4},'indoor','食事が主役。待ち時間や駐車場からの移動は当日確認して。'));
  const profileTags={byakuan:['うどん','短め','ケーキは気分で'],outlet:['買い物','お店巡り'],garden:['植物','温室'],pancake:['スイーツ'],udon:['うどん'],museum:['アート','屋内'],boat:['観潮船'],okage:['食べ歩き','街並み'],terrace:['湖の展望'],trees:['並木','緑'],temple:['参拝'],night:['夜景'],beef:['近江牛'],bridge:['海の展望','松並木']};
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
  const profileImages={byakuan:'ise-udon',outlet:'outlet',garden:'garden',pancake:'pancake',udon:'onion-udon',night:'night',okage:'okage','okage-seafood':'okage','okage-udon':'ise-udon','okage-cafe':'okage',museum:'museum',boat:'whirlpool','city-cruise':'cruise',terrace:'lake',trees:'trees',temple:'temple',beef:'omibeef',bridge:'amanohashidate'};
  profiles.forEach(p=>{p.imageKey=profileImages[p.id];});
  const galleries={sanda:['outlet','steak','coffee','dinner'],awaji:['garden','pancake','onion-udon','burger'],tokushima:['whirlpool','museum','cruise','ramen'],mie:['okage','ise-udon','beef','eel'],shiga:['lake','trees','temple','omibeef'],kyoto:['amanohashidate','seafood','lift','pines']};
  const spotImages={sanda:[['outlet'],['steak','coffee']],awaji:[['garden'],['onion-udon'],['pancake'],['burger'],['forest']],tokushima:[['museum'],['whirlpool'],['cruise'],['ramen','seafood']],mie:[['okage'],['shrine'],['beef'],['road'],['eel']],shiga:[['lake'],['trees'],['temple'],['night'],['omibeef']],kyoto:[['amanohashidate'],['pines'],['seafood']]};
  // Avoid attaching a ramen image to an udon dish: use a general food visual.

  spotImages.mie.push(['seafood'],['ise-udon'],['coffee']);
  galleries.byakuan=['ise-udon','pancake'];spotImages.byakuan=[['ise-udon'],['pancake'],[],[],[]];

  Object.keys(destinations).forEach(id=>{destinations[id].gallery=galleries[id];destinations[id].spotImages=spotImages[id];});
  const scoring={direct:12,partial:6,detailDirect:4,detailPartial:2,companionMax:4,environment:{indoor:{indoor:0,mixed:-2,outdoor:-4},outdoor:{indoor:-4,mixed:-1,outdoor:0}},areaOrder:Object.keys(destinations)};
  // Editorial relative burden, not measured journey times or live routing.
  const travel={origin:'大阪駅周辺',note:'高速道路を使う想定で、大まかに分けています。渋滞や休憩、現地での移動によっても変わります。',labels:{near:'比較的短め',middle:'中くらい',far:'長め'},penalties:{short:{near:0,middle:-3,far:-6},middle:{near:0,middle:0,far:-2},long:{near:0,middle:0,far:0}}};
  travel.timePenalties={early:{near:0,middle:-2,far:-6},earlynight:{near:0,middle:0,far:-3}};
  const travelBands={byakuan:'near',outlet:'near',garden:'middle',pancake:'middle',udon:'middle',museum:'far',boat:'far',okage:'far',terrace:'middle',trees:'far',temple:'middle',night:'middle',beef:'middle',bridge:'far','okage-seafood':'far','okage-udon':'far','okage-cafe':'far','city-cruise':'far'};
  profiles.forEach(p=>{p.travelBand=travelBands[p.id];});
  const schedulePolicy={shortDurations:['meal','tea'],shortProfiles:['byakuan'],lateStarts:['afternoon','evening'],eveningProfiles:['byakuan','night','outlet']};
  const planDetails={
    outlet:{main:[0],near:[1]},garden:{main:[0]},pancake:{main:[2]},udon:{main:[1]},
    museum:{main:[0],near:[1]},boat:{main:[1],near:[0]},'city-cruise':{main:[2]},
    okage:{main:[0],near:[5,6,7],extra:[1],drive:[2,3,4]},
    terrace:{main:[0]},trees:{main:[1]},temple:{main:[2]},night:{main:[3]},beef:{main:[4]},
    bridge:{main:[0,1],extra:[2]},byakuan:{main:[0],extra:[1,2],drive:[3],ending:[4]}
  };
  const planGroup=id=>id.startsWith('okage')?'okage':id;
  const data={planDetails,planGroup,schedulePolicy,interests,refinements,commonQuestions,scheduleQuestions,destinations,profiles,scoring,referenceImages,travel,imageAssets};
  root.DateData=data;
  if(typeof module!=='undefined'&&module.exports) module.exports=data;
})(typeof globalThis!=='undefined'?globalThis:window);
