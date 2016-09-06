import { ipcRenderer } from "electron";
import { observable, computed, transaction, asReference } from "mobx";
import Immutable from "seamless-immutable";
import { generate } from "shortid";
import { merge, mergeWith, pick, omit } from "lodash";

import ApiStore from "./api-store";
import elementMap from "../elements";
import { getParagraphStyles } from "../utils";

const defaultParagraphStyles = {
  "Heading 1": getParagraphStyles({ fontSize: 26 }),
  "Heading 2": getParagraphStyles({ fontSize: 20 }),
  "Heading 3": getParagraphStyles({ fontSize: 11, fontWeight: 700 }),
  Body: getParagraphStyles({ fontSize: 11 }),
  "Body Small": getParagraphStyles({ fontSize: 10 }),
  Caption: getParagraphStyles({ fontSize: 11, fontStyle: "italic" })
};

export default class SlidesStore {
  // Default slides state
  // history will be an array of slides arrays
  @observable history = asReference(Immutable.from([{
    currentSlideIndex: 0,
    currentElementIndex: null,
    paragraphStyles: merge({}, defaultParagraphStyles),
    slides: [{
      // Default first slide
      id: generate(),
      props: { style: {}, transition: ["slide"] },
      children: []
    }, {
      id: generate(),
      props: { style: {}, transition: ["slide"] },
      children: []
    }, {
      id: generate(),
      props: { style: {}, transition: ["slide"] },
      children: []
    }, {
      id: generate(),
      props: { style: {}, transition: ["slide"] },
      children: []
    }, {
      id: generate(),
      props: { style: {}, transition: ["slide"] },
      children: []
    }
  ] }]));

  @observable historyIndex = 0;

  @observable slidePreviews = new Array(500);

  // Slide info
  @observable width = 0;
  @observable height = 0;
  @observable left = 0;
  @observable top = 0;
  @observable scale = 1;

  // Needed for handling cursor state and pointer events
  @observable isDragging = false;
  @observable cursorType = null;
  @observable isResizing = false;
  @observable isDraggingSlide = false;
  @observable isDraggingElement = false;
  @observable isDraggingNewElement = false;

  // TODO: move user to own store
  @observable user = null;

  // Returns a new mutable object. Functions as a cloneDeep.
  @computed get slides() {
    return this.history[this.historyIndex].slides.asMutable({ deep: true });
  }

  @computed get paragraphStyles() {
    return this.history[this.historyIndex].paragraphStyles.asMutable({ deep: true });
  }

  @computed get currentSlideIndex() {
    return this.history[this.historyIndex].currentSlideIndex;
  }

  @computed get currentElementIndex() {
    return this.history[this.historyIndex].currentElementIndex;
  }

  // Returns a new mutable object. Functions as a cloneDeep.
  @computed get currentSlide() {
    return this.slides[this.currentSlideIndex];
  }

  // Returns a new mutable object. Functions as a cloneDeep.
  @computed get currentElement() {
    return (this.currentElementIndex === 0 || this.currentElementIndex) ?
      this.currentSlide.children[this.currentElementIndex] :
      null;
  }

  @computed get undoDisabled() {
    return this.historyIndex === 0 || this.history.length <= 1;
  }

  @computed get redoDisabled() {
    return this.historyIndex >= this.history.length - 1;
  }

  @computed get currentState() {
    return this.history[this.historyIndex].asMutable({ deep: true });
  }

  constructor(fileStore, slides) {
    this.fileStore = fileStore;
    this.api = new ApiStore();

    if (slides) {
      this.history = Immutable.from([{
        currentSlideIndex: 0,
        currentElementIndex: null,
        slides
      }]);
    }

    ipcRenderer.on("trigger-update", () => {
      ipcRenderer.send("update-presentation", {
        slides: this.slides,
        paragraphStyles: this.history[this.historyIndex].paragraphStyles,
        currentSlideIndex: this.currentSlideIndex
      });
    });

    ipcRenderer.on("slide-preview-image", (event, data) => {
      const { image, slideIndex } = data;

      if (image) {
        this.slidePreviews[slideIndex] = `data:image/png;base64, ${image}`;
      }
    });
  }

  // TODO: Move user to own store
  setUser(userInfo) {
    this.user = userInfo;
  }

  setCanvasSize({ width, height, left, top, scale }) {
    transaction(() => {
      this.width = width;
      this.height = height;
      this.left = left;
      this.top = top;
      this.scale = scale;
    });
  }

  dropElement(elementType, extraProps) {
    const slideToAddTo = this.currentSlide;
    const newSlidesArray = this.slides;
    const newParagraphStyles = this.paragraphStyles;
    const element = elementMap[elementType];
    const mergedProps = merge(element.props, extraProps);

    slideToAddTo.children.push({
      ...element,
      props: mergedProps,
      id: generate()
    });

    newSlidesArray[this.currentSlideIndex] = slideToAddTo;

    this._addToHistory({
      currentSlideIndex: this.currentSlideIndex,
      currentElementIndex: slideToAddTo.children.length - 1,
      slides: newSlidesArray,
      paragraphStyles: newParagraphStyles
    });
  }

