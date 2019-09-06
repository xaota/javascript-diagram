/** @section imports */
import Series from './series.js';
import Canvas from '../canvas.js';
import Color  from '../color.js';
import Vector from '../../../../lib/algebra/vector.js';
import Str    from '../../../../lib/string.js';
import Arr    from '../../../../lib/array.js';

/** {Diagram} Рисование диаграмм и графиков @class @export @default */
export default class Diagram {
/** @constructor
  * @param {HTMLCanvasElement} canvas холст для рисования
  */
  constructor(canvas) {
    this.context = new Canvas(canvas);
    this.options = {};
    this.data    = {};
    this.meta    = {legend: {}};
    this.base();
  }

/** @subsection Настройки */
/** Параметры графика / params
  * @param {object} options настройки
  * @return {Diagram} this
  */
  params(options = {}) {
    Object.assign(this.options, options);
    return this;
  }

/** / base */
  base(base = 0) {
    this.meta.base = base;
    return this;
  }

/** Установка размеров холста / size
  * @param {Vector} size желаемый размер
  * @return {Diagram} this
  */
  size(size = Vector.from(Client.width * 1.5, Client.height)) {
    this.meta.size = size;
    this.context.port(this.meta.size);
    return this;
  }

/** / draw */
  draw() {
    if (!this.meta.layout) this.axis();
    if (!this.markup) this.groups();
    this.layout();
    this.context.begin().reset().CLEAR();
    this.context.style({font: this.meta.text.font});
    this.meta.layout.zero(this.context).translate(Vector.from(0, -this.meta.factor * this.meta.min));
    this.context.end();
    this.markup.forEach((group, index) => group.draw(this.context, this.data, {group: index, groups: this.markup.length}, this.meta));
    this.context.begin().style({stroke: Color.gray.fade(-0.3).css, width: 1}).MOVE(Vector.zero).line(Vector.from(this.meta.layout.right, 0)).stroke().end(); // axis
    const size = this.meta.text.size || 10;
    if (this.meta.layout.axis) {
      this.context.style({fill: this.meta.text.color, align: 'right'}).reset();
      this.meta.layout.zero(this.context).flipY();
      const w = this.meta.layout.width / this.meta.layout.axis.x.length;
      this.meta.layout.axis.x.forEach((item, index) => {
        this.context.MOVE(Vector.zero).move(Vector.from(index * w + w - 5, -size + 6)).fillText(item);
      });
    }
    if (this.meta.legend.title) {
      this.context.style({fill: this.meta.text.color, align: 'right'}).reset();
      this.meta.layout.zero(this.context).flipY();
      this.context.save().MOVE(Vector.zero).move(Vector.from(this.meta.layout.width / 10 * 5.5, 29)).zoom(1.3).fillText(this.meta.legend.title).restore();
    }
    if (this.meta.legend.description) {
      this.context.style({align: 'left'}).reset();
      this.meta.layout.zero(this.context).flipY();
      const base = 20;
      Object.keys(this.meta.legend.description).forEach((key, index) => {
        const X = this.meta.layout.width / 10;
        const Y = base + 22 * index;
        const stroke = this.data[key].meta.color.darken(0.15).css;
        const fill   = this.data[key].meta.color.lighten(0.20).css;
        this.context.MOVE(Vector.zero)
          .move(Vector.from(X, Y - 13))
          .begin()
            .style({fill, stroke})
            .rect(Vector.from(18, 18))
            .fill().stroke()
          .end()
          .begin().style({fill: this.meta.text.color})
            .MOVE(Vector.from(X + 26, Y))
            .fillText(this.meta.legend.description[key])
          .end()
      });
    }
    this.context.reset().begin().style({width: 2, stroke: '#D55A8C'});
    this.meta.layout.zero(this.context);
    const indexOKAS = this.meta.layout.axis.x.indexOf("21.06");
    const W = this.meta.layout.width / this.meta.layout.axis.x.length;
    const OKAS = indexOKAS * W; // this.meta.layout.width / 2;
    this.context.move(Vector.zero).move(Vector.from(OKAS, -70)).line(Vector.from(0, this.meta.layout.top)).stroke().end();
    return this;
  }

/** / font */
  font(size, color) {
    const font = "normal " + size + "px Tahoma";
    this.meta.text = {font, color, size};
    return this;
  }

/** / axis */
  axis(options = {type: 'decart', padding: 2, margin: 10}) { // decart / polar
    this.meta.layout = Layout[options.type](this.meta.size, options.margin, options.padding, this.meta.legend);
    return this.meta.layout;
  }

/** / groups */
  groups(...markup) {
    if (markup.length === 0) markup = Object.keys(this.data);
    this.markup = markup.map(group => new Group(group, this.data, this.meta.base));
    return this;
  }

/** / layout */
  layout() {
    const max    = Math.max(...this.markup.map(group => group.meta.max));
    const min    = Math.min(...this.markup.map(group => group.meta.min));
    const range  = max - min;
    const base   = this.meta.base;
    const domain = (max > base && min < base) ? range : Math.max(Math.abs(max - base), Math.abs(min - base));
    const factor = this.meta.layout.height / domain;
    const meta   = {max, min, range, domain, factor};
    Object.assign(this.meta, meta);
    return this;
  }

/** / percent */
  percent({group, stack} = {group: 0, stack: 0}, target = undefined) {
    if (!this.markup) this.groups();
    group = this.markup[group];
    stack = group.stacks[stack];
    const values = stack.percent();
    this.markup.forEach(group => group.percent(values, this.data, target));
    return this;
  }

/** / series */
  series(series) {
    const label      = series.label;
    this.data[label] = series.copy();
    return this.data[label];
  }

/** / title */
  title(title) {
    this.meta.legend.title = title;
    return this;
  }

/** / legend */
  legend(position, layout, description) {
    this.meta.legend.position    = position;
    this.meta.legend.layout      = layout;
    this.meta.legend.description = description;
    return this;
  }

/** Доступ к классу создания серий @static {Series} @class
  * @return {Series} @class
  */
  static get Series() {
    return Series;
  }
}

