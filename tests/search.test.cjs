const test = require('node:test');
const assert = require('node:assert/strict');
const {tokens, nearWord, prepare, search} = require('../src/search.js');
const records = prepare([
 {id:'body-web',order:0,title:'Body sul web: da quale dimensione partire?',tags:'body dimensione minima minimo web sito browser desktop testo principale paragrafo font size',text:'16–24 px. Per molte UI parti da 16–18 px.',priority:3},
 {id:'body-mobile',order:1,title:'Body su mobile: limite inferiore e base consigliata',tags:'body dimensione minima minimo mobile smartphone telefono testo principale font size',text:'Non scendere sotto 14 px. 16 px è una base più prudente per il testo principale.',priority:3},
 {id:'wcag',order:2,title:'Esiste un minimo WCAG per il body?',tags:'dimensione minima minimo obbligo requisiti wcag accessibilita body web',text:'14 px non è un minimo WCAG. Questi criteri non fissano un corpo minimo universale.',priority:2},
 {id:'title-tracking',order:3,title:'Nei titoli grandi, una lieve chiusura può aiutare',tags:'tracking negativo titolo compattare lettere letter spacing spaziatura tra lettere',text:'Nei titoli di grande corpo, ridurre la spaziatura può rendere le parole più compatte.'},
 {id:'line-mobile',order:4,title:'Riga e interlinea su mobile',tags:'lunghezza larghezza riga caratteri mobile interlinea body percentuale',text:'40–50 caratteri per riga. Interlinea 1.3–1.45.'},
 {id:'smallcaps',order:5,title:'Sigle nella prosa: usa un vero maiuscoletto',tags:'maiuscoletto small caps sigle acronimi glifi',text:'Usa i glifi disegnati dal font.'},
]);
const first = query => search(query,records)[0]?.record.id;
test('a natural-language body question selects the web rule and retains the WCAG clarification',()=>{
 const results=search('quale è la dimensione minima sul web del body?',records);
 assert.equal(results[0].record.id,'body-web');assert.equal(results[1].record.id,'wcag');
});
test('mobile context selects the mobile rule',()=>{
 assert.equal(first('Dimensione minima del testo principale su smartphone'),'body-mobile');
});
test('an explicit WCAG question selects the clarification rather than a numerical recommendation',()=>{
 assert.equal(first('WCAG dimensione minima obbligatoria'),'wcag');
});
test('spacing phrases and English vocabulary resolve to the relevant concepts',()=>{
 assert.equal(first('Spazio tra le lettere nei titoli'),'title-tracking');
 assert.equal(first('letter-spacing titoli'),'title-tracking');
 assert.equal(first('small caps acronimi'),'smallcaps');
 assert.equal(first('spazio fra le righe su mobile'),'line-mobile');
});
test('a small spelling error does not hide the matching passage',()=>{
 assert.equal(first('dimenzione minima body web'),'body-web');
 assert.equal(first('interlina mobile'),'line-mobile');
 assert.equal(nearWord('trackign','tracking'),true);
 assert.equal(nearWord('tracking','tabulare'),false);
});
test('empty, filler-only and unrelated questions have no result',()=>{
 for(const query of ['', '   ', 'quale è la', 'ricetta torta cioccolato'])assert.deepEqual(search(query,records),[]);
});
test('accents, punctuation and duplicate words do not affect token matching',()=>{
 assert.deepEqual(tokens('Qual è la dimensione? DIMENSIONE!'),tokens('dimensione'));
});
test('query length is bounded and partial words can find a topic while typing',()=>{
 assert.equal(first('track'),'title-tracking');
 assert.doesNotThrow(()=>search('x'.repeat(20000),records));
});
