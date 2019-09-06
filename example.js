
import Diagram from '../js/lib/diagram/diagram.js';
import Obj     from '../../lib/object.js';
import api     from './api.js';
import Moment  from "../../lib/moment.js";
import Analyse from '../../lib/analyse.js';
// import Vector  from '../../lib/algebra/vector.js';

const canvas  = $('#canvas');
const diagram = new Diagram(canvas).size().font(11, "#333"); // Vector.from(500, 1050)
const color = {
  clients  : "#DEF2F0",
  messages : "#4ea5cd",
  coverage : "#826CAA",

  like     : '#88BD1F',
  autoclose: '#DEE240',
  redirect : '#FAAB62',
  dislike  : '#ff7744',

  assignment: '#6CCCC7'
};

  api('statistic.get', {data: ['assistant', 'sla']}) // 'assistant', 'sla' , 'days'
    .then(generateData)
    .then(generateSeries)
    // .then(drawPlotTasks);
    // .then(drawPlotPrecision);
    // .then(drawPlotMistakes);
    .then(drawPlotMessages);
    // .then(drawPlotMessagesPercent);
    // .then(drawPlotCoverageRate);
    // .then(drawPlotCoverageDislike);
    // .then(drawPlotCoverageLike);
    // .then(drawPlotCompanies);
    // .then(drawPlotCompaniesWeek); //
    // .then(drawPlotSLA); //

/** drawPlotSLA */
  function drawPlotSLA(series) {
    const type = 'all';
    const box  = '#419DDD';
    // console.log(series[type]);
    // diagram.series(series.messages).color(color.clients)
    Object.values(series[type]).forEach(week => diagram.series(week).color(box).params({max: false}));
    // diagram.series(series.positive).color(color.like);
    diagram
      .title('Распределение ответов Эм от охвата (в процентах)')
      .legend('bottom', 'vertical', {
        // messages : "диалогов от клиентов без вложений в первом сообщении (потолок охвата Эм)",
        // positive : "лайки, полученные Эм"
      })
      .axis({type: 'decart', padding: 0, margin: 10})
        .labels({x: series.date, y: 'auto'})
        .legend({x: 'bottom outline', y: 'left outline'})
        .levels({x: false, y: true});
    diagram
      .groups(Object.values(series[type]).map(week => week.label)) // 'messages', 'positive',
      // .percent({group: 0, stack: 0})
      .draw();
  }

/** drawPlotCompaniesWeek */
  function drawPlotCompaniesWeek(series) {
    const color   = '#419DDD';
    Object.values(series.week).forEach(day => diagram.series(day).color(color));
    diagram
      .groups(Object.values(series.week).map(day => day.label))
      .draw();
  }

/** drawPlotCompanies */
  function drawPlotCompanies(series) {
    const canvas  = $('#canvas');
    const diagram = new Diagram(canvas)
      .size()
      .params({padding: 10})
      // .
      // .axis('decart', 10, 2);

    const colors = {
      process  : '#DEF2F0',
      companies: '#419DDD'
    };

    // diagram.series(series.clients)  .color(colors.process)  .chart('histogram');
    // diagram.series(series.companies).color(colors.companies).chart('histogram');

    diagram
      .groups('clients', 'companies')
      .percent({group: 0, stack: 0})
      .layout()
      .draw();
  }

/** drawPlotMessages */
  function drawPlotMessages(series) {
    // diagram.series(series.messages) .color(color.clients).bind(0.5);
    diagram.series(series.clients)  .color(color.clients).bind(0.5);
    diagram.series(series.like)     .color(color.like);
    diagram.series(series.autoclose).color(color.autoclose);
    diagram.series(series.assignment).color(color.assignment);
    diagram.series(series.dislike)  .color(color.dislike).reverse();
    diagram.series(series.redirect) .color(color.redirect).reverse();
    diagram
      .title('Распределение ответов Эм от охвата (в процентах)')
      .legend('bottom', 'vertical', {
        // messages : "диалогов от клиентов без вложений в первом сообщении (потолок охвата Эм)",
        clients : "диалогов от клиентов (потолок охвата Эм)",
        like     : "лайки, полученные Эм",
        autoclose: "диалоги без реакции клиента (+ автозакрытие через 72ч после ответа Эм)",
        assignment: "диалоги с переводами на ассистентов по итогам поручений",
        redirect : "диалоги, переведенные на ассистентов (Эм не может продолжить диалог)",
        dislike  : "дизлайки, полученные Эм"
      })
      .axis({type: 'decart', padding: 0, margin: 10})
        .labels({x: series.date, y: 'auto'})
        .legend({x: 'bottom outline', y: 'left outline'})
        .levels({x: false, y: true});
    diagram
      .groups('clients', [['like', 'autoclose', 'assignment', 'dislike', 'redirect']])
      .percent({group: 0, stack: 0})
      .draw();
  }