  setCurrentElementIndex(newIndex) {
    const snapshot = this.currentState;
    snapshot.currentElementIndex = newIndex;

    transaction(() => {
      const left = this.history.slice(0, this.historyIndex);
      const right = this.history.slice(this.historyIndex + 1, this.history.length);
      this.history = left.concat([snapshot], right);
    });
  }

  setSelectedSlideIndex(newSlideIndex) {
    const snapshot = this.currentState;
    snapshot.currentElementIndex = null;
    snapshot.currentSlideIndex = newSlideIndex;

    transaction(() => {
      const left = this.history.slice(0, this.historyIndex);
      const right = this.history.slice(this.historyIndex + 1, this.history.length);
      this.history = left.concat([snapshot], right);
    });
  }

  moveSlide(currentIndex, newIndex) {
    const slidesArray = this.slides;
    const newParagraphStyles = this.paragraphStyles;

    slidesArray.splice(newIndex, 0, slidesArray.splice(currentIndex, 1)[0]);

    transaction(() => {
      this.slidePreviews.splice(newIndex, 0, this.slidePreviews.splice(currentIndex, 1)[0]);
      this._addToHistory({
        paragraphStyles: newParagraphStyles,
        currentSlideIndex: newIndex,
        slides: slidesArray
      });
    });
  }

  addSlide() {
    const slidesArray = this.slides;
    const newParagraphStyles = this.paragraphStyles;

    const newSlide = {
      id: generate(),
      props: { style: {}, transition: ["slide"] },
      children: []
    };

    const index = this.currentSlideIndex + 1;
    slidesArray.splice(index, 0, newSlide);

    transaction(() => {
      this.slidePreviews.splice(index, 0, null);
      this._addToHistory({
        paragraphStyles: newParagraphStyles,
        currentSlideIndex: index,
        currentElementIndex: null,
        slides: slidesArray
      });
    });
  }

  deleteSlide() {
    const slidesArray = this.slides;
    const newParagraphStyles = this.paragraphStyles;
    const index = this.currentSlideIndex === 0 ? 0 : this.currentSlideIndex - 1;

    slidesArray.splice(this.currentSlideIndex, 1);

    transaction(() => {
      this.slidePreviews.splice(this.currentSlideIndex, 1);
      this._addToHistory({
        paragraphStyles: newParagraphStyles,
        currentSlideIndex: index,
        currentElementIndex: null,
        slides: slidesArray
      });
    });
  }

  setCurrentElementToFrontOrBack(toFront) {
    if (!this.currentElement) {
      return;
    }

    transaction(() => {
      const slidesArray = this.slides;
      const currentChildren = slidesArray[this.currentSlideIndex].children;
      const currentChild = currentChildren.splice(this.currentElementIndex, 1);
      const newParagraphStyles = this.paragraphStyles;
      let index;

      if (toFront) {
        slidesArray[this.currentSlideIndex]
          .children = currentChildren.concat(currentChild);
        index = slidesArray[this.currentSlideIndex].children.length - 1;
      } else {
        slidesArray[this.currentSlideIndex]
          .children = currentChild.concat(currentChildren);
        index = 0;
      }

      this._addToHistory({
        paragraphStyles: newParagraphStyles,
        currentSlideIndex: this.currentSlideIndex,
        currentElementIndex: index,
        slides: slidesArray
      });
    });
  }

  incrementCurrentElementIndexBy(num) {
    const slidesArray = this.slides;
    const currentChildren = slidesArray[this.currentSlideIndex].children;

    if (
      !this.currentElement ||
      num + this.currentElementIndex < 0 ||
      num + this.currentElementIndex >= currentChildren.length
    ) {
      return;
    }

    transaction(() => {
      const currentChild = currentChildren[this.currentElementIndex];
      const sibling = currentChildren[this.currentElementIndex + num];
      const newParagraphStyles = this.paragraphStyles;

      currentChildren[this.currentElementIndex] = sibling;
      currentChildren[this.currentElementIndex + num] = currentChild;

      this._addToHistory({
        paragraphStyles: newParagraphStyles,
        currentSlideIndex: this.currentSlideIndex,
        currentElementIndex: this.currentElementIndex + num,
        slides: slidesArray
      });
    });
  }

  deleteCurrentElement() {
    if (!this.currentElement) {
      return;
    }

    const nextState = this.currentState;

    nextState.slides[this.currentSlideIndex].children.splice(this.currentElementIndex, 1);
    nextState.currentElementIndex = null;

    this._addToHistory(nextState);
  }

  updateElementDraggingState(isDraggingElement, isDraggingNewElement = false) {
    transaction(() => {
      this.isDragging = isDraggingElement;
      this.isDraggingElement = isDraggingElement;
      this.isDraggingNewElement = isDraggingNewElement;
    });
  }

