export type Drum = 'hh' | 'snare' | 'kick' | 'tom';
export type CourseLevel = 'Beginner' | 'Medium' | 'Advanced';
export type FamousLevel = 'Easy' | 'Medium' | 'Hard';
export type Beat = {
  id: string;
  title: string;
  subtitle: string;
  level: CourseLevel | FamousLevel;
  collection: 'course' | 'famous';
  style: string;
  bpm: number;
  pattern: Record<Drum, number[]>;
};

const hits = (value: string) =>
  value.replace(/\s/g, '').slice(0, 16).padEnd(16, '-').split('').map((hit) => hit === 'x' ? 1 : 0);

const beat = (
  id: string,
  title: string,
  subtitle: string,
  level: Beat['level'],
  collection: Beat['collection'],
  style: string,
  bpm: number,
  hh: string,
  snare: string,
  kick: string,
  tom = '----------------',
): Beat => ({ id, title, subtitle, level, collection, style, bpm, pattern: { hh: hits(hh), snare: hits(snare), kick: hits(kick), tom: hits(tom) } });

export const courseBeats: Beat[] = [
  beat('b01','First Rock Beat','The essential 8th-note groove','Beginner','course','Rock',78,'x-x-x-x-x-x-x-x-','----x-------x---','x-----x-x-----x-'),
  beat('b02','Steady Pop','Even pulse with a bright backbeat','Beginner','course','Pop',92,'x-x-x-x-x-x-x-x-','----x-------x---','x-----x-x-x-----'),
  beat('b03','Four on the Floor','Quarter-note kick for dance music','Beginner','course','Dance',106,'x-x-x-x-x-x-x-x-','----x-------x---','x---x---x---x---'),
  beat('b04','Half-Time Pocket','A roomy backbeat on beat three','Beginner','course','Rock',72,'x-x-x-x-x-x-x-x-','--------x-------','x-----x-----x---'),
  beat('b05','Country Train','Alternating kick with straight hats','Beginner','course','Country',96,'x-x-x-x-x-x-x-x-','----x-------x---','x---x-x-x---x-x-'),
  beat('b06','Simple Punk','Fast, straight and energetic','Beginner','course','Punk',124,'x-x-x-x-x-x-x-x-','----x-------x---','x-x-----x-x-----'),
  beat('b07','Sixteenth Starter','Introduce a busier hi-hat hand','Beginner','course','Pop',74,'xxxxxxxxxxxxxxxx','----x-------x---','x-------x-------'),
  beat('b08','Kick Builder','Add syncopation around the backbeat','Beginner','course','Rock',82,'x-x-x-x-x-x-x-x-','----x-------x---','x--x--x-x--x--x-'),
  beat('b09','Offbeat Hats','Feel the spaces between the beats','Beginner','course','Reggae',80,'--x---x---x---x-','----x-------x---','x-------x-------'),
  beat('b10','Tiny Tom Turn','A simple fill to finish the bar','Beginner','course','Fill',84,'x-x-x-x-x-x-----','----x-------x---','x-------x-------','------------xxxx'),

  beat('m01','Driving Eighths','Extra kick notes create momentum','Medium','course','Rock',104,'x-x-x-x-x-x-x-x-','----x-------x---','x--x--x-x-x---x-'),
  beat('m02','Pop Syncopation','A displaced kick locks to the vocal','Medium','course','Pop',98,'x-x-x-x-x-x-x-x-','----x-------x---','x-x---x-x--x--x-'),
  beat('m03','Disco Open Feel','Four kicks under offbeat cymbal accents','Medium','course','Disco',116,'--x---x---x---x-','----x-------x---','x---x---x---x---'),
  beat('m04','Funk Pocket','Sixteenth hats and syncopated bass drum','Medium','course','Funk',94,'xxxxxxxxxxxxxxxx','----x-------x---','x--x----x-x--x--'),
  beat('m05','Shuffle Steps','A loping triplet-inspired pulse','Medium','course','Shuffle',88,'x--xx--xx--xx--x','----x-------x---','x------xx------x'),
  beat('m06','Linear Motion','Hands and feet answer each other','Medium','course','Linear',90,'x-x---x-x-x---x-','----x-------x-x-','x--x--x-x--x--x-'),
  beat('m07','Reggae One Drop','Leave beat one open and land on three','Medium','course','Reggae',76,'--x---x---x---x-','--------x-------','--------x-------'),
  beat('m08','Floor Tom Pulse','Use the tom as a second voice','Medium','course','Tribal',102,'x-x-x-x-x-x-x-x-','----x-------x---','x-------x-------','--x---x---x---x-'),
  beat('m09','Two-Beat Fill','A compact snare-to-tom phrase','Medium','course','Fill',96,'x-x-x-x---------','----x---x-------','x-------x-------','----------x-xxxx'),
  beat('m10','Broken Beat','Offset accents with breathing room','Medium','course','Neo Soul',86,'x-xxx-x-x-xxx-x-','----x-------x---','x--x----x-x---x-'),

  beat('a01','Ghosted Funk','Dense sixteenths with displaced accents','Advanced','course','Funk',102,'xxxxxxxxxxxxxxxx','--x-x--x--x-x-x-','x--x--x-x-x--x--'),
  beat('a02','Fast Punk Drive','Relentless hats and double kicks','Advanced','course','Punk',152,'xxxxxxxxxxxxxxxx','----x-------x---','x-x-x-x-x-x-x-x-'),
  beat('a03','Half-Time Shuffle','Triplet flow with a heavy backbeat','Advanced','course','Shuffle',92,'x-xx-xx-x-xx-xx-','--------x-------','x----x--x--x-x--'),
  beat('a04','Gospel Chops','Syncopated phrases across the kit','Advanced','course','Gospel',108,'x-xxx-xxx-xxx-xx','----x--x----x-x-','x-x---x-x--x--x-','-------x-------x'),
  beat('a05','Odd Accent Grid','Unexpected accents inside a 4/4 bar','Advanced','course','Fusion',118,'xxxx-xxxx-xxxx-xx','---x--x----x-x--','x----x-x-x----x-'),
  beat('a06','Metal Engine','Fast subdivision with driving feet','Advanced','course','Metal',168,'xxxxxxxxxxxxxxxx','----x-------x---','x-xxx-xxx-xxx-xx'),
  beat('a07','Afrobeat Layer','Interlocking kick and cymbal phrases','Advanced','course','Afrobeat',112,'x-xx-x-xx-xx-x-x','----x-------x---','x--x--x---x--x--'),
  beat('a08','Jazz Ride Comp','Broken cymbal pulse with comping voices','Advanced','course','Jazz',132,'x--xx-x-x--xx-x-','------x-----x--x','x---------x-----'),
  beat('a09','Progressive Fill','A full-bar orchestrated drum phrase','Advanced','course','Fill',126,'x-x-x-x---------','----x---x-x-----','x-------x-------','---------xxxxxxx'),
  beat('a10','D&B Sprint','Rapid breakbeat-style syncopation','Advanced','course','Drum & Bass',172,'xxxxxxxxxxxxxxxx','--x-x--x--x-x-x-','x--x---xx--x--x-'),
];

