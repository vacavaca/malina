import { warn } from 'malina';
import OrderedMap from '../ordered-map';

export default class Updater {
  constructor(injector) {
    this.injector = injector;
    this.mainStyles = new OrderedMap();
    this.mediaStyles = new OrderedMap();
    this.skippedMainStyles = new Map();
    this.skippedMediaStyles = new Map();
  }

  // update(styles) {
  //   if (!this.injector.useMediaStyles)
  //     this.updateMainStyles(styles)
  //   else {
  //     const mainStyles = []
  //     const mediaStyles = []
  //     for (const style of styles) {
  //       if (style.isMedia()) mediaStyles.push(style)
  //       else mainStyles.push(style)
  //     }

  //     this.updateMainStyles(mainStyles)
  //     this.updateMediaStyles(mediaStyles)
  //   }
  // }

  add(styles) {
    for (const style of styles) {
      if (!this.injector.useMediaStyles || !style.isMedia()) this.addMainStyle(style);
      else this.addMediaStyle(style);
    }
  }

  update(styles) {
    for (const style of styles) {
      if (!this.injector.useMediaStyles || !style.isMedia()) this.updateMainStyle(style);
      else this.updateMediaStyle(style);
    }
  }

  delete(ids) {
    for (const id of ids) {
      if (this.mainStyles.has(id)) this.deleteMainStyle(id);
      else if (this.skippedMainStyles.has(id)) this.skippedMainStyles.delete(id);
      else if (this.mediaStyles.has(id)) this.deleteMediaStyle(id);
      else if (this.skippedMediaStyles.has(id)) this.skippedMediaStyles.delete(id);
    }
  }

  // /** @private */
  // updateMainStyles(styles) {
  //   const usedSelectors = {}
  //   const updatedStyles = {}

  //   for (const style of styles) {
  //     let added = !this.mainStyles.has(style.id)
  //     const skipped = this.skippedMainStyles.has(style.id)
  //     if (added && skipped)
  //       added = this.skippedMainStyles.get(style.id).rules !== style.rules

  //     if (added) this.addMainStyle(style)
  //     else updatedStyles[style.id] = style
  //     usedSelectors[style.id] = true
  //   }

  //   let i = 0
  //   for (const id of this.mainStyles.keys()) {
  //     if (id in usedSelectors) {
  //       if (id in updatedStyles) {
  //         const style = updatedStyles[id]
  //         this.updateMainStyle(style, i)
  //       }
  //     } else {
  //       this.deleteMainStyle(id, i)
  //       i -= 1
  //     }

  //     i += 1
  //   }
  // }

  // /** @private */
  // updateMediaStyles(styles) {
  //   const usedSelectors = {}
  //   const updatedStyles = {}

  //   for (const style of styles) {
  //     let added = !this.mediaStyles.has(style.id)
  //     const skipped = this.skippedMediaStyles.has(style.id)
  //     if (added && skipped)
  //       added = this.skippedMediaStyles.get(style.id).rules !== style.rules

  //     if (added) this.addMediaStyle(style)
  //     else updatedStyles[style.id] = style
  //     usedSelectors[style.id] = true
  //   }

  //   let i = 0
  //   for (const id of this.mediaStyles.keys()) {
  //     if (id in usedSelectors) {
  //       if (id in updatedStyles) {
  //         const style = updatedStyles[id]
  //         this.updateMediaStyle(style, i)
  //       }
  //     } else {
  //       this.deleteMediaStyle(id, i)
  //       i -= 1
  //     }

  //     i += 1
  //   }
  // }

  /** @private */
  addMainStyle(style) {
    if (this.mainStyles.has(style.id) || this.skippedMainStyles.has(style.id))
      return;

    const index = this.mainStyles.insertPoint(style.id);

    const inserted = this.injector.insertMainStyle(style, index);
    if (inserted) {
      this.mainStyles.set(style.id, style, index);
      this.skippedMainStyles.delete(style.id);
    } else {
      this.skippedMainStyles.set(style.id, style);
      warn(`Incorrect css:\n${style}`);
    }
  }

  /** @private */
  updateMainStyle(style, index) {
    if (this.mainStyles.has(style.id) && this.mainStyles.get(style.id).rules === style.rules)
      return;

    if (this.skippedMainStyles.has(style.id) && this.skippedMainStyles.get(style.id).rules === style.rules)
      return;

    this.injector.deleteMainStyle(index, 1);
    const inserted = this.injector.insertMainStyle(style, index);
    if (inserted) {
      this.mainStyles.set(style.id, style, index);
      this.skippedMainStyles.delete(style.id);
    } else {
      this.skippedMainStyles.set(style.id, style);
      warn(`Incorrect css:\n${style}`);
    }
  }

  /** @private */
  deleteMainStyle(id, index = null) {
    if (this.mainStyles.has(id)) {
      this.injector.deleteMainStyle(index, 1);
      this.mainStyles.delete(id, index);
    } else if (this.skippedMainStyles.has(id))
      this.skippedMainStyles.delete(id);
  }

  /** @private */
  addMediaStyle(style) {
    if (this.mediaStyles.has(style.id) || this.skippedMediaStyles.has(style.id))
      return;

    const inserted = this.injector.insertMediaStyle(style);
    if (inserted) {
      this.mediaStyles.set(style.id, style);
      this.skippedMediaStyles.delete(style.id);
    } else {
      this.skippedMediaStyles.set(style.id, style);
      warn(`Incorrect css:\n${style}`);
    }
  }

  /** @private */
  updateMediaStyle(style) {
    if (this.mediaStyles.has(style.id) && this.mediaStyles.get(style.id).rules === style.rules)
      return;

    if (this.skippedMediaStyles.has(style.id) && this.skippedMediaStyles.get(style.id).rules === style.rules)
      return;

    this.injector.deleteMediaStyle(style.id);

    const inserted = this.injector.insertMediaStyle(style);
    if (inserted) {
      this.mediaStyles.set(style.id, style);
      this.skippedMediaStyles.delete(style.id);
    } else {
      this.skippedMediaStyles.set(style.id, style);
      warn(`Incorrect css:\n${style}`);
    }
  }

  /** @private */
  deleteMediaStyle(id, index = null) {
    if (this.mediaStyles.has(id)) {
      this.injector.deleteMediaStyle(id);
      this.mediaStyles.delete(id, index);
    } else if (this.skippedMediaStyles.has(id))
      this.addMainStyle.skippedMediaStyles.delete(id);
  }
}
