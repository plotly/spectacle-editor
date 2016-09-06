import React, { Component, PropTypes } from "react";
import ReactDOM from "react-dom";
import { map, omit, pick } from "lodash";
import { observer } from "mobx-react";
import classNames from "classnames";

import CanvasElement, { CanvasElementPropTypes } from "../../canvas-element";

import styles from "./index.css";
import ContentEditable from "./content-editable";

@observer
export default class TextElement extends Component {
  static propTypes = {
    ...CanvasElementPropTypes,
    rect: PropTypes.object,
    component: PropTypes.shape({
      props: PropTypes.object,
      children: PropTypes.node,
      defaultText: PropTypes.array
    })
  }

  static contextTypes = {
    store: PropTypes.object
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      editing: false,
      htmlContent: this.getHtmlFromProps(props)
    };
  }

  componentWillMount() {
    this.updateHtmlContent(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.isEditing) {
      if (!nextProps.isSelected) {
        this.stopEditing();
        this.captureUp = false;
      }
    } else {
      this.updateHtmlContent(nextProps);
    }
  }

  getHtmlFromProps = (props) => {
    const listType = props.component.props.listType;
    this.lastListType = listType;
    const defaultHtml = this.childrenToHtmlString(listType, props.component.defaultText);
    if (props.component.children) {
      const html = this.childrenToHtmlString(listType, props.component.children);
      return html || defaultHtml;
    }

    return defaultHtml;
  }

  getSize = () => {
    const componentProps = this.props.component.props;
    let width = componentProps.style.width;
    if (!width) {
      width = parseFloat(window.getComputedStyle(this.inputElement).width, 10);
    }
    return {
      height: this.inputElement.clientHeight,
      width,
      left: componentProps.style.left,
      top: componentProps.style.top
    };
  }

  escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  childrenToHtmlString = (listType, children) => {
    const tag = listType ? "li" : "div";
    return map(children, (line) => (
      `<${tag}>${this.escapeHtml(line).replace(/\n/g, "<br>") || "<br>"}</${tag}>`)
    ).join("");
  }

  stopEditing = () => {
    this.setState({ isEditing: false });
  }

  startEditing = (e) => {
    // Keep track of current slide and element in case we're deselected before we persist changes
    this.currentSlideIndex = this.context.store.currentSlideIndex;
    this.currentElementIndex = this.context.store.currentElementIndex;
    const clientX = e.clientX;
    const clientY = e.clientY;

    let { htmlContent } = this.state;
    const { component } = this.props;
    const defaultText = this.childrenToHtmlString(component.props.listType, component.defaultText);
    if (htmlContent === defaultText) {
      htmlContent = "";
    }
    this.setState({ isEditing: true, htmlContent }, () => {
      this.inputElement.focus();
      if (htmlContent !== "") {
        const range = document.caretRangeFromPoint(clientX, clientY);
        window.getSelection().collapse(range.startContainer, range.startOffset);
      }
    });
  }

  persistChanges = () => {
    this.context.store.updateChildren(
      this.domToChildren(this.inputElement),
      this.currentSlideIndex,
      this.currentElementIndex
    );

    if (!this.state.htmlContent) {
      const { component } = this.props;
      this.setState({
        htmlContent: this.childrenToHtmlString(component.props.listType,
                                               component.defaultText)
      });
    }
  }

  handleMouseDown = (e) => {
    if (this.props.isSelected && !this.state.isEditing) {
      this.captureUp = true;
    }
    if (this.state.isEditing) {
      e.stopPropagation();
    }
  }

  handleMouseUp = (e) => {
    if (this.captureUp && this.props.isSelected &&
        !this.props.isDragging && !this.state.isEditing) {
      this.startEditing(e);
    }
    this.captureUp = false;
  }

  handleBlur = () => {
    this.stopEditing();
    this.persistChanges();
  }

  handleChange = (html) => {
    this.setState({ htmlContent: html });
  }

  handleKeyDown = (e) => {
    const superKey = process.platform === "darwin" ? e.metaKey : e.ctrlKey;
    // undo super+z, stop propagation so as not to trigger global undo
    if (superKey && e.which === 90 && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      document.execCommand("undo");
    }

    // undo super+shift+z, stop propagation so as not to trigger global redo
    if (superKey && e.which === 90 && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      document.execCommand("redo");
    }

    // escape will finalze edit, trigger blur
    if (e.which === 27) {
      e.preventDefault();
      this.inputElement.blur();
      this.handleBlur();
    }
  }

  // return an array of string lines, with inner <br>s converted to \n
  domToChildren = (root) => (
     map(root.childNodes, (child) => child.innerText || child.textContent)
  )

  updateHtmlContent = (props) => {
    this.setState({
      htmlContent: this.getHtmlFromProps(props)
    });
  }

  render() {
    const componentProps = this.props.component.props;

    let tagName = "div";
    if (componentProps.listType === "ordered") {
      tagName = "ol";
    } else if (componentProps.listType === "unordered") {
      tagName = "ul";
    }

    const classes = classNames({
      [styles.content]: true,
      [styles.quote]: componentProps.isQuote
    });

    let width = componentProps.style.width ? componentProps.style.width : "auto";
    width = this.props.rect ? this.props.rect.width : width;

    return (
      <CanvasElement
        {...pick(this.props, Object.keys(CanvasElementPropTypes))}
        resizeHorizontal={this.props.resizeHorizontal && !this.state.isEditing}
        resizeVertical={false}
        canArrange={this.props.canArrange && !this.state.isEditing}
        getSize={this.getSize}
      >
        <ContentEditable
          style={{
            ...this.context.store.paragraphStyles[componentProps.paragraphStyle],
            ...omit(componentProps.style, "position", "left", "top", "height"),
            width
          }}
          className={classes}
          tagName={tagName}
          ref={el => { this.inputElement = ReactDOM.findDOMNode(el); }}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          onMouseUp={this.handleMouseUp}
          onMouseDown={this.handleMouseDown}
          onBlur={this.handleBlur}
          html={this.state.htmlContent}
          disabled={!this.state.isEditing}
        />
      </CanvasElement>
    );
  }
}