/** @section @private */
/** {Layout} @class */
class Layout {
/** constructor */
  constructor(zero, bounds, legend) {
    Object.assign(this, bounds);
    this.zero = zero;
    this.corner();
    this.meta = legend;
  }

/** / corner @chainable */
  corner() {
    this.BL = Vector.from(this.left,  this.bottom);
    this.BR = Vector.from(this.right, this.bottom);
    this.TL = Vector.from(this.left,  this.top);
    this.TR = Vector.from(this.right, this.top);
    return this;
  }

/** / labels @chainable */
  labels(axis) {
    // {x: series.date, y: 'auto'}
    this.axis = axis;
    return this;
  }

/** / legend @chainable */
  legend(axis) {
    // {x: 'bottom outline', y: 'left outline'}
    const line = 18;
    const height = 1 + Object.keys(this.meta.description).length;
    const lines = line * height;
    this.bottom += lines;
    this.height -= lines;
    this.zero = context => context.NOOK().TO(Vector.from(this.margin, this.margin + lines));
    return this.corner();
  }

/** / levels @chainable */
  levels(axis) { // TODO:
    // {x: false, y: true}
    return this;
  }

/** width @deprecated */
  static width(domain, padding, count, index = 0) {
    return (domain - padding * (count - 1)) / count - index * padding;
  }

/** decart */
  static decart(size, margin = 10, padding = 2, legend) {
    const zero   = context => context.NOOK().TO(Vector.from(margin, margin));
    const left   = 0;
    const right  = size.x - 2 * margin;
    const top    = size.y - 2 * margin;
    const bottom = 0;

    const width  = right - left;
    const height = top - bottom;

    const domain = width;

    return new Layout(zero, {left, top, right, bottom, width, height, margin, padding, domain}, legend);
  }
}