export const famousBeats: Beat[] = [
  beat('f01','We Will Rock You','The iconic stomp-stomp-clap pulse','Easy','famous','Rock',81,'----------------','--------x-------','x---x-----------'),
  beat('f02','Billie Jean','A timeless four-on-the-floor pop groove','Easy','famous','Pop',117,'x-x-x-x-x-x-x-x-','----x-------x---','x---x---x---x---'),
  beat('f03','Back in Black','A spacious, confident arena-rock beat','Easy','famous','Rock',94,'x-x-x-x-x-x-x-x-','----x-------x---','x-------x--x----'),
  beat('f04','Seven Nation Army','A simple stadium pulse to play loudly','Easy','famous','Rock',124,'x-x-x-x-x-x-x-x-','----x-------x---','x-------x-------'),
  beat('f05','Smells Like Teen Spirit','Big dynamics and a driving kick pattern','Medium','famous','Grunge',117,'x-x-x-x-x-x-x-x-','----x-------x---','x-x---x-x-x---x-'),
  beat('f06','Come Together','Laid-back tom-led pocket','Medium','famous','Rock',82,'x---x---x---x---','--------x-------','x-----------x---','--xx--x---xx--x-'),
  beat('f07','Sunday Bloody Sunday','March-like snare and kick conversation','Medium','famous','Rock',103,'x-x-x-x-x-x-x-x-','--x---x---x---x-','x---x---x---x---'),
  beat('f08','When the Levee Breaks','Huge half-time weight and space','Medium','famous','Rock',72,'x-x-x-x-x-x-x-x-','--------x-------','x--x--x-----x---'),
  beat('f09','Rosanna Shuffle','A demanding half-time shuffle feel','Hard','famous','Shuffle',84,'x-xx-xx-x-xx-xx-','--x-x---x--x-x--','x----x--x--x-x--'),
  beat('f10','Fool in the Rain','Loose triplet feel with ghosted detail','Hard','famous','Shuffle',96,'x-xx-xx-x-xx-xx-','--x-x---x--x-x--','x------xx--x----'),
  beat('f11','Funky Drummer','Syncopated funk vocabulary and ghost notes','Hard','famous','Funk',100,'xxxxxxxxxxxxxxxx','--x-x--x--xx-x--','x--x----x-x--x--'),
  beat('f12','Everlong','Fast sixteenth-note rock endurance','Hard','famous','Rock',158,'xxxxxxxxxxxxxxxx','----x-------x---','x-x--xx-x-x--xx-'),
];

export const allBeats = [...courseBeats, ...famousBeats];

