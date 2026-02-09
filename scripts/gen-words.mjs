import fs from 'fs';
import path from 'path';

const dictWords = fs.readFileSync('/usr/share/dict/words', 'utf8').split('\n');
const five = dictWords.filter(w => /^[a-z]{5}$/.test(w));

const commonTargets = [
  'about','above','abuse','actor','acute','admit','adopt','adult','after','again',
  'agent','agree','ahead','alarm','album','alert','alien','align','alive','alley',
  'allow','alone','along','alter','ample','angel','anger','angle','angry','ankle',
  'apart','apple','apply','arena','argue','arise','armor','array','aside','asset',
  'audio','audit','avoid','awake','award','aware','awful','badly','basic','basin',
  'basis','beach','being','below','bench','berry','bible','birth','black','blade',
  'blame','bland','blank','blast','blaze','bleed','blend','bless','blind','block',
  'blood','bloom','blown','blues','blunt','board','bonus','boost','booth','bound',
  'brain','brand','brave','bread','break','breed','brick','bride','brief','bring',
  'broad','broke','brook','brown','brush','buddy','build','built','bunch','burst',
  'buyer','cabin','cable','candy','cargo','carry','catch','cause','cease','chain',
  'chair','chaos','charm','chase','cheap','check','cheek','cheer','chess','chest',
  'chief','child','chill','china','chunk','circa','civil','claim','clash','class',
  'clean','clear','clerk','click','cliff','climb','cling','clock','clone','close',
  'cloth','cloud','coach','coast','color','comet','comic','coral','count','court',
  'cover','crack','craft','crane','crash','crazy','cream','creek','crime','crisp',
  'cross','crowd','crown','crude','cruel','crush','cubic','curve','cycle','daily',
  'dance','death','debut','decay','delay','demon','dense','depth','devil','dirty',
  'disco','doubt','dozen','draft','drain','drama','drank','drawn','dream','dress',
  'dried','drift','drill','drink','drive','drone','drove','drunk','dryer','dying',
  'eager','eagle','early','earth','eight','elbow','elder','elect','elite','email',
  'empty','enemy','enjoy','enter','entry','equal','error','essay','event','every',
  'exact','exert','exile','exist','extra','faith','false','fancy','fatal','fault',
  'favor','feast','fence','ferry','fever','fewer','fiber','field','fifth','fifty',
  'fight','final','flame','flash','flesh','float','flood','floor','flour','fluid',
  'flush','flute','focus','force','forge','forth','forum','found','frame','frank',
  'fraud','fresh','front','frost','fruit','fully','funny','giant','given','glass',
  'globe','gloom','glory','glove','going','grace','grade','grain','grand','grant',
  'grape','graph','grasp','grass','grave','great','green','greet','grief','grill',
  'grind','gross','group','grove','grown','guard','guess','guest','guide','guild',
  'guilt','habit','happy','harsh','heart','heavy','hence','hobby','honey','honor',
  'horse','hotel','house','human','humor','hurry','ideal','image','imply','index',
  'indie','inner','input','irony','issue','ivory','jewel','joint','judge','juice',
  'juicy','knack','kneel','knife','knock','known','label','labor','lance','large',
  'laser','later','laugh','layer','learn','lease','least','leave','legal','lemon',
  'level','light','limit','linen','liver','local','lodge','logic','loose','lover',
  'lower','lucky','lunch','magic','major','maker','manor','march','marry','match',
  'mayor','media','mercy','merit','metal','meter','might','minor','minus','mixed',
  'model','money','month','moral','mount','mouse','mouth','movie','music','naked',
  'nerve','never','night','noble','noise','north','noted','novel','nurse','nylon',
  'occur','ocean','offer','often','olive','onset','opera','orbit','order','organ',
  'other','outer','owner','oxide','ozone','paint','panel','panic','paper','party',
  'paste','patch','pause','peace','peach','pearl','penny','phase','phone','photo',
  'piano','piece','pilot','pinch','pitch','pixel','place','plain','plane','plant',
  'plate','plead','plaza','plumb','plump','point','polar','porch','pound','power',
  'press','price','pride','prime','print','prior','prize','probe','prone','proof',
  'proud','prove','psalm','pulse','punch','pupil','purse','queen','query','quest',
  'queue','quick','quiet','quota','quote','radar','radio','raise','rally','ranch',
  'range','rapid','ratio','reach','react','ready','realm','rebel','refer','reign',
  'relax','reply','rider','ridge','rifle','right','rigid','rival','river','robin',
  'robot','rocky','rouge','rough','round','route','royal','rugby','rural','saint',
  'salad','sauce','scale','scare','scene','scent','scope','score','scout','screw',
  'seize','sense','serve','setup','seven','shade','shaft','shake','shall','shame',
  'shape','share','shark','sharp','shave','sheep','sheer','sheet','shelf','shell',
  'shift','shine','shirt','shock','shoot','shore','short','shout','shown','shrub',
  'sight','since','sixth','sixty','sized','skill','skull','slash','slate','slave',
  'sleep','slice','slide','slope','small','smart','smell','smile','smoke','snake',
  'solar','solid','solve','sorry','sound','south','space','spare','spark','speak',
  'speed','spend','spice','spine','spite','split','spoke','sport','spray','squad',
  'stack','staff','stage','stain','stair','stake','stale','stall','stamp','stand',
  'stark','start','state','stave','stays','steam','steel','steep','steer','stern',
  'stick','stiff','still','stock','stone','stood','store','storm','story','stout',
  'stove','strap','straw','strip','stuck','study','stuff','stump','style','sugar',
  'suite','sunny','super','surge','swamp','swear','sweat','sweep','sweet','swept',
  'swift','swing','sworn','table','taste','teach','teeth','tempo','thank','theme',
  'there','thick','thief','thing','think','third','those','three','threw','throw',
  'thumb','tidal','tiger','tight','timer','tired','title','toast','today','token',
  'topic','total','touch','tough','towel','tower','toxic','trace','track','trade',
  'trail','train','trait','trash','treat','trend','trial','tribe','trick','troop',
  'truck','truly','trunk','trust','truth','tumor','twice','twist','ultra','uncle',
  'under','unify','union','unite','unity','until','upper','upset','urban','usage',
  'usual','utter','valid','value','valve','vapor','vault','verse','video','vigor',
  'viral','virus','visit','vital','vivid','vocal','voice','voter','waist','waste',
  'watch','water','weary','weave','wedge','weigh','weird','whale','wheat','wheel',
  'where','which','while','white','whole','whose','widow','width','witch','woman',
  'world','worry','worse','worst','worth','would','wound','wrath','write','wrong',
  'wrote','yield','young','youth','crane','crate','stare','roast','moist','plank',
  'stomp','clasp','brine','plume','shrug','truce','smelt','swirl','prism','tulip',
  'cloak','knelt','wield','shove','quilt','badge','niche','waltz','kayak','omega',
  'zebra','yacht','acorn','adore','amber','ankle','attic','azure','bacon','badge',
  'baker','baton','belly','birch','bless','bliss','bloom','bluff','bonus','botch',
  'brace','brash','brave','brisk','broth','budge','cedar','chalk','chant','charm',
  'chewy','chose','cigar','civic','clang','clasp','click','climb','cloud','clown',
  'couch','cozy','crawl','crown','crumb','crush','dairy','daisy','dance','dazed',
  'decor','depot','ditch','dodge','doing','donor','doubt','dough','dwarf','eagle',
  'easel','eaten','eerie','eight','ember','endow','epoch','equip','erode','evade',
  'evoke','expel','faint','fairy','feast','fetch','fever','fiber','fifty','filth',
  'finch','flame','flare','flask','flock','focal','force','frail','fraud','fresh',
  'frost','froze','gauge','gazer','giddy','glare','gleam','glide','gloat','globe',
  'gloss','gnash','goose','gouge','grace','grasp','graze','greed','gripe','grope',
  'growl','gruel','grunt','guise','gully','gusty','haven','hazel','heady','heave',
  'hedge','heron','hoist','homer','hover','husky','hyena','icing','igloo','inane',
  'index','inept','inner','ivory','joker','jolly','judge','kebab','knead','laden',
  'lapse','latch','layer','ledge','lilac','lingo','llama','lobby','lofty','logic',
  'lucid','lumen','lunar','lunge','lusty','lynch','lyric','macho','mango','manor',
  'maple','marsh','mason','matte','melon','mercy','midge','mince','mirth','mocha',
  'mogul','month','moose','motel','motto','mound','mourn','muddy','mulch','mummy',
  'mural','nasal','nerve','noble','notch','nudge','oaken','oasis','olive','onset',
  'optic','orbit','outdo','oxide','panda','panic','paste','patch','pearl','penal',
  'perch','petal','petty','plaid','plead','plier','pluck','plumb','plump','plush',
  'poach','poesy','poker','polar','posse','pouch','prawn','preen','prick','prune',
  'puppy','quail','qualm','quart','queen','queer','quest','quota','quirk','quite',
  'rabid','radar','ramen','raven','react','reign','relax','resin','ridge','rigor',
  'rinse','risky','rival','roach','robot','rocky','rogue','roost','rugby','rumba',
  'rumor','rupee','rusty','sabot','salty','sauna','savor','scald','scalp','scene',
  'scone','scope','sedan','seize','semen','shade','shady','shale','shirt','shrub',
  'siege','sissy','skull','slang','slant','slick','sling','sloth','slugs','smack',
  'snail','snare','sneer','snore','snout','soggy','sonic','spade','spank','spawn',
  'spear','spell','spill','spoke','spoon','spout','squat','squid','staff','stain',
  'stale','stalk','stall','stare','stash','steal','steed','stern','stint','stoic',
  'stoke','stork','stout','strap','strip','strum','strut','stung','stunk','suave',
  'sushi','swamp','swarm','swept','swine','swipe','swoon','sword','taboo','talon',
  'tango','taper','tempo','tenor','thorn','thump','tiger','toast','topaz','torch',
  'tramp','trawl','trend','triad','tribe','trill','tripe','trite','troll','trout',
  'tryst','tuber','tulip','tunic','twang','tweak','tweed','twine','udder','ulcer',
  'uncut','unfed','unfit','untie','usher','utile','valet','valor','valve','vapor',
  'vault','vegan','vigor','villa','vinyl','viola','viper','visor','vivid','vixen',
  'vocal','vodka','vogue','voila','voter','vouch','vowel','wagon','waltz','watch',
  'weave','wedge','wheat','whiff','whine','whirl','witch','woken','wound','wrist',
];

