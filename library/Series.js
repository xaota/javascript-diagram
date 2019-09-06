/** @section @imports */
import Color   from '../color.js';
import Vector  from '../../../../lib/algebra/vector.js';
import Analyse from '../../../../lib/analyse.js';
import Obj     from '../../../../lib/object.js';
import Num     from '../../../../lib/number.js';

/** @section @exports */
/** {Series} Серии данных для рисования графиков @class @export @default
*
*/
export default class Series {
/** Создание серии данных @constructor
  * @param {string} label название серии
  * @param {array} data данные для расчета серии
  * @param {number} base опорная точка серии
  */
  constructor(label, data = [], base = 1) {
    this.label = label;
    this.raw   = data;
    this.meta  = {};
    this.options = {};
    this.bind(base);
  }

/** Количество данных в серии / length @readonly
  * @return {number} размерность данных
  */
  get length() {
    return this.data.length;
  }

/** Максимум среди данных в серии / max @readonly
  * @return {number} максимум
  */
  get max() {
    return this.data.max;
  }

/** Минимум среди данных в серии / min @readonly
  * @return {number} минимум
  */
  get min() {
    return this.data.min;
  }

/** Копирование сериии / copy @chainable
  * @return {Series} копия серии
  */
  copy() {
    return Obj.deep(this);
  }

/** Рисование серии / draw @chainable
  * @param {Canvas} context контекст рисования
  * @param {object} meta мета-информация для рисования серии
  * @param {array} base [...{min, max}] значения границ в стеке
  * @return {Series} this
  */
  draw(context, meta, base) {
    Draw[this.type](this.data, context, Object.assign(this.meta, meta), this.options, {base: this.base, root: base});
    return this;
  }

/** Цвет серии / color @chainable */
  color(color) {
    this.meta.color = Color.css(color);
    return this;
  }

/** Установка опорной точки серии / bind @chainable */
  bind(base = 1) {
    this.base = base;
    return this;
  }

/** Установка типа данных серии / chart @chainable */
  chart(type, data = [], drop = false) {
    if (this.raw.length === 0 && data.length === 0) throw Error('нет данных');
    this.type = type;
    this.data = data.length === 0
      ? Analyse[type](this.raw)
      : data;
    if (drop === true) this.raw = [];
    Object.assign(this.meta, Meta[this.type](this.data));
    return this.params(false);
  }

/** Параметры отображения серии / params @chainable */
  params(options) {
    options === false
      ? this.options = {}
      : Object.assign(this.options, options);
    Object.assign(this.meta, Options[this.type](this.data, this.options));
    return this;
  }

/** Получение компонента данных серии / get */
  get(index = 0) {
    return Value[this.type](this, index);
  }

/** / percent */
  percent(values, index) {
    const data    = Percent[this.type](this.data, values, this.base, index);
    const options = this.options;
    return this.chart(this.type, data).params(options);
  }

/** / reverse */
  reverse() {
    const data    = Reverse[this.type](this.data, this.base);
    const options = this.options;
    this.meta.reverse = !this.meta.reverse;
    return this.chart(this.type, data).params(options);
  }

/** / labels */
  labels(format) {
    this.meta.labels = format;
    return this;
  }

/** / legend */
  legend(position) {
    this.meta.legend = position;
    return this;
  }

/** @subsection @static Создание серий данных */
/** Создание серии данных - гистограмма / столбчатый / histogram @static
  * @param {string} label название серии
  * @param {array} data данные серии
  * @param {number} base опорная точка серии
  * @return {Series} серия данных
  */
  static histogram(label, data, base = 1) {
    return new Series(label, data).chart('histogram').bind(base);
  }

/** Создание серии данных - диаграма рассеивания / "ящик с усами" / box @static
  * @param {string} label название серии
  * @param {array} data данные серии
  * @param {number} base опорная точка серии
  * @return {Series} серия данных
  */
  static box(label, data, base = 1) {
    return new Series(label).chart('box', data).bind(base);
  }
}

/** @section @private */
/** {Meta} Иниформация о серии @class */
class Meta {
/** / box @static */
  static box(data) {
    return {
      length: 1
    }
  }

/** / histogram @static */
  static histogram(data) {
    return {
      length: data.length
    }
  }
}

/** {Options} Параметры для рисования сериии @class */
class Options {
/** / box @static */
  static box(data, options = {}) {
    return {
      max: options.max === false ? data.whisker.max : options.whisker === false ? data.Q3 : data.max,
      min: options.min === false ? data.whisker.min : options.whisker === false ? data.Q1 : data.min
    }
  }

/** / histogram @static */
  static histogram(data, options = {}) {
    return {
      max: data.max,
      min: 0
    }
  }
}