/** drawPlotMessagesPercent */
  function drawPlotMessagesPercent(series) {
    diagram.series(series.like)        .color(color.like);
    diagram.series(series.autoclose)   .color(color.autoclose);
    diagram.series(series.assignment).color(color.assignment);
    diagram.series(series.dislike)     .color(color.dislike);
    diagram.series(series.redirect)    .color(color.redirect);
    diagram
      .title('Распределение ответов Эм в охвате (в процентах)')
      .legend('bottom', 'vertical', {
        like     : "лайки, полученные Эм",
        autoclose: "диалоги без реакции клиента (+ автозакрытие через 72ч после ответа Эм)",
        assignment: "диалоги с переводами на ассистентов по итогам поручений",
        redirect : "диалоги, переведенные на ассистентов (Эм не может продолжить диалог)",
        dislike  : "дизлайки, полученные Эм"
      })
      .axis({type: 'decart', padding: 0, margin: 10})
        .labels({x: series.date, y: 'auto'})
        .legend({x: 'bottom outline', y: 'left outline'})
        .levels({x: false, y: true});
    diagram
      .groups([['dislike', 'redirect', 'assignment', 'autoclose', 'like'].reverse()])
      .percent({group: 0, stack: 0})
      .draw();
  }

/** drawPlotPrecision */
  function drawPlotPrecision(series) {
    // diagram.series(series.clients) .color(color.clients) .labels('origin percent').legend('top inline');
    diagram.series(series.evaluated).color(color.clients).labels('origin percent').legend('top inline');
    diagram.series(series.precision).color(color.like)   .labels('origin percent').legend('top outline');
    diagram
      .title('Потолок и охват Эм в диалогах')
      .legend('bottom', 'vertical', {
        // clients : "диалогов от клиентов всего",
        evaluated: "оцененные ответы Эм",
        precision: "точность ответов Эм (лайки)"
      })
      .axis({type: 'decart', padding: 0, margin: 10})
        .labels({x: series.date, y: 'auto'})
        .legend({x: 'bottom outline', y: 'left outline'})
        .levels({x: false, y: true});
    diagram
      .groups('evaluated', 'precision')
      .percent({group: 0, stack: 0}, 1)
      .draw();
  }

/** drawPlotMistakes */
  function drawPlotMistakes(series) {
    // diagram.series(series.clients) .color(color.clients) .labels('origin percent').legend('top inline');
    diagram.series(series.evaluated).color(color.clients).labels('origin percent').legend('top inline');
    diagram.series(series.mistakes).color(color.dislike) .labels('origin percent').legend('top outline');
    diagram
      .title('Потолок и охват Эм в диалогах')
      .legend('bottom', 'vertical', {
        // clients : "диалогов от клиентов всего",
        evaluated: "оцененные ответы Эм",
        mistakes: "ошибки в ответах Эм (дизлайки)"
      })
      .axis({type: 'decart', padding: 0, margin: 10})
        .labels({x: series.date, y: 'auto'})
        .legend({x: 'bottom outline', y: 'left outline'})
        .levels({x: false, y: true});
    diagram
      .groups('evaluated', 'mistakes')
      .percent({group: 0, stack: 0}, 1)
      .draw();
  }

/** drawPlotTasks */
  function drawPlotTasks(series) {
    diagram.series(series.clients) .color(color.clients) .labels('origin percent').legend('top inline');
    diagram.series(series.messages).color(color.messages) .labels('origin percent').legend('top inline');
    diagram.series(series.coverage).color(color.coverage).labels('origin percent').legend('top outline');
    diagram
      .title('Потолок и охват Эм в диалогах')
      .legend('bottom', 'vertical', {
        clients : "диалогов от клиентов всего",
        messages: "диалогов от клиентов без вложений в первом сообщении (потолок охвата Эм)",
        coverage: "охват Эм"
      })
      .axis({type: 'decart', padding: 0, margin: 10})
        .labels({x: series.date, y: 'auto'})
        .legend({x: 'bottom outline', y: 'left outline'})
        .levels({x: false, y: true});
    diagram
      .groups('clients', 'messages', 'coverage') // 'clients',
      .percent({group: 0, stack: 0})
      .draw();
  }

