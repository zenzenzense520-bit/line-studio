import test from 'node:test';
import assert from 'node:assert/strict';
import {blankProject,parseLyrics} from '../lib/studio.ts';
import {lyricHtml,subtitles} from '../lib/studio-exports.ts';

test('portable HTML escapes user-provided lyrics, names and metadata',()=>{const p=blankProject();p.title='<script>alert(1)</script>';p.members[0].name='<img onerror="bad()">';p.segments=parseLyrics('<script>example</script>');p.segments[0].memberIds=[p.members[0].id];const html=lyricHtml(p);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.match(html,/&lt;script&gt;/);});
test('SRT preserves imported millisecond intervals and names',()=>{const p=blankProject();p.segments=parseLyrics('1\n00:00:01,123 --> 00:00:02,456\nTest line');p.segments[0].memberIds=[p.members[0].id];assert.match(subtitles(p,'srt'),/00:00:01,123 --> 00:00:02,456/);assert.match(subtitles(p,'srt'),/\[歌手 A\] Test line/);});
test('subtitles require complete intervals and ASS neutralizes override codes',()=>{const p=blankProject();p.segments=parseLyrics('untimed');assert.throws(()=>subtitles(p,'srt'),/完整时间/);p.segments[0]={...p.segments[0],startMs:0,endMs:1000,timing:'verified',text:'{\\pos(0,0)}line'};const ass=subtitles(p,'ass');assert.ok(!ass.includes('{\\pos'));assert.match(ass,/Dialogue: 0,0:00:00.00,0:00:01.00/);});