/** {Draw} Рисование серий @class */
class Draw {
/** / box @static */
  static box(data, context, meta, options, base) {
    const fade   = 1;
    const stroke = meta.color.darken(0.15).css;
    const fill   = meta.color.lighten(0.20).fade(fade).css;
    const w      = meta.width / meta.stacks;
    const x      = w * meta.stack;
    const y      = meta.base;
    context.begin().style({stroke, fill, width: 1});
    for (let index = 0; index < meta.length; ++index) {
      const X = meta.width * index + x + w / 2;
      const Y = y;
      const zero = Vector.from(X, Y);
      const edge = Vector.from(w / 3, 0);
      const line = Vector.from(2 * w / 3, 0);

      context.MOVE(zero);
      context.move(Vector.from(-w / 6, data.min * meta.factor)).line(edge);
      context.MOVE(zero);
      context.move(Vector.from(-w / 6, data.max * meta.factor)).line(edge);
      context.MOVE(zero);
      context.move(Vector.from(0, data.whisker.min * meta.factor)).line(Vector.from(0, (data.Q1 - data.whisker.min) * meta.factor));
      context.MOVE(zero);
      context.move(Vector.from(0, data.Q3 * meta.factor)).line(Vector.from(0, (data.whisker.max - data.Q3) * meta.factor));
      context.MOVE(zero);
      context.move(Vector.from(-w / 3, data.Q1 * meta.factor)).rect(Vector.from(2 * w / 3, (data.Q3 - data.Q1) * meta.factor));
      context.MOVE(zero);
      context.move(Vector.from(-w / 3, data.median * meta.factor)).line(line);
    }
    context.fill().stroke().end();
  }

/** / histogram @static */
  static histogram(data, context, meta, options, {root, base}) {
    const fade   = 1 - meta.group * 0.1; // TODO: 0.2 magic number -> base on meta.groups value
    const stroke = meta.color.darken(0.15).css;
    const fill   = meta.color.lighten(0.20).fade(fade).css;
    const thin   = fade; // TODO:
    const w      = meta.width / meta.stacks;
    const x      = w * meta.stack;
    const y      = meta.base;
    context.begin().style({stroke, fill, width: 1});
    data.values.forEach((positive, index) => {
      const W = w * thin;
      const X = meta.width * index + x + (w - W) / 2;
      const Y = y;
      const zero = Vector.from(X, Y);
      let start = positive >= meta.base ? root[index].max : root[index].min;
      const value = positive / base;
      const negative = value - positive;
      start -= negative;
      context.MOVE(zero).move(Vector.from(0, start * meta.factor)).rect(Vector.from(W, value * meta.factor));
      if (value >= meta.base) {
        root[index].max += positive;
        root[index].min += negative;
      } else {
        root[index].max += negative;
        root[index].min += positive;
      }
    });
    context.fill().stroke().end();
    context.begin();
    const size = meta.text.size;
    data.values.forEach((value, index) => {
      const W = w * thin;
      const X = meta.width * index + x + (w - W) / 2;
      const Y = y;
      const zero = Vector.from(X, Y);
      const origin = data.origin !== undefined ? Num.trunc(meta.reverse ? -data.origin[index] : data.origin[index], 2) : undefined;
      const showed = Num.trunc((meta.reverse ? -value : value) / (origin !== undefined ? base : 1), 1); // base
      const start  = value >= meta.base ? root[index].max : root[index].min;
      const sign = Math.sign(value) === 1;
      const position = {
        value  : sign ? 11 : -5,
        // value: -5, // index === 1 ? 11 : -5,
        percent: 4 //sign ? 14 : -14
      }
      const height = start * meta.factor - position.value - sign * 4;
      if (value < 0 && index === 4) console.log([value, 'h: ' + height, value * meta.factor,'root: '+root[index].max, root[index].min].join('\n'));
      // if (!sign) console.log(showed, origin, start, height)
      // if (!sign && Math.abs(height - (sign ? 0 : 14)) < Math.abs(start * meta.factor)) {
      //   console.log(showed);
      // }
      context.save().MOVE(zero).move(Vector.from(4, height)).flipY()
        .style({align: 'left', fill: meta.text.color});
        // .fillText(showed > 2 ? showed + (origin !== undefined ? '%' : '') : '');

        if (showed > 2) {
          showed === 100
            ? context.fillText(origin.toString())
            : context.fillText(showed + '%');
        }

        if (origin !== undefined) {
          context
            .move(Vector.from(W - position.percent - 4, 0))
            .style({align: 'right', fill: '#666'})
            // .fillText(origin);
        }
      context.restore();
    })
    context.end();
  }
}

/** {Value} получение значений @class */
class Value {
/** / box @static */
  static box(series, index) {
    return series.meta.max;
  }

/** / histogram @static */
  static histogram(series, index) {
    return series.data.values[index];
  }
}

/** {Percent} преобразование к процентным значениям @class */
class Percent {
/** / box @static */
  static box(origin, values, base, index) {
    const max = Math.max(...values.map(e => e.max));
    console.log('percentage box', origin, max, values[index].max, base);
    return origin;
  }

/** / histogram @static */
  static histogram(origin, values, base, index) {
    const data  = {length: origin.length, origin: origin.values};
    data.values = origin.values.map((e, index) => e / values[index].max * 100 * base);
    data.max = Math.max(...data.values);
    data.min = Math.min(...data.values);
    return data;
  }
}

/** {Reverse} Разворот данных @class */
class Reverse {
/** / box @static */
  static box(origin, base) {
    // console.log('percentage box', origin, values);
    return origin;
  }

/** / histogram @static */
  static histogram(origin, base) {
    const data  = {length: origin.length};
    data.values = origin.values.map((e, index) => -e);
    data.max = Math.max(...data.values);
    data.min = Math.min(...data.values);
    return data;
  }
}
