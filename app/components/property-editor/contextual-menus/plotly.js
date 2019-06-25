import React, { Component } from "react";
import { observer } from "mobx-react";

import { ElementTypes } from "../../../constants";
import elements from "../../../elements";
import commonStyles from "../index.css";

const defaultPlotlySrc = elements[ElementTypes.PLOTLY].props.src;

const normalizeUrl = (url) => {
  let urlWithEmbedAndQuery = url;

  if (urlWithEmbedAndQuery.indexOf("~") !== -1) {
    if (urlWithEmbedAndQuery.indexOf(".embed") === -1) {
      const queryIndex = urlWithEmbedAndQuery.indexOf("?");

      if (queryIndex === -1) {
        urlWithEmbedAndQuery =
          /\/$/.test(urlWithEmbedAndQuery) ?
          `${urlWithEmbedAndQuery.slice(0, -1)}.embed`
          :
          `${urlWithEmbedAndQuery}.embed`;
      } else {
        urlWithEmbedAndQuery =
        `${urlWithEmbedAndQuery.slice(0, queryIndex)}.embed${urlWithEmbedAndQuery.slice(queryIndex)}`;
      }
    }

    if (urlWithEmbedAndQuery.indexOf("link=") === -1) {
      urlWithEmbedAndQuery = urlWithEmbedAndQuery.indexOf(".embed?") > -1 ?
      `${urlWithEmbedAndQuery}&link=false`
      :
      `${urlWithEmbedAndQuery}?link=false`;
    }
  }

  if (urlWithEmbedAndQuery.indexOf("http://") === 0 || urlWithEmbedAndQuery.indexOf("https://") === 0) {
    return urlWithEmbedAndQuery;
  }

  return `https://${urlWithEmbedAndQuery}`;
};

@observer
export default class PlotlyMenu extends Component {
  static contextTypes = {
    store: React.PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      src: undefined
    };
  }

  shouldComponentUpdate() {
    const { store: { currentElement } } = this.context;
    return currentElement && currentElement.type === ElementTypes.PLOTLY;
  }

  componentWillUnmount() {
    window.removeEventListener("click", this.handleClick);
    this.persistSource();
  }

  onInputKeyPress = (ev) => {
    if (ev.which === 13) {
      this.inputElement.blur();
    }
  }

  onSourceFocus = (ev) => {
    window.addEventListener("click", this.handleClick);
    ev.target.setSelectionRange(0, ev.target.value.length);

    const { currentSlideIndex, currentElementIndex } = this.context.store;
    this.currentSlideIndex = currentSlideIndex;
    this.currentElementIndex = currentElementIndex;
  }

  onSourceChange = ({ target: { value } }) => {
    this.setState({ src: value });
  }

  onSourceBlur = ({ target: { value } }) => {
    if (!value) {
      return;
    }
    this.persistSource(value);
    this.setState({ src: null });
  }

  persistSource = (value) => {
    const nextValue = value || this.state.src;

    if (!nextValue) {
      return;
    }

    if (typeof this.currentSlideIndex !== "undefined" &&
        typeof this.currentElementIndex !== "undefined") {
      this.context.store.updateElementProps(
        { src: normalizeUrl(nextValue) },
        this.currentSlideIndex,
        this.currentElementIndex
      );
    }
  }

  handleClick = (ev) => {
    if (ev.target !== this.inputElement) {
      this.inputElement.blur();
      window.removeEventListener("click", this.handleClick);
    }
  }

  render() {
    const { src } = this.state;
    const { store: { currentElement } } = this.context;
    let inputValue = "";

    if (currentElement && defaultPlotlySrc !== currentElement.props.src) {
      inputValue = currentElement.props.src;
    }

    if (typeof src !== "undefined") {
      inputValue = src;
    }

    return (
      <div className={commonStyles.wrapper}>
        {currentElement && (
          <div>
            <h3 className={commonStyles.heading}>Plotly & Dash</h3>
            <hr className={commonStyles.hr} />
            <p className={commonStyles.subHeading}>
              Embed Url
            </p>
            <input
              ref={(component) => {this.inputElement = component;}}
              onKeyPress={this.onInputKeyPress}
              className={`globalInput`}
              type="text"
              name="imagesSource"
              onFocus={this.onSourceFocus}
              onChange={this.onSourceChange}
              onBlur={this.onSourceBlur}
              value={inputValue}
            />
          </div>
        )}
      </div>
    );
  }
}
