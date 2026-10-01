# La tipografia fa interfaccia

Materiale didattico realizzato da **Gaia Zuccaro** per il **Master UI di Talent Garden**.

Un vademecum in italiano dedicato alle regole base della tipografia nelle interfacce: dimensioni, interlinea, lunghezza delle righe, gerarchia, nomenclature, accessibilità e dettagli tipografici. Le regole sono accompagnate da esempi visivi Do e Don’t, una scala desktop/mobile e un confronto approfondito tra Apple/iOS e Material/Android.

## Aprire la guida

Scarica il repository con **Code → Download ZIP**, estrailo e apri [index.html](index.html) nel browser. Anche [vademecum-tipografia-ui.html](vademecum-tipografia-ui.html) contiene la guida completa ed è adatto alla condivisione come singolo file.

I due HTML sono identici e autonomi: font, stili ed esempi sono incorporati. La guida funziona anche offline; i collegamenti alle fonti richiedono una connessione. Il laboratorio interattivo richiede JavaScript.

Usa **Stampa / Salva PDF** nella guida per ottenere una versione impaginata per la stampa. L’aspetto finale può variare leggermente tra browser.

## Cercare un argomento

Premi **Cerca nella guida**, oppure **⌘K** su Mac / **Ctrl+K** su Windows e Linux. Puoi scrivere una domanda, per esempio «Qual è la dimensione minima del body sul web?», oppure un argomento come «tracking dei titoli».

La ricerca mostra i passaggi pertinenti con un estratto del testo. **Invio** o **Vai** apre il primo risultato; puoi anche scegliere un risultato diverso. Il passaggio viene evidenziato nella guida e gli eventuali riepiloghi chiusi si aprono automaticamente. **Esc** chiude la ricerca.

La ricerca funziona offline e riconosce sinonimi e piccoli errori di battitura. Cerca nei contenuti della dispensa: non genera risposte, non invia le domande a servizi esterni e non salva una cronologia. Se non trova un risultato, prova un argomento più breve. Richiede JavaScript e un browser moderno.

## Contenuti

- Regole di riferimento per corpo, riga e interlinea, anche in valori relativi e percentuali.
- Esempi Do e Don’t per allineamento, fondi scuri, maiuscole, maiuscoletto, cifre oldstyle e tabulari, tracking.
- Scala tipografica visuale per desktop e mobile.
- Nomi e ruoli degli stili; confronto Apple/iOS e Material/Android con esempi applicati.
- Gerarchia, leggibilità, criteri di accessibilità e laboratorio tipografico.
- Glossario e riferimenti alle fonti originali.

La palette riprende il corallo `#F17B68` utilizzato dal sito di Talent Garden, con fondi chiari e una tonalità più scura per i testi. I colori semantici dei Do e Don’t rimangono distinti.

## Modificare e rigenerare

Modifica [src/template.html](src/template.html), quindi esegui dalla cartella del repository:

```sh
python3 scripts/build.py
```

È sufficiente Python 3, senza pacchetti aggiuntivi. Lo script aggiorna entrambi gli HTML, incorporando i font e le licenze. Dopo una modifica, controlla la resa su desktop, mobile e nell’anteprima di stampa.

| File o cartella | Contenuto |
| --- | --- |
| `index.html` | Guida completa, pronta da aprire o ospitare su un sito statico. |
| `vademecum-tipografia-ui.html` | Copia identica con nome descrittivo, da condividere. |
| `src/template.html` | Sorgente HTML, CSS e JavaScript modificabile. |
| `src/search.js`, `src/search.css` | Ricerca e interfaccia, incorporate negli HTML durante la generazione. |
| `scripts/build.py` | Generazione dei documenti autonomi. |
| `assets/fonts/` | Figtree, Roboto e relative licenze. |

I passaggi con `data-search-title` e `data-search-tags` hanno un titolo e parole chiave per la ricerca; il testo viene letto direttamente dalla guida. Gli attributi `id` mantengono stabili i link. Anche nuovi sottotitoli e voci del glossario vengono indicizzati automaticamente.

Per verificare il riconoscimento delle domande, con Node.js installato:

```sh
node --test tests/search.test.cjs
```

## Font e fonti

Figtree e Roboto sono distribuiti con licenza **SIL Open Font License 1.1**; i testi delle licenze sono inclusi in `assets/fonts/` e negli HTML. Il campione Apple utilizza il font di sistema del dispositivo, quando disponibile, con fallback: non viene distribuito alcun font Apple.

Le fonti didattiche sono citate nella guida, tra cui [Pimp my Type](https://pimpmytype.com/), [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/typography), [Android Developers](https://developer.android.com/develop/ui/compose/designsystems/material3), MDN e W3C. I valori proposti sono riferimenti progettuali da verificare nel proprio contesto.