const playable = [...new Set(commonTargets.filter(w => /^[a-z]{5}$/.test(w)))].sort();
const targetSet = new Set(playable);

// Score dict words by letter frequency
const freq = {};
five.forEach(w => { new Set(w.split('')).forEach(c => { freq[c] = (freq[c] || 0) + 1; }); });

function scoreWord(w) {
  const unique = new Set(w.split(''));
  return unique.size * 100 + w.split('').reduce((s, c) => s + (freq[c] || 0), 0);
}

// Add common dict words to reach ~2300 targets
const dictScored = five
  .filter(w => !targetSet.has(w))
  .map(w => [w, scoreWord(w)])
  .sort((a, b) => b[1] - a[1]);

for (const [w] of dictScored) {
  if (targetSet.size >= 2300) break;
  // Skip words with triple letters or all consonants
  if (!/(.)\1\1/.test(w) && /[aeiou]/.test(w)) {
    targetSet.add(w);
  }
}

const targets = [...targetSet].sort();
const validWords = five.filter(w => !targetSet.has(w)).sort();

const outDir = path.resolve('public/data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'targets.json'), JSON.stringify(targets));
fs.writeFileSync(path.join(outDir, 'valid.json'), JSON.stringify(validWords));
fs.writeFileSync(path.join(outDir, 'playable.json'), JSON.stringify(playable));

console.log('targets:', targets.length);
console.log('valid:', validWords.length);
console.log('playable:', playable.length);
console.log('sample targets:', targets.slice(100, 110));