/** {Group} @class */
class Group {
/** @constructor */
  constructor(markup, data, base) {
    if (Str.is(markup)) markup = [markup];
    this.base   = base;
    this.stacks = markup.map(stack => new Stack(stack, data, this.base));
    this.meta   = Group.meta(this.stacks, this.base);
  }

/** / draw */
  draw(context, data, {group, groups}, meta) {
    const stacks = this.meta.count;
    this.stacks.forEach((stack, index) => {
      stack.draw(context, data, {group, stack: index, groups, stacks}, Object.assign(meta, {width: meta.layout.width}));
    });
    return this;
  }

/** / percent */
  percent(values, data, target = undefined) {
    this.stacks.forEach((stack, index) => stack.percent(values, data, index));
    this.meta = Group.meta(this.stacks, this.base);
    return this;
  }

/** / meta */
  static meta(stacks, base) {
    return {
      // length,
      count: stacks.length,
      max: Math.max(...stacks.map(stack => stack.meta.max)),
      min: Math.min(...stacks.map(stack => stack.meta.min)) //,
      // values
    }
  }

/** / bricks */
  static bricks(group, data) {
    const bricks = {};
    group.forEach(stack => stack.forEach(elem => bricks[elem] = data[elem]));
    return bricks;
  }
}

/** {Stack} @class */
class Stack {
/** @constructor */
  constructor(markup, data, base) {
    if (Str.is(markup)) markup = [markup];
    this.base = base;
    this.series = Arr.flatten(markup); // Object.keys(data).filter(label => items.includes(label));
    this.meta = Stack.meta(this.series, data, this.base);
  }

/** / get */
  get(index) {
    return this.meta.values[index];
  }

/** / draw */
  draw(context, data, {group, stack, groups, stacks}, meta) {
    const base = Arr.fill(data[this.series[0]].meta.length, _ => ({max: meta.base, min: meta.base}));
    this.series.forEach((label, index) => {
      const series = data[label];
      const info = {
        group,
        stack,
        groups,
        stacks,
        label: index,
        series: this.series.length,
        width: meta.width / series.meta.length
      };
      series.draw(context.MOVE(Vector.zero), Object.assign({}, meta, info), base);
    });
    return this;
  }

/** / percent @chainable? */
  percent(values, data, index) {
    if (values === undefined) return this.meta.values;
    this.series.forEach(series => data[series].percent(values, index));
    this.meta = Stack.meta(this.series, data, this.base);
    return this;
  }

/** / bricks @static */
  static bricks(stack, data, base) {
    const bricks = {};
    stack.forEach(elem => bricks[elem] = data[elem]);
    return bricks;
  }

/** / get @static */
  static get(stack, data, base) {
    const bricks = Group.bricks(stack, data);
    const meta   = Group.meta(stack, bricks, base);
    return new Stack(stack, bricks, meta);
  }

/** / meta @static */
  static meta(bricks, data, base) {
    const length = Math.max(...bricks.map(label => data[label].meta.length)); // const
    const meta = Array.from({length}, _ => ({max: base, min: base}));
    for (let index = 0; index < length; ++index) {
      bricks.forEach(label => {
        const series   = data[label];
        const positive = series.get(index);
        const value    = positive / series.base;
        const negative = base - (value - positive);
        // todo?
        // if (positive > meta[index].max) meta[index].max += positive;
        // if (negative < meta[index].min) meta[index].min += negative;
        meta[index].max += positive;
        meta[index].min += negative;
      })
    }
    return {
      max: Math.max(...meta.map(e => e.max)),
      min: Math.min(...meta.map(e => e.min)),
      length,
      count: bricks.length,
      values: meta
    }
  }
}

/** {Client} Информация о клиенте @class */
class Client {
/** Текущая ширина видимой области браузера @readonly @static
  * @return {number} ширина окна
  */
  static get width() {
    const root = document.documentElement || document.body;
    return window.innerWidth
      ? window.innerWidth
      : root && root.clientWidth
        ? root.clientWidth
        : 0;
  }

/** Текущая высота видимой области браузера @readonly @static
  * @return {number} высота окна
  */
  static get height() {
    const root = document.documentElement || document.body;
    return window.innerHeight
      ? window.innerHeight
      : root && root.clientHeight
        ? root.clientHeight
        : 0;
  }
}