/** drawPlotCoverageRate */
  function drawPlotCoverageRate(series) {
    // diagram.series(series.clients) .color(color.clients) .labels('origin percent').legend('top inline');
    // diagram.series(series.messages).color(color.clients) .labels('origin percent').legend('top inline');
    diagram.series(series.coverage).color(color.clients).labels('origin percent').legend('top outline');
    diagram.series(series.like)    .color(color.like);
    diagram.series(series.dislike) .color(color.dislike);
    diagram
      .title('Оценки Эм от охвата')
      .legend('bottom', 'vertical', {
        coverage: "охват Эм",
        like    : "лайки, полученные Эм",
        dislike : "дизлайки, полученные Эм"
      })
      .axis({type: 'decart', padding: 0, margin: 10})
        .labels({x: series.date, y: 'auto'})
        .legend({x: 'bottom outline', y: 'left outline'})
        .levels({x: false, y: true});
    diagram
      .groups('coverage', ['like', 'dislike']) // 'clients',
      .percent({group: 0, stack: 0})
      .draw();
  }

/** drawPlotCoverageDislike */
  function drawPlotCoverageDislike(series) {
    // diagram.series(series.clients) .color(color.clients) .labels('origin percent').legend('top inline');
    diagram.series(series.messages).color(color.clients) .labels('origin percent').legend('top inline');
    diagram.series(series.coverage).color(color.coverage).labels('origin percent').legend('top outline');
    diagram.series(series.dislike)  .color(color.dislike);
    diagram.series(series.redirect) .color(color.redirect);
    diagram
      .title('Негатив в охвате от сообщений клиентов')
      .legend('bottom', 'vertical', {
        messages: 'сообщения от клиентов',
        coverage: "охват Эм",
        redirect : "диалоги, переведенные на ассистентов (Эм не может продолжить диалог)",
        dislike : "дизлайки, полученные Эм"
      })
      .axis({type: 'decart', padding: 0, margin: 10})
        .labels({x: series.date, y: 'auto'})
        .legend({x: 'bottom outline', y: 'left outline'})
        .levels({x: false, y: true});
    diagram
      .groups('messages', ['coverage'], [['dislike', 'redirect']]) // 'clients',
      // .percent({group: 0, stack: 0})
      .draw();
  }

/** drawPlotCoverageLike */
  function drawPlotCoverageLike(series) {
    // diagram.series(series.clients) .color(color.clients) .labels('origin percent').legend('top inline');
    diagram.series(series.messages).color(color.clients) .labels('origin percent').legend('top inline');
    diagram.series(series.coverage).color(color.coverage).labels('origin percent').legend('top outline');
    diagram.series(series.like)      .color(color.like);
    diagram.series(series.autoclose) .color(color.autoclose);
    diagram
      .title('Позитив в охвате от сообщений клиентов')
      .legend('bottom', 'vertical', {
        messages: 'сообщения от клиентов',
        coverage: "охват Эм",
        autoclose: "диалоги без реакции клиента (+ автозакрытие через 72ч после ответа Эм)",
        like    : "лайки, полученные Эм"
      })
      .axis({type: 'decart', padding: 0, margin: 10})
        .labels({x: series.date, y: 'auto'})
        .legend({x: 'bottom outline', y: 'left outline'})
        .levels({x: false, y: true});
    diagram
      .groups('messages', ['coverage'], [['like', 'autoclose']]) // 'clients',
      // .percent({group: 0, stack: 0})
      .draw();
  }

/** generateSeries */
  function generateSeries(data) {
    const week = []
      .concat(...data.map(e => e.companies).map(e => Object.entries(e)))
      .reduce((week, [date, count]) => addCount(date, count, week), {});

    Moment.week().forEach((day, index) => {
      if (!Obj.into(day, week)) return;
      const label = 'companies.' + Moment.dayOfWeek(index, 'english');
      const value = Analyse.box(week[day], 0); // Arr.uniq(week[day]).sort((a, b) => a - b));
      week[day]   = Diagram.Series.box(label, value);
    });
    return {
      sla : data.map(chunk => Diagram.Series.box(chunk.date, chunk.sla)),
      all : data.map(chunk => Diagram.Series.box(chunk.date, chunk.all)),
      date: data.map(chunk => chunk.date),
      week,

      clients  : Diagram.Series.histogram('clients',  data.map(chunk => chunk.clients)),
      messages : Diagram.Series.histogram('messages', data.map(chunk => chunk.messages)),

      coverage : Diagram.Series.histogram('coverage', data.map(chunk => chunk.positive + chunk.negative)),

      evaluated: Diagram.Series.histogram('evaluated', data.map(chunk => chunk.evaluated)),
      precision: Diagram.Series.histogram('precision', data.map(chunk => chunk.precision)),
      mistakes : Diagram.Series.histogram('mistakes', data.map(chunk => chunk.mistakes)),

      assignment: Diagram.Series.histogram('assignment', data.map(chunk => chunk.assignment)),

      positive : Diagram.Series.histogram('positive',  data.map(chunk => chunk.positive)),
      negative : Diagram.Series.histogram('negative',  data.map(chunk => chunk.negative)),

      like     : Diagram.Series.histogram('like',      data.map(chunk => chunk.like)),
      autoclose: Diagram.Series.histogram('autoclose', data.map(chunk => chunk.autoclose)),
      redirect : Diagram.Series.histogram('redirect',  data.map(chunk => chunk.redirect)),
      dislike  : Diagram.Series.histogram('dislike',   data.map(chunk => chunk.dislike))

      // companies: new Series('companies', data.map(chunk => Object.values(chunk.companies).reduce((value, e) => value + e, 0)))
    };

    /** addCount */
      function addCount(date, count, week) {
        const key = Moment.dayOfWeek(new Date(date).getDay());
        if (!Obj.into(key, week)) week[key] = [];
        week[key].push(count);
        return week;
      }
  }

