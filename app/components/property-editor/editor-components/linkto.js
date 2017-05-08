import React, { Component } from "react";
import { ERROR } from "../../../assets/icons";
import styles from "./linkto.css";

const normalizeUrl = (url) => {
  if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
    return url;
  }

  return `http://${url}`;
};

export default class LinkTo extends Component {
  static contextTypes = {
    store: React.PropTypes.object
  }

  static propTypes = {
    currentElement: React.PropTypes.object
  }

  constructor(props) {
    super(props);
    this.state = {
      value: props.currentElement.props.href || "",
      invalid: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.currentElement && nextProps.currentElement.props) {
      if (nextProps.currentElement.props.href !== this.state.value) {
        this.setState({ value: nextProps.currentElement.props.href || "", invalid: false });
      }
    }
  }

  onUrlChange = (ev) => {
    const url = ev.target.value;

    this.setState({
      value: url,
      invalid: /^javascript:/i.test(url)
    });
  }

  onBlurUrl = () => {
    let href;
    if (this.state.invalid || !this.state.value || this.state.value.length === 0) {
      href = null;
    } else {
      href = normalizeUrl(this.state.value);
    }

    const propUpdates = { href };
    const { style } = this.context.store.currentElement.props;
    if (style) {
      propUpdates.style = { ...style, textDecoration: "none" };
    }

    this.context.store.updateElementProps(propUpdates);
  }

  render() {
    return (
      <div className={styles.wrapper}>
        <input
          className={styles.inputBox}
          placeholder="http://"
          type="text"
          onChange={this.onUrlChange}
          onBlur={this.onBlurUrl}
          value={this.state.value || ""}
        />
        {this.state.invalid &&
          <div
            className={styles.errorIcon}
            title="Invalid url"
            dangerouslySetInnerHTML={{ __html: ERROR }}
          />}
      </div>
    );
  }
}