  updateElementResizeState(isResizingElement, cursor = null) {
    transaction(() => {
      this.cursorType = cursor;
      this.isResizing = isResizingElement;
    });
  }

  updateSlideDraggingState(isDraggingSlide) {
    transaction(() => {
      this.isDragging = isDraggingSlide;
      this.isDraggingSlide = isDraggingSlide;
    });
  }

  updateElementProps(props, currentSlideIndex, currentElementIndex) {
    const slideIndex = typeof currentSlideIndex === "number" ?
      currentSlideIndex
      :
      this.currentSlideIndex;

    const elementIndex = typeof currentElementIndex === "number" ?
      currentElementIndex
      :
      this.currentElementIndex;

    const currentElement = this.slides[slideIndex].children[elementIndex] || this.currentElement;

    if (!currentElement) {
      return;
    }

    const { paragraphStyle } = currentElement.props;
    const newProps = merge(currentElement.props, props);
    const newState = this.currentState;

    if (
      paragraphStyle !== props.paragraphStyle &&
      props.style &&
      !Object.keys(props.style).length
    ) {
      // if paragraph style changes, remove all added styles, but not any other ones affecting
      // position and word wrap
      newProps.style = omit(newProps.style, Object.keys(newState.paragraphStyles[paragraphStyle]));
    }

    newState.slides[slideIndex].children[elementIndex].props = newProps;
    this._addToHistory(newState);
  }

  updateSlideProps(props) {
    if (!this.currentSlide) {
      return;
    }

    const newProps = mergeWith(this.currentSlide.props, props, (originalVal, newVal) => {
      if (Array.isArray(newVal)) {
        return newVal;
      }
    });

    const newState = this.currentState;
    newState.slides[this.currentSlideIndex].props = newProps;
    this._addToHistory(newState);
  }

  updateParagraphStyles(name, styles) {
    const newParagraphStyles = this.paragraphStyles;
    const filteredParagraphStyles = pick(styles, Object.keys(newParagraphStyles[name]));
    const filteredElementStyles = omit(styles, Object.keys(newParagraphStyles[name]));
    const slidesArray = this.slides;

    slidesArray[this.currentSlideIndex]
      .children[this.currentElementIndex]
      .props
      .style = filteredElementStyles;

    newParagraphStyles[name] = { ...newParagraphStyles[name], ...filteredParagraphStyles };

    this._addToHistory({
      paragraphStyles: newParagraphStyles,
      currentSlideIndex: this.currentSlideIndex,
      currentElementIndex: this.currentElementIndex,
      slides: slidesArray
    });
  }

  updateChildren(nextChild, slideIndex, elementIndex) {
    const newState = this.currentState;

    newState.slides[slideIndex].children[elementIndex].children = nextChild;
    this._addToHistory(newState);
  }

  undo() {
    // double check we're not trying to undo without history
    if (this.historyIndex === 0) {
      return;
    }

    this.historyIndex -= 1;

    if (this.historyIndex === 0 && this.fileStore.isDirty) {
      this.fileStore.setIsDirty(false);
    }
  }

  redo() {
    // Double check we've got a future to redo to
    if (this.historyIndex >= this.history.length - 1) {
      return;
    }

    this.historyIndex += 1;

    if (!this.fileStore.isDirty) {
      this.fileStore.setIsDirty(true);
    }
  }

  _addToHistory(snapshot) {
    // Only notify observers once all expressions have completed
    transaction(() => {
      // If we have a future and we do an action, remove the future.
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }

      // Wrap the new slides array in an array so they aren't concatted as individual slide objects
      this.history = this.history.concat([Immutable.from(snapshot)]);
      this.historyIndex += 1;

      // Cap history to 40 entries
      if (this.history.length > 40) {
        this.history = this.history.slice(1, this.history.length);
        this.historyIndex -= 1;
      }

      if (!this.fileStore.isDirty) {
        this.fileStore.setIsDirty(true);
      }
    });

    ipcRenderer.send("update-presentation", {
      slides: this.slides,
      paragraphStyles: this.history[this.historyIndex].paragraphStyles,
      currentSlideIndex: this.currentSlideIndex
    });
  }

  serialize() {
    return {
      slidePreviews: this.slidePreviews,
      slides: this.slides,
      paragraphStyles: this.paragraphStyles
    };
  }

  deserialize(newPres) {
    const { slides, slidePreviews, paragraphStyles } = newPres;
    const hydratedSlides = slides.map((slide) => ({
      ...slide,
      children: slide.children.map((childObj) => ({
        ...childObj,
        ComponentClass: elementMap[childObj.type].ComponentClass
      }))
    }));

    transaction(() => {
      this.historyIndex = 0;
      this.history = Immutable.from([{
        currentSlideIndex: 0,
        currentElementIndex: null,
        slides: hydratedSlides,
        paragraphStyles: paragraphStyles || defaultParagraphStyles
      }]);

      if (slidePreviews) {
        this.slidePreviews = slidePreviews;
      }
    });
  }
}