/** generateData */
  function generateData(result) {
    const assistant = result.assistant || result.days;
    const sla = result.sla || [];
    // console.log(sla);
    const data = [];
    assistant.forEach((item, index) => {
      const slaItem = sla.filter(e => e.from === item.meta.from && e.to === item.meta.to)[0];
      const SLA = slaItem ? slaItem.week : {sla: {}, all: {}};

      // console.log(item.meta.from)
      if (!result.assistant && item.meta.from === '2018-06-27') {
        item.info.like -= 191;
        item.info.clients -= 191;
        item.info.messages -= 191;
      }
      if (!result.assistant && item.meta.from === '2018-06-28') {
        item.info.like -= 2;
        item.info.clients -= 2;
        item.info.messages -= 2;
      }
      if (result.assistant && item.meta.from === '2018-06-22') {
        item.info.like -= 191 + 2;
        item.info.clients -= 191 + 2;
        item.info.messages -= 191 + 2;
      }

      item.meta.from = new Date(item.meta.from);
      item.meta.to   = new Date(item.meta.to);

      item.info.assignment = item.info.assignment || 0;

      const chunk = {
        date:      Moment.date(new Date(item.meta[result.assistant ? 'to' : 'from'])).substr(5).split('-').reverse().join('.'),
        // companies: item.meta.companies,
        positive:  item.info.like    + item.info.autoclose + item.info.assignment,
        negative:  item.info.dislike + item.info.redirect,
        sla: SLA.sla,
        all: SLA.all
      };

      chunk.evaluated = item.info.like + item.info.dislike;
      chunk.precision = chunk.evaluated * (item.info.like / chunk.evaluated);
      chunk.mistakes  = chunk.evaluated * (item.info.dislike / chunk.evaluated);
      chunk.assignment = item.info.assignment;

      chunk.sla.whisker = {min: chunk.sla.Q1 - (chunk.sla.Q1 - chunk.sla.P05), max: chunk.sla.Q3 + (chunk.sla.P95 - chunk.sla.Q3)}
      chunk.all.whisker = {min: chunk.all.Q1 - (chunk.all.Q1 - chunk.all.P05), max: chunk.all.Q3 + (chunk.all.P95 - chunk.all.Q3)}

      Object.assign(chunk, item.info, {companies: item.companies});
      data.push(chunk);
    });
    return data // .slice(15); // 19 // .slice(21);
    // return data.slice(8).filter((e, i) => i !== 2 && i !== 3)
  }

/** $ */
  function $(e) {
    return typeof e === 'object' ? e : document.querySelector(e);
  }

/** @private colors */
  // error       : '#F9D0C4',
  // second      : '#F2FBFF',
  // primaryDark : '#1976D2',
  // primary     : '#2196F3',
  // primaryLight: '#BBDEFB',
  // success     : '#C2E0C6',
  // process     : '#DEF2F0',
  // accent      : '#03A9F4',
  // telegram    : '#3287D2',
  // instagram   : '#125688',
  // notify      : '#4080B4', // #4ea5cd; // #3b8eb5

  // like     : '#88BD1F', // '#61b832', // '#DFF2BF', // #4F8A10 // #55a12c
  // autoclose: '#DEE240', // '#D4D646', // '#DFF2BF', // '#C2E0C6',
  // redirect : '#FAAB62', // '#ffCC80', // '#df8b00', // '#FFCCBA', // #eaaf51 // #df8b00
  // dislike  : '#ff7744' //  '#dc3d21'  // '#FFBABA' // #D8000C // tomato
  // // ['#419DDD', '#94BA41', '#D4D646', '#6CCCC7', '#826CAA', '#D55A8C']; // корпоративные цвета
