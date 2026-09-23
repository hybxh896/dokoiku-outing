/* 一日のおでかけ：質問・候補・根拠をここで管理。外部通信・永続保存なし。 */
(function(root){
  'use strict';
  const option=(id,label,note='')=>({id,label,note});
  const questions=[
    {id:'food',eyebrow:'まずは、食べたいもの',title:'何を食べたい気分？',hint:'今回は一日のおでかけ。食事も遊びも楽しもう。',options:[
      option('noodles','うどん'),option('meat','焼肉・牛肉料理'),option('seafood','海鮮丼・魚料理'),option('misokatsu','味噌カツ'),option('hitsumabushi','うなぎ・ひつまぶし'),option('yakisoba','ひるぜん焼そば'),option('sweets','フルーツ・スイーツ'),option('unknown','候補を見て決めたい')]},
    {id:'activity',eyebrow:'食事と一緒に楽しむこと',title:'ごはんのほかに何を楽しみたい？',hint:'食事とは別に、今日の楽しみをひとつ。',options:[
      option('jellyfish','クラゲを眺める'),option('dolphin','イルカを楽しむ','泳ぐ姿や、施設ごとの体験を'),option('nature','景色・自然'),option('walk','街歩き・お参り','お城や庭園の散策も'),option('shopping','買い物'),option('art','美術館'),option('boat','船に乗る'),option('cafe','カフェでゆっくり'),option('unknown','候補を見て決めたい')]},
    {id:'priority',eyebrow:'今回の優先順位',title:'今回は、どちらを優先して選びたい？',hint:'どちらの候補も残して、表示する順番を変えます。',options:[option('food','ごはんを優先したい'),option('activity','やりたいことを優先したい'),option('balanced','どちらも同じくらい')]},
    {id:'start',eyebrow:'出かける時間',title:'何時ごろから会えそう？',hint:'大阪駅周辺から車で出かける想定です。',options:[
      option('morning','午前中'),option('afternoon','昼過ぎ'),option('evening','夕方'),option('unknown','まだ決めていない')]},
    {id:'time',eyebrow:'帰る時間',title:'何時ごろまでに帰りたい？',hint:'往復の移動と、現地で過ごす時間を考えます。',options:[
      option('early','夕方まで','17時ごろ'),option('earlynight','夜は早めに','20時ごろ'),option('late','夜遅くても大丈夫','23時ごろまで'),option('unknown','まだ決めていない')]},
    {id:'travel',eyebrow:'最後に、ドライブの気分',title:'車での移動はどれくらいがいい？',hint:'行きたい場所と、移動の負担のバランスを。',options:[
      option('short','近場がいい'),option('middle','少し遠出したい'),option('long','遠くても大丈夫')]}
  ];
  const area=(name,theme,scene,color,spots,icon='◇')=>({name,theme,scene,color,spots,icon,image:null,gallery:[],spotImages:spots.map(()=>[])});
  const destinations={
    byakuan:area('大阪・神崎川','白庵でうどん、寄り道はその日の気分で。','town','sand',[
      ['白庵','好きなうどんを楽しむ食事の候補。一日の予定に組み込むなら、ほかの行き先も選ぼう。'],
      ['ケーキ・スイーツ','豊中・少路〜緑丘、箕面・牧落〜桜井、小野原方面で寄り道を考える案。','店舗・移動未定']
    ]),
    sanda:area('三田','お店を巡って、ひと休み。','town','sand',[
      ['神戸三田プレミアム・アウトレット','気になるお店を選びながら買い物を楽しもう。'],
      ['ランチ・カフェ','買い物と一緒に楽しむ食事は、これから選びます。','店舗未定']
    ]),
    tokushima:area('徳島','アートや船を主役に、日帰りの遠出。','sea','mint',[
      ['大塚国際美術館','見たい作品を選んで鑑賞。館内を歩く時間も見込もう。'],
      ['うずしお汽船','渦潮を見る船の候補。見頃の潮時と運航状況を確認して。'],
      ['ひょうたん島クルーズ','徳島市中心部の水辺を巡る船。鳴門の観潮船とは別の場所です。'],
      ['徳島ラーメン・海鮮・鳥料理','食べたい料理に合わせてお店を選ぶ案。','店舗・組み合わせ未定']
    ]),
    mie:area('三重・伊勢〜松阪','横丁散策と、おいしい寄り道。','town','peach',[
      ['おかげ横丁','街並みを歩いて、気になる食べ物を見つけよう。'],
      ['伊勢神宮','お参りと参道の散策。横丁と組み合わせるなら歩く時間も見込もう。'],
      ['一升びん 本店','松阪で焼肉。伊勢の横丁とは別の食事候補です。'],
      ['伊勢志摩スカイライン','景色を楽しむドライブの候補。道路の営業状況を確認して。'],
      ['松阪市内でうなぎ','うなぎのお店は松阪市内で選ぼう。食後は車で伊勢へ。'],
      ['海老丸','おかげ横丁で海鮮を楽しむ。'],
      ['ふくすけ','おかげ横丁で伊勢うどん。'],
      ['五十鈴川カフェ','横丁散策の合間にコーヒーやスイーツ。']
    ]),
    shiga:area('滋賀','湖や山の景色、近江牛を楽しみに。','sea','mint',[
      ['びわ湖テラス','天候と営業状況を確認して、湖の景色を楽しもう。'],
      ['メタセコイア並木','緑や季節の景色を楽しむ散策。滋賀のほかの候補とは距離があります。'],
      ['比叡山のお参り','参拝する区域や歩く範囲は、これから選ぼう。'],
      ['夢見が丘の夜景','夜に訪れる候補。道路や展望場所の営業条件を確認して。'],
      ['農家レストランだいきち 大津堅田店','近江牛を楽しむ食事。景色スポットとの周遊は別途確認。']
    ]),
    kyoto:area('京都・天橋立','海を見晴らして、松並木を歩く。','sea','blue',[
      ['天橋立ビューランド','展望を楽しむ候補。天候や営業状況を確認して。'],
      ['天橋立の松並木','全部を渡らず、短い散策でも。'],
      ['海鮮グルメ','海鮮のお店はこれから選びます。','店舗未定']
    ]),
    nagoya:area('名古屋・三重北部','水族館やお城、花の景色と、おいしい寄り道。','sea','blue',[
      ['名古屋港水族館','一押しはクラゲ。「くらげなごりうむ」で、ゆっくり眺める時間を。'],
      ['名古屋城','天守閣は外から眺め、本丸御殿や城内を散策。現在、天守閣の中には入れません。'],
      ['矢場とん 名古屋城金シャチ横丁店','味噌カツの店舗候補。名古屋城の正門側、義直ゾーン。'],
      ['ひつまぶし名古屋備長 金シャチ横丁店','ひつまぶしの店舗候補。名古屋城の正門側、義直ゾーン。'],
      ['なばなの里','花や庭園の景色。イルミネーションは開催日・点灯時間の確認が必要です。'],
      ['まぐろレストラン 四日市本店','海鮮丼を食べる候補。名古屋市内ではなく四日市にあります。']
    ],'✿'),
    kagawa:area('香川','うどん、水族館、イルカ、海辺。','sea','blue',[
      ['四国水族館','宇多津の水族館。海豚プールでイルカの泳ぐ姿も楽しめます。開催プログラムは当日確認して。'],
      ['日本ドルフィンセンター','さぬき市でイルカを楽しむ候補。ふれあいはプログラムの空きと開催条件を確認して。'],
      ['父母ヶ浜','三豊の海辺の景色。水鏡のような写真は潮位・風・天候によって変わります。'],
      ['本格手打うどん おか泉','香川のうどんの店舗候補。宇多津にあり、四国水族館と合わせて検討できます。']
    ],'≈'),
    okayama:area('岡山','街並みや庭園と、ご当地の味。','town','peach',[
      ['倉敷美観地区','街並みや倉敷川沿いを散策。'],
      ['岡山後楽園','庭園をゆっくり歩いて景色を楽しもう。'],
      ['やす坊のひるぜん焼そば','岡山市東区・西大寺の食事候補。ひるぜん焼そばを楽しみに。'],
      ['くらしき桃子 倉敷本店','美観地区のフルーツ・スイーツの店舗候補。パフェの果物は季節によって変わります。']
    ],'♧')
  };
  const profiles=[],planDetails={};
  function add(id,areaId,name,food,activity,main,settings={}){
    const p={id,area:areaId,name,food,activity,foodStatus:'verified',travelBand:'far',daylight:true,night:false,imageKey:null,notes:[],sources:[],...settings};
    profiles.push(p);
    planDetails[id]={main,...(settings.near?{near:settings.near}:{}),...(settings.extra?{extra:settings.extra}:{})};
  }
  const source=(label,url)=>({label,url});
  const nagoyaSource=source('名古屋港水族館・館内案内','https://www.nagoyaaqua.jp/floormap/');
  const castleSource=source('名古屋城・観覧案内','https://www.nagoyajo.city.nagoya.jp/guide/nagoyajo/');
  const foodStreetSource=source('金シャチ横丁・店舗案内','https://kinshachi-yokocho.com/');
  const shikokuSource=source('四国水族館・アクセス','https://shikoku-aquarium.jp/access/');
  const okasenSource=source('おか泉・店舗アクセス','https://www.okasen.com/honten/info/access/');
  const momokoSource=source('くらしき桃子・店舗案内','https://kurashikimomoko.jp/shop/');
  const beachSource=source('父母ヶ浜・観光案内','https://www.mitoyo-kanko.com/chichibugahama/');
  add('byakuan','byakuan','白庵でうどんを楽しむ',{noodles:10},{},[0],{travelBand:'near',daylight:false,imageKey:'ise-udon',extra:[1],notes:['食事中心の候補です。一日のおでかけにするなら、ほかの行き先も選ぼう。','昼・夜の営業と麺切れ、待ち時間を確認して。']});
  add('outlet','sanda','アウトレットで買い物',{},{shopping:10},[0],{travelBand:'near',daylight:false,imageKey:'outlet',notes:['食事のお店はまだ選んでいません。']});
  add('museum','tokushima','大塚国際美術館でアート',{},{art:10},[0],{imageKey:'museum',near:[1],notes:['観潮船も楽しむ場合は、鑑賞時間と船の時刻を確認して。']});
  add('boat','tokushima','うずしお汽船で渦潮を見る',{},{boat:10,nature:5},[1],{imageKey:'whirlpool',near:[0],notes:['渦潮の見頃と出航時間は日によって変わります。']});
  add('city-cruise','tokushima','ひょうたん島クルーズ',{},{boat:10},[2],{imageKey:'cruise'});
  add('tokushima-food','tokushima','徳島のご当地ごはんを探す',{seafood:10},{},[3],{foodStatus:'pending',notes:['お店とメニューが未定のため、食事への一致はまだ評価していません。']});
  add('okage','mie','おかげ横丁で街歩き',{},{walk:10},[0],{imageKey:'okage',near:[5,6,7],extra:[1]});
  add('okage-seafood','mie','おかげ横丁と海老丸の海鮮',{seafood:10},{walk:10},[0,5],{imageKey:'okage',near:[6,7],extra:[1]});
  add('okage-udon','mie','おかげ横丁とふくすけの伊勢うどん',{noodles:10},{walk:10},[0,6],{imageKey:'ise-udon',near:[5,7],extra:[1]});
  add('okage-cafe','mie','おかげ横丁と五十鈴川カフェ',{sweets:5},{walk:10,cafe:10},[0,7],{imageKey:'coffee',notes:['スイーツは注文内容に合わせて選ぼう。']});
  add('ise-shrine','mie','伊勢神宮でお参り',{},{walk:10},[1],{imageKey:'shrine',extra:[0]});
  add('isshobin','mie','一升びん 本店で焼肉',{meat:10},{},[2],{daylight:false,imageKey:'beef',notes:['松阪の食事候補です。伊勢への寄り道は移動時間を確認してから。']});
  add('ise-skyline','mie','伊勢志摩スカイラインの景色',{},{nature:10},[3],{notes:['営業時間・通行条件を確認してから出かけよう。']});
  add('ise-eel','mie','松阪でうなぎを食べて、伊勢を散策',{hitsumabushi:10},{walk:10},[4,0],{foodStatus:'planned',extra:[1],notes:['松阪市内でうなぎを食べて、車で伊勢のおかげ横丁へ。お店の営業時間と移動の時間に合わせて楽しもう。','伊勢神宮は時間に余裕があれば。ひつまぶしの提供は選ぶお店によって異なります。']});
  add('terrace','shiga','びわ湖テラスの景色',{},{nature:10},[0],{travelBand:'middle',imageKey:'lake'});
  add('trees','shiga','メタセコイア並木を散策',{},{nature:10,walk:5},[1],{imageKey:'trees',notes:['街並みではなく、並木道の散策として部分的に合う候補です。']});
  add('temple','shiga','比叡山でお参り',{},{walk:10},[2],{travelBand:'middle',imageKey:'temple'});
  add('night','shiga','夢見が丘で夜景を眺める',{},{nature:10},[3],{travelBand:'middle',daylight:false,night:true,imageKey:'night',notes:['夜に立ち寄れるか、道路・施設の営業時間を確認して。']});
  add('beef','shiga','だいきちで近江牛を味わう',{meat:10},{},[4],{travelBand:'middle',daylight:false,imageKey:'omibeef'});
  add('bridge','kyoto','天橋立の展望と松並木散策',{},{nature:10,walk:5},[0,1],{imageKey:'amanohashidate',notes:['食事の海鮮店は未定です。街並みではなく松並木の散策として部分的に合う候補です。']});
  add('amanohashidate-food','kyoto','天橋立で海鮮を楽しむ',{seafood:10},{},[2],{foodStatus:'pending',notes:['店舗未定。展望・散策と同時に楽しめるかは、店舗が決まってから確認します。']});
  add('nagoya-aquarium','nagoya','名古屋港水族館へ（クラゲが一押し）',{},{jellyfish:10,dolphin:10},[0],{sources:[nagoyaSource,source('名古屋港水族館・イルカパフォーマンス','https://nagoyaaqua.jp/event/')],notes:['一押しは「くらげなごりうむ」。イルカも見られます。パフォーマンスは当日の開催状況を確認して。','味噌カツ・ひつまぶしのお店と組み合わせる場合は、移動と食事の時間を別に確認して。']});
  add('nagoya-castle','nagoya','名古屋城を散策する',{},{walk:10},[1],{near:[2,3],sources:[castleSource,foodStreetSource]});
  add('nagoya-misokatsu','nagoya','名古屋城と金シャチ横丁の味噌カツ',{misokatsu:10},{walk:10},[1,2],{sources:[castleSource,foodStreetSource],notes:['矢場とん 名古屋城金シャチ横丁店を店舗候補にしています。営業日と待ち時間を確認して。']});
  add('nagoya-hitsumabushi','nagoya','名古屋城と金シャチ横丁のひつまぶし',{hitsumabushi:10},{walk:10},[1,3],{sources:[castleSource,foodStreetSource],notes:['ひつまぶし名古屋備長 金シャチ横丁店を店舗候補にしています。営業日と待ち時間を確認して。']});
  add('nabana','nagoya','なばなの里で花や庭園を楽しむ',{},{nature:10},[4],{sources:[source('なばなの里・季節のイベント','https://www.nagashima-onsen.co.jp/nabana/event/index.html')],notes:['イルミネーションも見たい場合は、開催日・点灯時間・帰宅時間を別に確認して。昼の庭園への評価です。']});
  add('maguro','nagoya','まぐろレストランで海鮮丼',{seafood:10},{},[5],{daylight:false,sources:[source('まぐろレストラン・四日市本店','https://maguro-restaurant.co.jp/restaurant/yokkaichi/')],notes:['食事中心の候補です。なばなの里や名古屋港水族館との周遊は未評価です。']});
  add('shikoku-aquarium','kagawa','四国水族館と宇多津のうどん',{noodles:10},{dolphin:10},[0,3],{sources:[shikokuSource,okasenSource,source('四国水族館・イルカ','https://shikoku-aquarium.jp/information/dolphinlive.html')],notes:['うどんは宇多津のおか泉を店舗候補に。両施設の所在地を確認した組み合わせ案です。道路状況と待ち時間は当日確認して。']});
  add('dolphin','kagawa','日本ドルフィンセンターでイルカを楽しむ',{},{dolphin:10},[1],{sources:[source('日本ドルフィンセンター・ふれあいプログラム','https://www.j-dc2.net/activity/')],notes:['見学とふれあいは別の楽しみ方。予約・開催時間・天候による変更を確認して。','さぬき市の候補です。宇多津のうどん店や父母ヶ浜とは別の場所なので、周遊は未評価です。']});
  add('chichibugahama','kagawa','父母ヶ浜で海辺の景色を楽しむ',{},{nature:10},[2],{sources:[beachSource],notes:['夕景・水鏡の写真は、干潮・風・天候・日没の条件次第です。通常の海辺の景色への評価です。']});
  add('kagawa-udon','kagawa','おか泉で讃岐うどんを味わう',{noodles:10},{},[3],{daylight:false,sources:[okasenSource],notes:['一日の食事の候補。水族館と組み合わせる案も用意しています。']});
  add('kurashiki','okayama','倉敷散策とフルーツ・スイーツ',{sweets:10},{walk:10,cafe:10},[0,3],{sources:[momokoSource,source('くらしき桃子・メニュー','https://kurashikimomoko.jp/menu/')],notes:['くらしき桃子 倉敷本店を店舗候補に。旬の果物と提供メニューは時期によって変わります。']});
  add('korakuen','okayama','後楽園で庭園をゆっくり歩く',{},{nature:10,walk:5},[1],{notes:['街並みではなく庭園の散策として部分的に合う候補です。食事は別の候補から選ぼう。']});
  add('okayama-yakisoba','okayama','岡山市のやす坊でひるぜん焼そば',{yakisoba:10},{},[2],{sources:[source('やす坊・お店とメニューの紹介','https://okayamastyle.com/yasubou/')],notes:['岡山市東区西大寺のやす坊が候補。掲載メニューは2024年時点なので、ひるぜん焼そばの提供状況はお店に確認してね。']});

  // Reviewed on 2026-09-24; references and remaining uncertainties are in docs/fact-check-2026-09-24.md.
  const reviewedNotes={"byakuan":["うどんを楽しんだ後の寄り道は、その日の気分で。","営業時間と休業日は、お店に確認してから出かけよう。"],"museum":["観潮船も楽しむなら、渦潮の見頃に合わせて鑑賞の時間を決めよう。"],"boat":["渦潮の見頃は日によって変わります。潮見表と当日の運航状況を確認して。"],"tokushima-food":["食事のお店は、食べたい料理に合わせてこれから選ぼう。"],"trees":["並木道を歩いて、季節の景色を楽しもう。"],"bridge":["展望と松並木の散策を楽しむ案です。海鮮のお店はこれから選ぼう。"],"amanohashidate-food":["海鮮のお店はこれから選ぼう。展望や散策もするなら、お店の場所と営業時間に合わせて。"],"night":["夢見が丘から大津・びわ湖の夜景を楽しむ案です。出発前にドライブウェイの営業時間を確認して。"],"nabana":["花や庭園を楽しむ案です。イルミネーションの10/4開催は確認できていないため、夜の予定に入れる前に公式案内を見よう。"],"maguro":["四日市で海鮮丼を楽しむ案です。なばなの里や名古屋港水族館も訪れるなら、移動と営業時間を確認して。"],"shikoku-aquarium":["水族館とうどんのおか泉は、どちらも宇多津にあります。食事はお店の営業時間に合わせて。","イルカプレイングタイムは、イルカの体調などで休止することがあります。"],"dolphin":["餌やり体験は当日現地受付で、事前予約はできません。トレーナー体験やドルフィンスイムは予約できます。","天候やイルカの状態により、体験の内容・時間の変更や中止があります。","施設はさぬき市にあります。宇多津や父母ヶ浜も訪れるなら、車での移動時間を見込もう。"],"chichibugahama":["水鏡のような写真は、干潮で風が穏やかな時間が狙い目。夕景も撮るなら日没時刻を確認して。"],"korakuen":["庭園をゆっくり歩いて楽しむ案です。食事は別に選ぼう。"]};
  const reviewedSources={"museum":[["大塚国際美術館・公式","https://o-museum.or.jp/"],["うずしお汽船・乗船案内","https://www.uzushio-kisen.com/kojin.html"]],"boat":[["うずしお汽船・乗船案内","https://www.uzushio-kisen.com/kojin.html"]],"isshobin":[["一升びん・公式","https://www.isshobin.com/"]],"night":[["夢見が丘・公式案内","https://hieizan-way.com/facility/yumemigaoka/"]],"ise-skyline":[["伊勢志摩スカイライン・公式","https://www.iseshimaskyline.com/"]],"ise-eel":[["伊勢神宮・参拝案内","https://www.isejingu.or.jp/visit/"]],"nagoya-misokatsu":[["矢場とん・店舗案内","https://kinshachi-yokocho.com/shop/yabaton/"]],"nagoya-hitsumabushi":[["備長・店舗案内","https://kinshachi-yokocho.com/shop/hitsumabushi_bincho/"]]};
  for(const p of profiles){
    if(reviewedNotes[p.id])p.notes=reviewedNotes[p.id];
    if(reviewedSources[p.id])p.sources.push(...reviewedSources[p.id].map(([label,url])=>source(label,url)));
    if(['nagoya-castle','nagoya-misokatsu','nagoya-hitsumabushi'].includes(p.id)){p.notes.unshift('現在、天守閣の中には入れません。本丸御殿や城内の散策を楽しもう。');p.sources.push(source('名古屋城・公式の開園案内','https://www.nagoyajo.city.nagoya.jp/'));}
  }

  const newPlanIds=new Set(['nagoya-aquarium','nagoya-castle','nagoya-misokatsu','nagoya-hitsumabushi','nabana','maguro','shikoku-aquarium','dolphin','chichibugahama','kagawa-udon','kurashiki','korakuen','okayama-yakisoba']);
  profiles.forEach(p=>{p.isNew=newPlanIds.has(p.id);});

  // Existing local illustrations remain available; no unrelated photos are assigned to new places.
  const referenceImages={src:'images/outings-reference.png',width:1122,height:1402,regions:{
    outlet:[36,270,261,195],steak:[38,489,150,99],coffee:[210,489,147,99],dinner:[380,489,147,99],
    whirlpool:[39,713,258,169],museum:[40,908,142,89],cruise:[208,908,151,89],ramen:[386,908,140,89],
    shrine:[587,714,258,168],road:[587,908,137,97],beef:[750,908,153,89],eel:[928,908,151,89],
    lake:[40,1130,255,137],trees:[39,1293,147,77],temple:[209,1293,146,77],omibeef:[384,1293,143,77],
    amanohashidate:[593,1118,286,147],seafood:[589,1294,142,77],lift:[755,1294,145,77]
  }};
  const imageAssets={'daytrip-world-hero':{src:'images/generated/daytrip-world-hero.webp',alt:'うどんや海鮮丼、街並み、お城、クラゲ、イルカ、花畑と海辺がつながるおでかけの世界',width:1536,height:1024}};
  for(const [key,alt] of Object.entries({okage:'商家の通りで食べ歩きを楽しむ','ise-udon':'太い麺とたまりだれの伊勢うどん','onion-udon':'揚げた玉ねぎとうどん',night:'湖と街の灯りを見下ろす夜景',pines:'海辺の松林を歩く',outlet:'アウトレットで買い物',garden:'温室の植物',pancake:'パンケーキ',burger:'玉ねぎ入りバーガー',forest:'森の中のレクリエーション'})){
    imageAssets[key]={src:'images/generated/'+key+'.webp',alt:alt+'のイメージ（AI生成）',width:1536,height:1024};
  }
  const galleries={byakuan:['ise-udon','pancake'],sanda:['outlet','steak','coffee'],tokushima:['whirlpool','museum','cruise'],mie:['okage','ise-udon','beef'],shiga:['lake','trees','omibeef'],kyoto:['amanohashidate','pines','seafood']};
  const spotImages={byakuan:[['ise-udon'],['pancake']],sanda:[['outlet'],[]],tokushima:[['museum'],['whirlpool'],['cruise'],[]],mie:[['okage'],['shrine'],['beef'],[],[],['seafood'],['ise-udon'],['coffee']],shiga:[['lake'],['trees'],['temple'],['night'],['omibeef']],kyoto:[['amanohashidate'],['pines'],[]]};
  const daytripImages={
    jellyfish:'青い水の中を漂うクラゲ',
    'nagoya-castle':'名古屋城をイメージした城と緑の風景',
    misokatsu:'味噌だれをかけたカツ',
    hitsumabushi:'ひつまぶしと薬味',
    'flower-garden':'色とりどりの花が咲く庭園',
    'seafood-bowl':'まぐろを中心とした海鮮丼',
    aquarium:'青い水槽で泳ぐ魚の群れ',
    dolphin:'穏やかな海面から顔を出すイルカ',
    chichibugahama:'父母ヶ浜をイメージした干潟と夕景',
    'sanuki-udon':'讃岐うどんと天ぷら',
    kurashiki:'倉敷をイメージした白壁の街並みと水路',
    korakuen:'後楽園をイメージした池と緑の庭園',
    'hiruzen-yakisoba':'鶏肉とキャベツのひるぜん焼そば',
    'fruit-parfait':'桃やぶどうのフルーツパフェ',
    'scenic-road':'伊勢志摩をイメージした海を見晴らす道'
  };
  for(const [key,alt] of Object.entries(daytripImages)){
    imageAssets[key]={src:'images/generated/daytrip-'+key+'.webp',alt:alt+'（AI生成のイメージ）',width:1536,height:1024};
  }
  for(const [key,alt] of Object.entries({eel:'うな重',beef:'焼肉',coffee:'コーヒーとケーキ'}))imageAssets[key]={src:'images/generated/refresh-'+key+'.webp',alt:alt+'のイメージ',width:1536,height:1024};
  imageAssets.omibeef=imageAssets.beef;
  imageAssets.steak=imageAssets.beef;
  imageAssets.seafood=imageAssets['seafood-bowl'];
  const addedProfileImages={
    'tokushima-food':'seafood','ise-skyline':'scenic-road','ise-eel':'eel','amanohashidate-food':'seafood',
    'nagoya-aquarium':'jellyfish','nagoya-castle':'nagoya-castle','nagoya-misokatsu':'misokatsu','nagoya-hitsumabushi':'hitsumabushi',
    nabana:'flower-garden',maguro:'seafood-bowl','shikoku-aquarium':'aquarium',dolphin:'dolphin',chichibugahama:'chichibugahama',
    'kagawa-udon':'sanuki-udon',kurashiki:'kurashiki',korakuen:'korakuen','okayama-yakisoba':'hiruzen-yakisoba'
  };
  profiles.forEach(p=>{if(addedProfileImages[p.id])p.imageKey=addedProfileImages[p.id];});
  Object.assign(galleries,{
    nagoya:['jellyfish','nagoya-castle','misokatsu','hitsumabushi','flower-garden','seafood-bowl'],
    kagawa:['aquarium','dolphin','chichibugahama','sanuki-udon'],okayama:['kurashiki','korakuen','hiruzen-yakisoba','fruit-parfait']
  });
  Object.assign(spotImages,{
    nagoya:[['jellyfish'],['nagoya-castle'],['misokatsu'],['hitsumabushi'],['flower-garden'],['seafood-bowl']],
    kagawa:[['aquarium'],['dolphin'],['chichibugahama'],['sanuki-udon']],okayama:[['kurashiki'],['korakuen'],['hiruzen-yakisoba'],['fruit-parfait']]
  });
  spotImages.sanda[1]=['coffee'];spotImages.tokushima[3]=['seafood'];spotImages.mie[3]=['scenic-road'];spotImages.mie[4]=['eel'];spotImages.kyoto[2]=['seafood'];
  for(const [id,d] of Object.entries(destinations)){d.gallery=galleries[id]||[];d.spotImages=spotImages[id]||d.spotImages;}
  const travel={
    origin:'大阪駅周辺',
    note:'高速道路を使う想定の、大まかな移動負担です。経路検索による所要時間ではありません。渋滞・休憩・現地での移動は別に確認してください。',
    labels:{near:'比較的短め',middle:'中くらい',far:'長め'},
    penalties:{short:{near:0,middle:-3,far:-6},middle:{near:0,middle:0,far:-2},long:{near:0,middle:0,far:0}}
  };
  // Editorial screening only: not verified travel times, opening hours, or a route itinerary.
  const schedule={allowedReturns:{near:{morning:['early','earlynight','late'],afternoon:['early','earlynight','late'],evening:['earlynight','late']},middle:{morning:['early','earlynight','late'],afternoon:['earlynight','late'],evening:['late']},far:{morning:['earlynight','late'],afternoon:[],evening:[]}}};
  const scoring={direct:10,partial:5,areaOrder:Object.keys(destinations)};
  const data={questions,destinations,profiles,planDetails,planGroup:id=>id,referenceImages,imageAssets,travel,schedule,scoring};
  root.DateData=data;
  if(typeof module!=='undefined'&&module.exports)module.exports=data;
})(typeof globalThis!=='undefined'?globalThis:window);
