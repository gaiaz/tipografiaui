/* Search existing guide passages: no remote services, generated answers or stored queries. */
(() => {
  'use strict';
  const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/(?:spazio|spaziatura|distanza) (?:tra|fra) (?:le )?lettere/g, ' tracking ')
    .replace(/(?:spazio|spaziatura|distanza) (?:tra|fra) (?:le )?righe/g, ' interlinea ')
    .replace(/letter[\s-]+spacing/g, ' tracking ').replace(/line[\s-]+height/g, ' interlinea ')
    .replace(/font[\s-]+size/g, ' dimensione ').replace(/font[\s-]+weight/g, ' peso ')
    .replace(/small[\s-]+caps/g, ' maiuscoletto ').replace(/old[\s-]+style/g, ' oldstyle ')
    .replace(/testo (?:principale|corrente|di lettura)|body text/g, ' body ')
    .replace(/dynamic[\s-]+type/g, ' dynamictype ').replace(/[^a-z0-9]+/g, ' ').trim();
  const stopWords = new Set(('a ad al alla alle allo ai agli anche che chi ci cio come con cosa da dal dalla dalle dei degli del della delle dello di dove e ed gli ha ho i il in io l la le lo ma mi ne nei nel nella nelle no non o per piu posso quale quali qual quanto quanta quanti quante qui se si sia sono su sui sul sulla sulle tra un una uno vorrei devo deve devono dovrei dovrebbe usare usa uso sapere dimmi trova trovare cercare scritto scrive scrivere valore valori consigliato consigliata consigliate giusto giusta indicato servono serve fa fare va viene vengono puo potrei posso mia mio').split(' '));
  const groups = {
    dimensione: ['dimensioni','grandezza','corpo','size'],
    minimo: ['minima','minimi','minime','min','minimo','piccolo','piccola','piccoli','piccole'],
    titolo: ['titoli','heading','headings'],
    body: ['paragrafo','paragrafi'],
    mobile: ['smartphone','telefono','telefoni','cellulare','cellulari','telefonino'],
    desktop: ['computer','pc','monitor'],
    interlinea: ['interlinee','leading'],
    tracking: ['spaziaturalettere'],
    peso: ['weight','pesi','grassetto','bold'],
    ios: ['apple','iphone','ipad'],
    android: ['material'],
    maiuscolo: ['maiuscole','maiuscoli','uppercase'],
    maiuscoletto: ['maiuscoletti','smallcaps'],
    oldstyle: ['elzeviriane','elzeviriani'],
    tabulare: ['tabulari','tabular'],
    proporzionale: ['proporzionali','proportional'],
    riga: ['righe'],
    scuro: ['scura','scuri','scure','dark','notturna'],
    allineamento: ['allineare','allineato','allinea'],
    centrato: ['centrati','centrata','centrare','centratura'],
    contrasto: ['contrast'],
    ingrandimento: ['ingrandire','ingrandito','ingranditi','zoom','scaling','ridimensionamento'],
    esempio: ['esempi','confronto','confronti'],
    percentuale: ['percentuali'],
    leggibilita: ['leggibile','leggibili'],
    accessibilita: ['accessibile','accessibili'],
    nomenclatura: ['nomenclature','nomi','nome'],
    numeri: ['numero','cifra','cifre'],
    font: ['carattere','famiglia','famiglie'],
  };
  const aliases = new Map();
  Object.entries(groups).forEach(([root, words]) => [root, ...words].forEach(word => aliases.set(word, root)));
  const tokens = text => [...new Set(normalize(text).split(' ').filter(word => word && !stopWords.has(word)).map(word => aliases.get(word) || word))];
  // Allow one missing/extra/changed letter, or a swapped adjacent pair.
  function nearWord(a, b) {
    if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
    let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (i === a.length || i === b.length) return true;
    if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1) ||
      (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
    return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  }
  function tokenMatch(word, field) {
    if (field.includes(word)) return 1;
    if (word.length >= 4 && field.some(term => term.startsWith(word))) return .8;
    return field.some(term => nearWord(word, term)) ? .65 : 0;
  }
  function prepare(records) {
    return records.map(record => ({...record, titleTokens: tokens(record.title), tagTokens: tokens(record.tags || ''), textTokens: tokens(record.text)}));
  }
  function search(query, records) {
    const terms = tokens(query.slice(0, 240)).slice(0, 20);
    if (!terms.length) return [];
    const ranked = records.map(record => {
      let matched = 0, score = 0;
      terms.forEach(term => {
        const title = tokenMatch(term, record.titleTokens), tags = tokenMatch(term, record.tagTokens), body = tokenMatch(term, record.textTokens);
        if (title || tags || body) matched++;
        score += Math.max(title * 7, tags * 6, body * 1.8);
      });
      const coverage = matched / terms.length;
      if (coverage < .6 || !matched) return null;
      score = score * coverage * coverage + (coverage === 1 ? 6 : 0) + (record.priority || 0);
      return {record, score};
    }).filter(Boolean).sort((a,b) => b.score - a.score || a.record.order - b.record.order);
    return ranked.filter(item => item.score >= ranked[0].score * .55).slice(0, 6);
  }
  // The pure ranking helpers can be exercised without a browser.
  if (typeof module !== 'undefined' && module.exports) module.exports = {normalize, tokens, nearWord, prepare, search};
  if (typeof document === 'undefined') return;
  const dialog = document.getElementById('guide-search');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const input = document.getElementById('guide-search-input');
  const results = document.getElementById('guide-search-results');
  const status = document.getElementById('guide-search-status');
  const suggestions = document.getElementById('guide-search-suggestions');
  const clearButton = document.getElementById('guide-search-clear');
  const goButton = document.getElementById('guide-search-go');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let currentResults = [], highlight, inputTimer;
  const clean = text => text.replace(/\s+/g, ' ').trim();
  // Adjacent styled blocks need word boundaries even when their HTML has no whitespace.
  function readText(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const parts = []; while (walker.nextNode()) parts.push(walker.currentNode.textContent);
    return clean(parts.join(' ')).replace(/\s+([.,;:!?])/g, '$1');
  }
  const slug = text => normalize(text).replace(/ /g,'-').slice(0, 85);
  const recordElements = [...document.querySelectorAll('section.chapter [data-search-title]')];
  // New sections remain searchable without maintaining a separate copy of the content.
  document.querySelectorAll('section.chapter h3, .glossary > div').forEach(element => {
    if (!element.closest('[data-search-title]') && !element.closest('#fonti')) recordElements.push(element);
  });
  const records = prepare(recordElements.map((element, order) => {
    const section = element.closest('section.chapter');
    const title = element.dataset.searchTitle || clean(element.querySelector('dt')?.textContent || element.textContent);
    const category = clean(document.querySelector('#desktop-nav a[href="#' + section.id + '"]')?.textContent || section.querySelector('h2').textContent).replace(/^(\d{2})(?=\S)/, '$1 · ');
    const fragments = [readText(element)];
    if (element.tagName === 'H3') {
      for (let next = element.nextElementSibling; next && !/^H[23]$/.test(next.tagName); next = next.nextElementSibling) {
        if (next.matches('p, ul, ol, .note')) fragments.push(readText(next));
      }
    }
    let text = clean(fragments.join(' '));
    const displayedHeading = element.tagName === 'H3' ? readText(element) : clean(element.querySelector('h3,h4,dt,.scale-role h3')?.textContent || '');
    if (displayedHeading && text.startsWith(displayedHeading)) text = text.slice(displayedHeading.length).trim();
    text = text.replace(/Vedi [^↓]+↓/g, '').trim();
    if (!element.id) {
      const base = 'guida-' + section.id + '-' + slug(title);let id=base,n=2;
      while(document.getElementById(id)) id=base+'-'+n++;
      element.id=id;
    }
    const previewSource = element.matches('.demo-case') ? element.querySelector('.rule-reminder,.tracking-postscript,.demo-panel.do figcaption') : element.matches('.rule') ? element.querySelector('p') : null;
    return {id:element.id, element, title, category, text, previewText:previewSource ? readText(previewSource) : '', tags:element.dataset.searchTags || '', priority:Number(element.dataset.searchPriority || 0), order};
  }));
  function excerpt(record) {
    const text = record.previewText || record.text;
    return text.length <= 260 ? text : text.slice(0,257).replace(/\s+\S*$/,'')+'…';
  }
  function appendMarked(parent, text, query) {
    const terms = tokens(query);
    text.split(/(\s+|[·.,;:!?()])/).forEach(part => {
      const word = tokens(part)[0];
      if (word && terms.some(term => term === word || nearWord(term,word))) {
        const mark=document.createElement('mark');mark.textContent=part;parent.append(mark);
      } else parent.append(document.createTextNode(part));
    });
  }
  function render() {
    clearTimeout(inputTimer);
    const query=input.value.trim();results.replaceChildren();
    clearButton.hidden=!query;suggestions.hidden=!!query;
    currentResults=query ? search(query,records) : [];
    goButton.disabled=!currentResults.length;
    status.textContent=!query ? 'Prova una domanda, oppure scegli un esempio.' : !tokens(query).length ? 'Aggiungi un argomento, per esempio body, interlinea o tracking.' : currentResults.length ? currentResults.length+' passaggi pertinenti. Invio apre il primo.' : 'Nessun passaggio trovato. Prova con un argomento più breve, come “body sul web” o “interlinea”.';
    currentResults.forEach(({record},index) => {
      const li=document.createElement('li');const a=document.createElement('a');a.href='#'+record.id;a.className='search-result';
      const context=document.createElement('span');context.className='search-result-context';context.textContent=record.category;
      const title=document.createElement('span');title.className='search-result-title';appendMarked(title,record.title,query);
      const preview=document.createElement('span');preview.className='search-result-preview';appendMarked(preview,excerpt(record),query);
      const action=document.createElement('span');action.className='search-result-action';action.textContent=index===0 ? 'Vai al passaggio · Invio' : 'Vai al passaggio';
      a.append(context,title,preview,action);li.append(a);results.append(li);
      a.addEventListener('click',event => {if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(record);});
    });
  }
  function navigate(record) {
    clearTimeout(inputTimer);dialog.close();
    for(let parent=record.element.parentElement;parent;parent=parent.parentElement) if(parent.tagName==='DETAILS')parent.open=true;
    if(highlight)highlight.classList.remove('search-hit');
    highlight=record.element;highlight.classList.add('search-hit');
    if(!highlight.hasAttribute('tabindex'))highlight.setAttribute('tabindex','-1');
    if(location.hash !== '#'+record.id) {
      try { history.pushState(null,'','#'+record.id); } catch { location.hash=record.id; }
    }
    highlight.focus({preventScroll:true});
    const header=document.querySelector('.topbar');const position=getComputedStyle(header).position;
    const offset=(position==='sticky'||position==='fixed' ? header.getBoundingClientRect().height : 0)+28;
    window.scrollTo({top:Math.max(0,highlight.getBoundingClientRect().top+scrollY-offset),behavior:reduceMotion.matches?'instant':'smooth'});
    document.getElementById('search-navigation-status').textContent='Passaggio trovato: '+record.title+'.';
  }
  function openSearch() {
    if(dialog.open)return;
    document.querySelector('.mobile-index').open=false;
    dialog.showModal();document.body.classList.add('search-is-open');render();input.focus();input.select();
  }
  document.querySelectorAll('[data-open-search]').forEach(button => {button.hidden=false;button.addEventListener('click',openSearch);});
  document.getElementById('guide-search-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{if(!dialog.open){clearTimeout(inputTimer);document.body.classList.remove('search-is-open');}});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();}});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
  document.getElementById('guide-search-form').addEventListener('submit',event=>{event.preventDefault();render();if(currentResults.length)navigate(currentResults[0].record);});
  input.addEventListener('input',()=>{clearTimeout(inputTimer);inputTimer=setTimeout(render,100);});
  input.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){render();const first=results.querySelector('a');if(first){event.preventDefault();first.focus();}}});
  results.addEventListener('keydown',event=>{
    const links=[...results.querySelectorAll('a')],index=links.indexOf(document.activeElement);if(index<0)return;
    if(event.key==='ArrowDown'){event.preventDefault();links[Math.min(index+1,links.length-1)].focus();}
    if(event.key==='ArrowUp'){event.preventDefault();if(index===0)input.focus();else links[index-1].focus();}
  });
  clearButton.addEventListener('click',()=>{input.value='';render();input.focus();});
  suggestions.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{input.value=button.textContent;render();input.focus();}));
  document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&!event.altKey&&event.key.toLowerCase()==='k'){event.preventDefault();dialog.open?dialog.close():openSearch();}});
  window.addEventListener('beforeprint',()=>{if(dialog.open)dialog.close();});
  // Resolve shared links to the stable, generated anchors after the index exists.
  if(location.hash) {
    const record=records.find(item=>'#'+item.id===location.hash);
    if(record) requestAnimationFrame(()=>navigate(record));
  }
})();
