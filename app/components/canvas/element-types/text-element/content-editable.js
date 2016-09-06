import React, { Component, PropTypes } from "react";
import { isEqual } from "lodash";

export default class ContentEditable extends Component {

  static propTypes = {
    tagName: PropTypes.string,
    html: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    disabled: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.emitChange = this.emitChange.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    // We need not rerender if the change of props simply reflects the user's
    // edits. Rerendering in this case would make the cursor/caret jump.
    return (
      // Rerender if there is no element yet... (somehow?)
      !this.htmlEl
      // ...or if html really changed... (programmatically, not by user edit)
      || (nextProps.html !== this.htmlEl.innerHTML
        && nextProps.html !== this.props.html)
      // ...or if editing is enabled or disabled.
      || this.props.disabled !== nextProps.disabled
      // ... or if tagName has changed
      || this.props.tagName !== nextProps.tagName
      // ... or if className has changed
      || this.props.className !== nextProps.className
      || !isEqual(this.props.style, nextProps.style)
    );
  }

  componentDidUpdate() {
    if (this.htmlEl && this.props.html !== this.htmlEl.innerHTML) {
      // Perhaps React (whose VDOM gets outdated because we often prevent
      // rerendering) did not update the DOM. So we update it manually now.
      this.htmlEl.innerHTML = this.props.html;
    }
  }

  sanitize() {
    // ensure that our contents are always wrapped in a div or li
    let html = this.htmlEl.innerHTML;
    const tagName = this.props.tagName === "div" ? "div" : "li";
    if (html.indexOf(`<${tagName}>`) !== 0) {
      html = `<${tagName}>${html || "<br>"}</${tagName}>`;
      this.htmlEl.innerHTML = html;
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStartAfter(this.htmlEl.childNodes[0]);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  emitChange() {
    if (!this.htmlEl) return;
    this.sanitize();
    const html = this.htmlEl.innerHTML;
    if (this.props.onChange && html !== this.lastHtml) {
      this.props.onChange(html);
    }
    this.lastHtml = html;
  }

  render() {
    const { tagName, html, onChange, ...props } = this.props; // eslint-disable-line no-unused-vars

    return React.createElement(
      tagName || "div",
      {
        ...props,
        ref: (e) => { this.htmlEl = e; },
        onInput: this.emitChange,
        onBlur: this.props.onBlur || this.emitChange,
        contentEditable: !this.props.disabled,
        dangerouslySetInnerHTML: { __html: html }
      },
      this.props.children);
  }
}
